module.exports = function (db) {
  const GET = function (key) {
    return new Promise((resolve, reject) => {
      // to allow for nested promises
      // if this is a promise then resolve that
      if (key instanceof Promise) return resolve(key)
      if ((typeof key) === 'string') key = { gte: key, lte: key }
      return RANGE(key).then(resolve)
    })
  }

  // OR
  const UNION = function (...keys) {
    return new Promise((resolve, reject) => {
      Promise.all(
        keys.map(key => GET(key))
      ).then(sets => {
        // flatten
        sets = [].concat.apply([], sets)
        var setObject = sets.reduce((acc, cur) => {
          acc[cur._id] = acc[cur._id] || []
          acc[cur._id].push(cur.prop)
          return acc
        }, {})
        resolve(Object.keys(setObject).map(id => {
          return {
            _id: id,
            prop: setObject[id]
          }
        }))
      })
    })
  }

  // AND
  const INTERSECTION = function (...keys) {
    return new Promise((resolve, reject) => {
      UNION(...keys).then(result => {
        return resolve(
          result
          // returns an intersection
            .filter(item => (item.prop.length === keys.length))
        )
      })
    })
  }

  // NOT
  const SET_DIFFERENCE = function (a, b) {
    if (typeof a === 'string') a = GET(a)
    if (typeof b === 'string') b = GET(b)
    return new Promise((resolve, reject) => {
      Promise.all([a, b]).then(result => {
        var [ a, b ] = result
        b = b.map(item => item._id)
        return resolve(a.filter(item => b.indexOf(item._id)))
      })
    })
  }

  const EACH = function (keys) {
    return new Promise((resolve, reject) => {
      Promise.all(
        keys.map(key => db.get(key))
      ).then(result => {
        return resolve(
          keys.map((key, i) => {
            return {
              prop: key,
              _id: result[i]
            }
          })
        )
      })
    })
  }

  const RANGE = function (ops) {
    const s = {}
    return new Promise((resolve, reject) => {
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
                prop: s[id]
              }
            })
          )
        }
        )
    })
  }
  
  return {
    EACH: EACH,
    GET: GET,
    INTERSECTION: INTERSECTION,
    SET_DIFFERENCE: SET_DIFFERENCE,
    UNION: UNION
  }
}
