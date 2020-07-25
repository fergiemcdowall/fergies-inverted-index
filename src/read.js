export default function init (db, ops) {
  const isString = s => (typeof s === 'string')

  // key might be object or string like this
  // <fieldname>:<value>. Turn key into json object that is of the
  // format {FIELD: ..., VALUE: {GTE: ..., LTE ...}}
  const parseToken = token => new Promise((resolve, reject) => {
    // case: <value>
    // case: <FIELD>:<VALUE>

    // case: undefined

    const setCase = str => ops.caseSensitive ? str : str.toLowerCase()

    if (typeof token === 'undefined') token = {}

    if (typeof token === 'string') {
      const fieldValue = setCase(token).split(':')
      const value = fieldValue.pop()
      const field = fieldValue.pop()
      if (field) {
        return resolve({
          FIELD: [field],
          VALUE: {
            GTE: value,
            LTE: value
          }
        })
      }
      return AVAILABLE_FIELDS().then(fields => resolve({
        FIELD: fields,
        VALUE: {
          GTE: value,
          LTE: value
        }
      }))
    }

    // else not string so assume Object
    // {
    //   FIELD: [ fields ],
    //   VALUE: {
    //     GTE: gte,
    //     LTE: lte
    //   }
    // }

    // parse object VALUE
    if (typeof token.VALUE === 'string') {
      token.VALUE = {
        GTE: setCase(token.VALUE),
        LTE: setCase(token.VALUE)
      }
    }
    if (typeof token.VALUE === 'undefined') {
      token.VALUE = {
        GTE: '!',
        LTE: '￮'
      }
    }
    token.VALUE = Object.assign(token.VALUE, {
      GTE: setCase(token.VALUE.GTE) || '!',
      LTE: setCase(token.VALUE.LTE) || '￮'
    })

    // parse object FIELD
    if (typeof token.FIELD === 'undefined') {
      return AVAILABLE_FIELDS().then(fields => resolve(
        Object.assign(token, {
          FIELD: fields
        })
      ))
    }
    // Allow FIELD to be an array or a string
    token.FIELD = [token.FIELD].flat()
    return resolve(token)
  })

  const GET = token => (token instanceof Promise)
    ? token
    : parseToken(token).then(RANGE)

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

  const RANGE = ops => new Promise(resolve => {
    const rs = {} // resultset
    return Promise.all(
      ops.FIELD.map(
        fieldName => new Promise(resolve =>
          db.createReadStream({
            gte: fieldName + ':' + ops.VALUE.GTE,
            lte: fieldName + ':' + ops.VALUE.LTE + '￮'
          }).on('data', token => token.value.forEach(docId => {
            rs[docId] = [...(rs[docId] || []), token.key]
          })).on('end', resolve)
        )
      )
    ).then(() => resolve(
      // convert map into array
      Object.keys(rs).map(id => ({
        _id: id,
        _match: rs[id].sort()
      }))
    ))
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
  const BUCKET = token => parseToken(token).then(token => GET(token).then(
    result => {
      const re = new RegExp('[￮' + ops.tokenAppend + ']', 'g')
      return Object.assign(token, {
        _id: [...result.reduce((acc, cur) => acc.add(cur._id), new Set())].sort(),
        VALUE: {
          GTE: token.VALUE.GTE.split(':').pop().replace(re, ''),
          LTE: token.VALUE.LTE.split(':').pop().replace(re, '')
        }
      })
    })
  )

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
      FIELD: [item.split(/:(.+)/)[0]],
      VALUE: item.split(/:(.+)/)[1]
    }))))
  )).then(result => result.flat())

  return {
    FIELDS: AVAILABLE_FIELDS,
    BUCKET: BUCKET,
    BUCKETFILTER: BUCKETFILTER,
    DIST: DIST,
    GET: GET,
    INTERSECTION: INTERSECTION, // AND
    MAX: MAX,
    MIN: MIN,
    OBJECT: OBJECT,
    SET_SUBTRACTION: SET_SUBTRACTION,
    UNION: UNION, // OR,
    parseToken: parseToken
  }
}
