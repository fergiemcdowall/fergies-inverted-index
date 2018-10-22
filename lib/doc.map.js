const _ = require('lodash')

module.exports = function (db) {

  const dbLookupKey = function (key) {
    return new Promise ((resolve, reject) => {
      // to allow for nested promises
      // if this is a promise then resolve that
      if (key instanceof Promise) return resolve(key)
      // or else just look up the key
      db.get(key).then(values => resolve(
        values.map(id => {
          return {
            match: key,
            _id: id
          }
        })
      ))
    })
  }

    
  const OR = function (keys) {
    return new Promise ((resolve, reject) => {
      Promise.all(
        keys.map(key => dbLookupKey(key))
      ).then(sets => {
        // flatten
        sets = [].concat.apply([], sets)
        var setObject = sets.reduce((acc, cur) => {
          acc[cur._id] = acc[cur._id] || []
          acc[cur._id].push(cur.match)
          return acc
        }, {})
        resolve(Object.keys(setObject).map(id => {
          return {
            _id: id,
            match: setObject[id]
          }
        }))
      })
    })
  }

  const AND = function (keys) {
    return new Promise((resolve, reject) => {
      OR(keys).then(result => resolve(
        // returns an intersection
        result.filter(item => (item.match.length === keys.length))
      ))
    })
  }

  // is this needed or should this be under a getObject endpoint?
  const EACH = function (keys) {
    return new Promise((resolve, reject) => {
      Promise.all(
        keys.map(key => db.get(key))
      ).then(result => {
        return resolve(
          keys.map((key, i) => {
            return {
              property: key,
              objectIds: result[i]
            }
          })
        )
      })
    })
  }

  const RANGE = function (ops) {
    const s = {}
    return new Promise ((resolve, reject) => {
      db.createReadStream(ops)
        .on('data', data =>
          data.value.forEach(objectId => {
            s[objectId] = s[objectId] || []
            s[objectId].push(data.key)
          })
        ).on('end', () => {
          return resolve(
            Object.keys(s).map(id => {
              return {
                _id: id,
                match: s[id]
              }
            })
          )}
        )
    })
  }
  
  return {
    AND: AND,
    EACH: EACH,
    OR: OR,
    RANGE: RANGE
  }
}
