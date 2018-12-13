module.exports = db => {
  
  const GET = key => new Promise((resolve, reject) => {
    // to allow for nested promises
    // if this is a promise then resolve that
    if (key instanceof Promise) return resolve(key)
    if ((typeof key) === 'string') key = { gte: key, lte: key + '￮' }
    return RANGE(key).then(resolve)
  })

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
  
  const RANGE = ops => new Promise((resolve, reject) => {
    const s = {}
    db.createReadStream(ops)
      .on('data', data => data.value.forEach(objectId => {
        s[objectId] = s[objectId] || []
        s[objectId].push(data.key)
      }))
      .on('end', () => resolve(
        Object.keys(s).map(id => {
          return {
            _id: id,
            match: s[id]
          }
        })
      ))
  })

  // TODO: put in some validation here
  // arg 1: an aggregration
  // arg 2: a filter set- return only results of arg 1 that intersect with arg 2
  const AGGREGATE = (...args) => Promise.all(args).then(result => {
    var aggregation = new Set(result[1].map(item => item._id))
    return result[0].map(
      item => {
        return {
          match: item.match,
          _id: [...new Set([...item._id].filter(x => aggregation.has(x)))]
        }
      }
    ).filter(item => item._id.length)
  })

  const BUCKET = key => GET(key).then(result => {
    return {
      match: key,
      _id: [...result.reduce((acc, cur) => acc.add(cur._id), new Set())].sort()
    }
  })
  
  return {
    AGGREGATE: AGGREGATE,
    BUCKET: BUCKET,
    GET: GET,
    INTERSECTION: INTERSECTION,
    SET_DIFFERENCE: SET_DIFFERENCE,
    UNION: UNION
  }
}
