export default function init (db, ops) {
  const isString = s => (typeof s === 'string')

  // key might be object or string like this
  // <fieldname>:<value>. Turn key into json object that is of the
  // format {field: ..., value: {gte: ..., lte ...}}
  const parseKey = key => {
    if (isString(key)) {
      if (key.indexOf(':') > -1) {
        // string is expressing a specified field to search in
        key = {
          FIELD: [key.split(':')[0]],
          VALUE: {
            GTE: key.split(':')[1],
            LTE: key.split(':')[1]
          }
        }
      } else {
        // string is not specifying a field (search in ALL fields)
        key = {
          VALUE: {
            GTE: key,
            LTE: key
          }
        }
      }
    } else {
      // key is object, but key.value is string
      if (isString(key.VALUE)) {
        key.VALUE = {
          GTE: key.VALUE,
          LTE: key.VALUE
        }
      }
    }
    // token append allows in practice token spaces to be split up on
    // a character when being read. Useful when stuffing scores into
    // tokens
    if (key.VALUE.GTE.slice(-1) !== ops.tokenAppend) {
      key.VALUE.GTE = key.VALUE.GTE + ops.tokenAppend
    }
    if (key.VALUE.LTE.slice(-1) !== ops.tokenAppend) {
      key.VALUE.LTE = key.VALUE.LTE + ops.tokenAppend
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

  // NOT (set a minus set b)
  const SET_SUBTRACTION = (a, b) => Promise.all([
    isString(a) ? GET(a) : a,
    isString(b) ? GET(b) : b
  ]).then(([a, b]) => a.filter(
    aItem => b.map(bItem => bItem._id).indexOf(aItem._id) === -1)
  )

  // Accepts a range of tokens (field, value {gte, lte}) and returns
  // an array of document ids together with the tokens that they have
  // matched (a document can match more than one token in a range)
  const RANGE = ops => new Promise(resolve => {
    const rs = {} // resultset
    new Promise(
      resolve => ops.FIELD // is a field specified?
        ? resolve(isString(ops.FIELD) ? [ops.FIELD] : ops.FIELD) // use specified field (if String push to Array)
        : AVAILABLE_FIELDS() // else get ALL available fields from store
          .then(resolve)).then(
      fields => Promise.all(
        fields.map(
          fieldName => new Promise(resolve => db.createReadStream({
            gte: fieldName + ':' + ops.VALUE.GTE,
            lte: fieldName + ':' + ops.VALUE.LTE + '￮'
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
    key = parseKey(key)
    const re = new RegExp('[￮' + ops.tokenAppend + ']', 'g')
    return Object.assign(key, {
      _id: [...result.reduce((acc, cur) => acc.add(cur._id), new Set())].sort(),
      VALUE: {
        GTE: key.VALUE.GTE.split(':').pop().replace(re, ''),
        LTE: key.VALUE.LTE.split(':').pop().replace(re, '')
      }
    })
  })

  const OBJECT = _ids => Promise.all(
    _ids.map(
      id => db.get('￮DOC￮' + id._id + '￮').catch(reason => null)
    )
  ).then(_objects => _ids.map((_id, i) => {
    _id._object = _objects[i]
    return _id
  }))

  const getRange = ops => new Promise((resolve, reject) => {
    const keys = []
    db.createKeyStream(ops)
      .on('data', data => { keys.push(data) })
      .on('end', () => resolve(keys))
  })

  const MIN = key => new Promise((resolve, reject) => {
    db.createKeyStream({
      limit: 1,
      gte: key + '!'
    }).on('data', resolve)
  })

  const MAX = key => new Promise((resolve, reject) => {
    db.createKeyStream({
      limit: 1,
      lte: key + '￮',
      reverse: true
    }).on('data', resolve)
  })

  const DIST = ops => new Promise(
    resolve => (ops || {}).FIELD
    // bump string or Array to Array
      ? resolve([ops.FIELD].flat(Infinity))
      : AVAILABLE_FIELDS().then(resolve)
  ).then(fields => Promise.all(
    fields.map(field => getRange({
      gte: field + ':' + ((ops && ops.VALUE && ops.VALUE.GTE) || ''),
      lte: field + ':' + ((ops && ops.VALUE && ops.VALUE.LTE) || '') + '￮'
    }).then(items => items.map(item => ({
      FIELD: item.split(/:(.+)/)[0],
      VALUE: item.split(/:(.+)/)[1]
    }))))
  )).then(result => result.flat())

  return {
    FIELDS: AVAILABLE_FIELDS,
    BUCKET: BUCKET,
    BUCKETFILTER: BUCKETFILTER,
    DIST: DIST,
    GET: GET,
    INTERSECTION: INTERSECTION,
    MAX: MAX,
    MIN: MIN,
    OBJECT: OBJECT,
    SET_SUBTRACTION: SET_SUBTRACTION,
    UNION: UNION
  }
}
