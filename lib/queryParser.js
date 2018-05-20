const trav = require('traverse')
const _ = require('lodash')

module.exports = function (db) {

  const getKeys = function (query) {

    // Verify query
    var verifiedQuery = {}
    //    console.log(JSON.stringify(query, null, 2))
    trav(query).forEach(function(node) {
      // strip all array indexes and replace with _Array so that you can non
      // positionally retrieve array elements
      var path = this.path.map(item => {
        if (!isNaN(item)) return '_Array'
        return item
      })
      if (this.isLeaf) {
        if (path[path.length - 2] === '_AND') {
          //_AND specified
          var key = path.slice(0, path.length - 2).join('.')
          verifiedQuery[key] = verifiedQuery[key] || {}
          verifiedQuery[key]._AND = verifiedQuery[key]._AND || []
          verifiedQuery[key]._AND.push(this.node)
        } else if (path[path.length - 2] === '_NOT') {
          //_NOT specified
          var key = path.slice(0, path.length - 2).join('.')
          verifiedQuery[key] = verifiedQuery[key] || {}
          verifiedQuery[key]._NOT = verifiedQuery[key]._NOT || []
          verifiedQuery[key]._NOT.push(this.node)
        } else if (path[path.length - 2] === '_OR') {
          //_OR specified
          var key = path.slice(0, path.length - 2).join('.')
          verifiedQuery[key] = verifiedQuery[key] || {}
          verifiedQuery[key]._OR = verifiedQuery[key]._OR || []
          verifiedQuery[key]._OR.push(this.node)
        } else if (Array.isArray(this.parent.node)) {
          // array without _AND, _OR, or _NOT specified (default to _AND)
          console.log('XXXXXXXX')
          var path = path.slice(0, path.length - 1).join('.')
          verifiedQuery[path] = verifiedQuery[path] || {
            _AND: []
          }
          verifiedQuery[path]._AND.push(this.node)
        } else {
          // single string (default to _AND)
          verifiedQuery[path.join('.')] = {
            _AND: [ this.node ]
          }
        }
      }
    })

    var dbKeys = {
      _AND: [],
      _NOT: [],
      _OR: []
    }

    
    for (field in verifiedQuery) {
      if (verifiedQuery[field]._AND)
        dbKeys._AND = dbKeys._AND.concat(verifiedQuery[field]._AND.map(item => {
          return field + '.' + item
        }))
      if (verifiedQuery[field]._OR)
        dbKeys._OR = dbKeys._OR.concat(verifiedQuery[field]._OR.map(item => {
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
    console.log(JSON.stringify(q, null, 2))
    return new Promise((resolve, reject) => {
      Promise.all(
        q.dbKeys._AND.map(key => db.get(key))
//          .concat(q.dbKeys._OR.map(key => db.get(key)))
      ).then(results => {
        var resultMap = {
          _AND: {}    // <- should be called _MAP
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

        // TODO: insert ORs as ANDable clauses


        // flatten into one big ANDable array
        resultMap._AND = Object.keys(resultMap._AND).reduce((acc, fieldName) => {
          return acc.concat(resultMap._AND[fieldName])
        }, []).sort((a, b) => {
          if (a.docId < b.docId) return -1;
          if (a.docId > b.docId) return 1;
          return 0;
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
    console.log(JSON.stringify(m, null, 2))
    // Need to know total AND clauses being evaluated
    var totalANDClauses = Object.keys(m.verifiedQuery).reduce((acc, cur) => {
      if (m.verifiedQuery[cur]._AND)
        return acc + m.verifiedQuery[cur]._AND.length
      return acc
    }, 0)
    var ORClauseNames = Object.keys(m.verifiedQuery).map(keyName => {
      if (m.verifiedQuery[keyName]._OR) return keyName
    })
    console.log('ORClauseNames ->')
    console.log(ORClauseNames)
    // reduce array to only contain documents with all elements of the AND clause
    // (its nice to do it this way becuase it only requires one pass)
    m.map._AND_CLAUSE_RESULTS = m.map._AND.reduce((acc, cur, i) => {

      acc.tmp.push(cur)
      if (acc.tmp.length == totalANDClauses) {
        if (cur.docId == acc.tmp[0].docId) {
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
//    console.log(JSON.stringify(m, null, 2))
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
