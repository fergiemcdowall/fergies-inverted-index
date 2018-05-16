const trav = require('traverse')
const _ = require('lodash')

module.exports = function (db) {

  const getKeys = function (query) {

    // Verify query
    var verifiedQuery = {}
    trav(query).forEach(function(node) {
      // strip all array indexes and replace with _Array so that you can non
      // positionally retrieve array elements
      var path = this.path.map(item => {
        if (!isNaN(item)) return '_Array'
        return item
      })
      if (this.isLeaf) {
        if (Array.isArray(this.parent.node)) {
          var path = path.slice(0, path.length - 1).join('.')
          verifiedQuery[path] = verifiedQuery[path] || {
            _AND: []
          }
          verifiedQuery[path]._AND.push(this.node)
        } else {
          if (path[path.length - 2] === '_AND') {
            var key = path.slice(0, path.length - 2).join('.')
            verifiedQuery[key] = verifiedQuery[key] || {}
            verifiedQuery[key]._AND = verifiedQuery[key]._AND || []
            verifiedQuery[key]._AND.push(this.node)
          } else if (path[path.length - 2] === '_NOT') {
            var key = path.slice(0, path.length - 2).join('.')
            verifiedQuery[key] = verifiedQuery[key] || {}
            verifiedQuery[key]._NOT = verifiedQuery[key]._NOT || []
            verifiedQuery[key]._NOT.push(this.node)
          } 
          else {
            verifiedQuery[path.join('.')] = {
              _AND: [ this.node ]
            }
          }
        }
      }
    })

    var dbKeys = {
      _AND: [],
      _NOT: []
    }
    
    for (field in verifiedQuery) {
      dbKeys._AND = dbKeys._AND.concat(verifiedQuery[field]._AND.map(item => {
        return field + '.' + item
      }))
    }

    // transform query into db keys
    return {
      verifiedQuery: verifiedQuery,
      dbKeys: dbKeys
    }

  }

  // use the keys to get docId sets out of the db
  const getMap = function (q) {
    return new Promise((resolve, reject) => {
      Promise.all(
        q.dbKeys._AND.map(key => db.get(key))
      ).then(results => {
        var resultMap = {
          _AND: {}
        }
        q.dbKeys._AND.forEach(key => {
          resultMap._AND[key] = results.shift().map(item => {
            return {
              field: key.split('.').slice(0, key.length - 1)[0],
              value: key.split('.').pop(),
              docId: item
            }
          })
        })
        // flatten into one big ANDable array
        resultMap._AND = Object.keys(resultMap._AND).reduce((acc, fieldName) => {
          return acc.concat(resultMap._AND[fieldName])
        }, []).sort((a, b) => {
          return a.docId - b.docId
        })
        
        return resolve({
          verifiedQuery: q.verifiedQuery,
          map: resultMap
        })
      })
      
    })

  }

  // Turn the ANDable list of docIds into actual results
  const reduceMap = function (m) {
    // Need to know total AND clauses being evaluated
    var totalANDClauses = Object.keys(m.verifiedQuery).reduce((acc, cur) => {
      return acc + m.verifiedQuery[cur]._AND.length
    }, 0)
    // reduce array to only contain documents with all elements of the AND clause
    // (its nice to do it this way becuase it only requires one pass)
    m.map._AND_CLAUSE_RESULTS = m.map._AND.reduce((acc, cur) => {
      acc.tmp.push(cur)
      if (acc.tmp.length == totalANDClauses) {
        var allTheSame = true
        acc.tmp.forEach(item => {
          if (item.docId !== acc.tmp[0].docId) allTheSame = false
        })
        if (allTheSame) {
          acc.save = acc.save.concat({
            docId: acc.tmp[0].docId,
            _AND: acc.tmp.map(item => {
              delete item.docId
              return item
            })
          })
          acc.tmp = []
        }
        acc.tmp.shift()
      }      
      return acc
    }, {
      tmp: [],
      save: []
    }).save

    // TODO: ORing

    return m
  }


  
  const parse = function (query) {

    return new Promise ((resolve, reject) => {
      getMap(getKeys(query))
        .then(map => resolve(reduceMap(map)))
    })
    
  }


  
  return {
    parse: parse
  }
}
