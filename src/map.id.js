export default function init (db) {
  const isString = s => (typeof s === 'string')

  // key might be object or string like this
  // <fieldname>:<value>. Turn key into json object that is of the
  // format {field: ..., value: {gte: ..., lte ...}}
  const parseKey = key => {
    if (isString(key)) {
      if (key.indexOf(':') > -1) {
        // string is expressing a specified field to search in
        key = {
          field: [ key.split(':')[0] ],
          value: {
            gte: key.split(':')[1],
            lte: key.split(':')[1]
          }
        }
      } else {
      // string is not specifying a field (search in ALL fields)
        key = {
          value: {
            gte: key,
            lte: key
          }
        }
      }
    } else {
      // key is object, but key.value is string
      if (isString(key.value)) {
        key.value = {
          gte: key.value,
          lte: key.value
        }
      }
    }
    return key
  }

  const GET = key => new Promise((resolve, reject) => {
    if (key instanceof Promise) return resolve(key) // MAGIC! Enables nested promises
    // takes objects in the form of
    // {
    //   field: ...,
    //   value: ... (either a string or gte/lte)
    // }
    return RANGE(parseKey(key)).then(resolve)
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

  // Accepts a range of tokens (field, value {gte, lte}) and returns
  // an array of document ids together with the tokens that they have
  // matched (a document can match more than one token in a range)
  const RANGE = ops => new Promise(resolve => {
    const rs = {} // resultset
    new Promise(
      resolve => ops.field // is a field specified?
        ? resolve(isString(ops.field) ? [ ops.field ] : ops.field) // use specified field (if String push to Array)
        : AVAILABLE_FIELDS() // else get ALL available fields from store
          .then(resolve)).then(
      fields => Promise.all(
        fields.map(
          fieldName => new Promise(resolve => db.createReadStream({
            gte: fieldName + ':' + ops.value.gte,
            lte: fieldName + ':' + ops.value.lte + '￮'
          }).on('data', token => token.value.forEach(docId => {
            rs[docId] = [...(rs[docId] || []), token.key]
            return rs
          })).on('end', resolve))
        )
      )
    ).then(() => resolve(
      // convert map into array
      Object.keys(rs).map(id => ({
        _id: id,
        _match: rs[id].sort()
      }))
    )
    )
  })

  const AVAILABLE_FIELDS = () => new Promise(resolve => {
    const fieldNames = []
    db.createReadStream({
      gte: '￮FIELD￮',
      lte: '￮FIELD￮￮'
    })
      .on('data', d => fieldNames.push(d.value))
      .on('end', () => resolve(fieldNames))
  })

  // TODO: put in some validation here
  // arg 1: an array of BUCKETS
  // arg 2: a filter set- return only results of arg 1 that intersect with arg 2
  const BUCKETFILTER = (buckets, filter) => {
    // buckets can be either an Array of BUCKETs or a Promise that returns
    // an array of buckets
    if (Array.isArray(buckets)) buckets = Promise.all(buckets)
    return buckets.then(
      buckets => Promise.all([...buckets, filter])
    ).then(result => {
      var filterSet = new Set(result.pop().map(item => item._id))
      return result.map(
        bucket => Object.assign(bucket, {
          _id: [...new Set([...bucket._id].filter(x => filterSet.has(x)))]
        })
      )
    })
  }

  // return a bucket of IDs. Key is an object like this:
  // {gte:..., lte:...} (gte/lte == greater/less than or equal)
  const BUCKET = key => GET(key).then(result => {
    // if gte == lte (in other words get a bucket on one specific
    // value) a single string can be used as shorthand
    // if (isString(key)) {
    //   key = {
    //     gte: key,
    //     lte: key
    //   }
    // }
    // TODO: some kind of verification of key object
    key = parseKey(key)
    return Object.assign(key, {
      _id: [...result.reduce((acc, cur) => acc.add(cur._id), new Set())].sort(),
      value: {
        gte: key.value.gte.split(':').pop(),
        lte: key.value.lte.split(':').pop().replace(/￮/g, '')
      }
    })
  })

  return {
    AVAILABLE_FIELDS: AVAILABLE_FIELDS,
    BUCKET: BUCKET,
    BUCKETFILTER: BUCKETFILTER,
    GET: GET,
    INTERSECTION: INTERSECTION,
    SET_DIFFERENCE: SET_DIFFERENCE,
    UNION: UNION
  }
}
