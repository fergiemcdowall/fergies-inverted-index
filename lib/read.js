const trav = require('traverse')
const qp = require('./query.js')

module.exports = function (db) {

  // TODO: query language- it would be good if { countrycode: [ 'EN' ] } could
  // hit all the documents with { _countrycode: [ 'EN' ] }
  
  // IDEA: { ?*countrycode: [ 'EN', 'IN', 'NO' ] } <- ANY of these
  //       { ?+countrycode: [ 'EN', 'IN', 'NO' ] } <- ALL of these
  //       { !*countrycode: [ 'EN', 'IN', 'NO' ] } <- EXCLUDING ANY of these
  //       { !*countrycode: [ 'EN', 'IN', 'NO' ] } <- EXCLUDING ALL of these

  // TODO: sorting

  // TODO: can send functions to work on the array?



  // first get MAP
  // secondly REDUCE
  
  // {
  //   Map: {
  //     totalcommamt: {
  //       AND: [],
  //       OR: [],
  //       NOT: []
  //     },
  //     reduce: results => {
  //       arr.map(result => {
  //         return item.id
  //       })
  //     }
  //   }
  // }


  
  const getDoc = function (docId) {
    return new Promise(resolve => db.get('!DOC￮' + docId + '￮').then(resolve))
  }

  const getDocs = function (docIds) {
    return new Promise(resolve => Promise.all(docIds.map(getDoc)).then(resolve))
  }

  const reduceResults = function (map) {
    // TODO: NOTing
    // TODO: sorting
    resultSet = map._RESULTS.map(res => res.docId)
    return getDocs(resultSet)
  }

  
  const get = function (query) {
    return qp(db)
      .mapResults(query.select)
      .then(reduceResults)
  }
  
  return {
    get: get
  }
}
