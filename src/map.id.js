export default function init (db) {
  const isString = s => (typeof s === 'string')

  const GET = key => new Promise((resolve, reject) => {
    if (key instanceof Promise) return resolve(key) // MAGIC! Enables nested promises
    if (isString(key)) key = { gte: key, lte: key + '￮' }
    return RANGE(key).then(resolve)
  })

  // OR
  const UNION = (...keys) => Promise.all(
    keys.map(key => GET(key))
  ).then(sets => {
    // flatten
    sets = [].concat.apply([], sets)
    var setObject = sets.reduce((acc, cur) => {
      acc[cur._id] = [...(acc[cur._id] || []), cur._match]
      return acc
    }, {})
    return Object.keys(setObject).map(id => ({
      _id: id,
      _match: setObject[id]
    }))
  })

  // AND
  const INTERSECTION = (...keys) => UNION(...keys).then(
    result => result.filter(
      item => (item._match.length === keys.length)
    )
  )

  // NOT
  const SET_DIFFERENCE = (a, b) => Promise.all([
    isString(a) ? GET(a) : a,
    isString(b) ? GET(b) : b
  ]).then(result => result[0].filter(
    item => result[1].map(item => item._id).indexOf(item._id)
  ))

  // Accepts a range of tokens (gte, lte) and returns an array of
  // document ids together with the tokens that they have matched (a
  // document can match more than one token in a range)
  const RANGE = ops => new Promise(resolve => {
    const rs = {} // resultset
    db.createReadStream(ops)
      .on('data', token => token.value.forEach(docId => {
        rs[docId] = [...(rs[docId] || []), token.key]
        return rs
      }))
      .on('end', () => resolve(
        // convert map into array
        Object.keys(rs).map(id => ({
          _id: id,
          _match: rs[id]
        }))
      ))
  })

  // TODO: put in some validation here
  // arg 1: an aggregration
  // arg 2: a filter set- return only results of arg 1 that intersect with arg 2
  // TODO: should this use spread syntax? Maybe 2 args instead?
  const AGGREGATE = (...args) => Promise.all(args).then(result => {
    var aggregation = new Set(result[1].map(item => item._id))
    return result[0].map(
      item => Object.assign(item, {
        _id: [...new Set([...item._id].filter(x => aggregation.has(x)))]
      })
    ).filter(item => item._id.length)
  })

  // return a bucket of IDs. Key is an object like this:
  // {gte:..., lte:...} (gte/lte == greater/less than or equal)
  const BUCKET = key => GET(key).then(result => {
    // if gte == lte (in other words get a bucket on one specific
    // value) a single string can be used as shorthand
    if (isString(key)) {
      key = {
        gte: key,
        lte: key
      }
    }
    // TODO: some kind of verification of key object
    return Object.assign(key, {
      _id: [...result.reduce((acc, cur) => acc.add(cur._id), new Set())].sort()
    })
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
