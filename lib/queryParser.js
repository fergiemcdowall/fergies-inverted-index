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
        console.log(path[path.length - 2])
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
          console.log('YO THIS IS OR')
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
        // note this is a push
        dbKeys._OR.push(verifiedQuery[field]._OR.map(item => {
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

    var dbKeys = q.dbKeys._AND.concat(_.flatten(q.dbKeys._OR))
    console.log(dbKeys)
    
    return new Promise((resolve, reject) => {
      Promise.all(
        dbKeys.map(key => db.get(key))
      ).then(results => {
        var resultMap = {}
        console.log('results ->')
        console.log(results)
        dbKeys.forEach(key => {
          results.shift().forEach(docId => {
            resultMap[docId] = resultMap[docId] || []
            resultMap[docId].push(key)
          })
        })

        
        return resolve({
          verifiedQuery: q.verifiedQuery,
          dbKeys: q.dbKeys,
          map: resultMap
        })
      })
      
    })

  }

  // Turn the ANDable list of docIds into actual results
  const reduceMap = function (m) {
    console.log(JSON.stringify(m, null, 2))
    // Need to know total AND clauses being evaluated
    var ORClauseNames = Object.keys(m.verifiedQuery).map(keyName => {
      if (m.verifiedQuery[keyName]._OR) return keyName
    }).filter(item => item)

    m.map._RESULTS = Object.keys(m.map).map(docId => {
      // if no _ANDs are specified, dont consider them
      var ANDclausesSatisfied =
          (m.dbKeys._AND.length === 0) || _.isEqual(m.dbKeys._AND, m.map[docId])
      var ORclausesSatisfied = m.dbKeys._OR.reduce((acc, cur) => {
        if (_.intersection(m.map[docId], cur).length == 0)
          acc = false
        return acc
      }, true)
      
      if (ANDclausesSatisfied && ORclausesSatisfied) return {
        docId: docId,
        keys: m.map[docId]
      }
    }).filter(i => i)
    
    
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
