module.exports = db => {
  
  const GET = key => {
    return new Promise((resolve, reject) => {
      // to allow for nested promises
      // if this is a promise then resolve that
      if (key instanceof Promise) return resolve(key)
      if ((typeof key) === 'string') key = { gte: key, lte: key + '~' }
      return RANGE(key).then(resolve)
    })
  }

  // OR
  const UNION = (...keys) => Promise.all(
    keys.map(key => GET(key))
  ).then(sets => {
    // flatten
    sets = [].concat.apply([], sets)
    var setObject = sets.reduce((acc, cur) => {
      acc[cur._id] = acc[cur._id] || []
      acc[cur._id].push(cur.match)
      return acc
    }, {})
    return Object.keys(setObject).map(id => {
      return {
        _id: id,
        match: setObject[id]
      }
    })
  })

  // AND
  const INTERSECTION = (...keys) => {
    return UNION(...keys).then(result => {
      // returns an intersection
      return result.filter(item => (item.match.length === keys.length))
    })
  }

  // NOT
  const SET_DIFFERENCE = (a, b) => {
    if (typeof a === 'string') a = GET(a)
    if (typeof b === 'string') b = GET(b)
    return Promise.all([a, b]).then(result => {
      var [ a, b ] = result
      b = b.map(item => item._id)
      return a.filter(item => b.indexOf(item._id))
    })
  }

  const EACH = keys => {
    return Promise.all(
      keys.map(key => db.get(key))
    ).then(result => keys.map((key, i) => {
      return {
        match: key,
        _id: result[i]
      }
    }))
  }

  const RANGE = ops => {
    const s = {}
    return new Promise((resolve, reject) => {
      db.createReadStream(ops)
        .on('data', data => {
          return data.value.forEach(objectId => {
            s[objectId] = s[objectId] || []
            s[objectId].push(data.key)
          })
        }).on('end', () => {
          return resolve(
            Object.keys(s).map(id => {
              return {
                _id: id,
                match: s[id]
              }
            })
          )
        })
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
