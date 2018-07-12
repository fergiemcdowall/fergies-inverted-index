const _ = require('lodash')

module.exports = function (db) {

  const dbLookupKey = function (key) {
    return new Promise ((resolve, reject) => {
      if ((typeof key) == 'object') return resolve(key)
        db.get(key).then(set => resolve(
          set.map(id => {
          return {
            match: key,
            _id: id
          }
        })
      ))
    })
  }

  const RAN = function (gt, lt) {
    var setObject = {}
    return new Promise ((resolve, reject) => {
      db.createReadStream({
        gt: gt,
        lt: lt
      }).on('data', data => {
        setObject[data.value] = setObject[data.value] || []
        setObject[data.value].push(data.value)
      }).on('end', () => {
        return resolve(Object.keys(setObject).map(id => {
          return {
            _id: id,
            match: setObject[id]
          }
        }))
      })
    })
  }
  
  const ANY = function (keys) {
    // returns an intersection
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

  const ALL = function (keys) {
    return new Promise((resolve, reject) => {
      ANY(keys).then(result => resolve(
        result.filter(item => (item.match.length === keys.length))
      ))
    })
  }
  
  return {
    ANY: ANY,
    ALL: ALL,
    RAN: RAN
  }
}
