module.exports = ops => {
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
      GTE: setCase(token.VALUE.GTE || '!'),
      LTE: setCase(token.VALUE.LTE || '￮')
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
    keys.map(GET)
  ).then(sets => {
    const setObject = sets.flat(Infinity).reduce(
      (acc, cur) => {
        // cur will be undefined if stopword
        if (cur) { acc[cur._id] = [...(acc[cur._id] || []), cur._match] }
        return acc
      },
      {}
    )
    return {
      sumTokensMinusStopwords: sets.filter(s => s).length,
      union: Object.keys(setObject).map(id => ({
        _id: id,
        _match: setObject[id]
      }))
    }
  })

  // AND
  const INTERSECTION = (...tokens) => UNION(...tokens).then(
    result => result.union.filter(
      item => (item._match.length === result.sumTokensMinusStopwords)
    ))

  // NOT (set a minus set b)
  const SET_SUBTRACTION = (a, b) => Promise.all([
    isString(a) ? GET(a) : a,
    isString(b) ? GET(b) : b
  ]).then(([a, b]) => a.filter(
    aItem => b.map(bItem => bItem._id).indexOf(aItem._id) === -1)
  )

  const RANGE = token => new Promise(resolve => {
    // If this token is a stopword then return 'undefined'
    if ((token.VALUE.GTE === token.VALUE.LTE) &&
        ops.stopwords.includes(token.VALUE.GTE)) { return resolve(undefined) }

    const rs = {} // resultset
    return Promise.all(
      token.FIELD.map(
        fieldName => new Promise(resolve => ops._db.createReadStream({
          gte: fieldName + ':' + token.VALUE.GTE + ops.tokenAppend,
          lte: fieldName + ':' + token.VALUE.LTE + ops.tokenAppend + '￮',
          limit: token.LIMIT,
          reverse: token.REVERSE
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
    ops._db.createReadStream({
      gte: '￮FIELD￮',
      lte: '￮FIELD￮￮'
    })
      .on('data', d => fieldNames.push(d.value))
      .on('end', () => resolve(fieldNames))
  })

  const CREATED = () => ops._db.get('￮￮CREATED')

  const LAST_UPDATED = () => ops._db.get('￮￮LAST_UPDATED')

  // takes an array of ids and determines if the corresponding
  // documents exist in the index.
  const EXIST = (...ids) => new Promise(resolve => {
    const existingIds = []
    ops._db.createReadStream({
      gte: '￮' + ops.docExistsSpace + '￮',
      lte: '￮' + ops.docExistsSpace + '￮￮',
      values: false
    })
      .on('data', d => existingIds.push(d))
      .on('end', () => resolve(ids.filter(
        id => existingIds.includes('￮' + ops.docExistsSpace + '￮' + id + '￮')
      )))
  })

  // Given the results of an aggregation and the results of a query,
  // return the filtered aggregation
  const AGGREGATION_FILTER = (aggregation, filterSet) => {
    if (!filterSet || filterSet.length === 0) return aggregation
    filterSet = new Set(filterSet.map(item => item._id))
    return aggregation.map(bucket => Object.assign(bucket, {
      _id: [...new Set([...bucket._id].filter(
        x => filterSet.has(x)
      ))]
    }))
  }

  const AGGREGATE = ({ BUCKETS, FACETS, QUERY }) => Promise.all(
    [BUCKETS, FACETS, QUERY]
  ).then(([
    bucketsResult = [],
    facetsResult = [],
    queryResult = []
  ]) => ({
    BUCKETS: AGGREGATION_FILTER(bucketsResult.flat(), queryResult),
    FACETS: AGGREGATION_FILTER(facetsResult.flat(), queryResult),
    RESULT: queryResult
  }))

  const BUCKETS = (...buckets) => Promise.all(
    buckets.map(BUCKET)
  )

  // return a bucket of IDs. Key is an object like this:
  // {gte:..., lte:...} (gte/lte == greater/less than or equal)
  const BUCKET = token => parseToken(
    token // TODO: is parseToken needed her? Already called in GET
  ).then(token => GET(
    token
  ).then(
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
      id => ops._db.get('￮DOC￮' + id._id + '￮').catch(reason => null)
    )
  ).then(_objects => _ids.map((_id, i) => {
    _id._object = _objects[i]
    return _id
  }))

  // TODO: can this be replaced by RANGE?
  const getRange = rangeOps => new Promise((resolve, reject) => {
    const keys = []
    ops._db.createReadStream(rangeOps)
      .on('data', data => { keys.push(data) })
      .on('end', () => resolve(keys))
  })

  const MAX = fieldName => BOUNDING_VALUE(fieldName, true)

  const BOUNDING_VALUE = (token, reverse) => parseToken(
    token
  ).then(
    token => RANGE(Object.assign(token, {
      LIMIT: 1,
      REVERSE: reverse
    }))
  ).then(
    max => max.pop()
      ._match.pop()
      .split(':').pop()
    // TODO: should '#' be handled here or downstream?
      .split('#').shift()
  )

  // TODO remove if DISTINCT is no longer used
  const DISTINCT = (...tokens) => Promise.all(
    // if no tokens specified then get everything ('{}')
    tokens.length ? tokens.map(DIST) : [DIST({})]
  ).then(
    dist => [
      ...dist.flat().reduce(
        (acc, cur) => acc.add(JSON.stringify(cur)),
        new Set())
    ].map(JSON.parse)
  )

  // TODO remove if DISTINCT is no longer used
  const DIST = token => parseToken(
    token
  ).then(token => Promise.all(
    token.FIELD.map(field => getRange({
      gte: field + ':' + token.VALUE.GTE,
      lte: field + ':' + token.VALUE.LTE + '￮',
      keys: true,
      values: false
    }).then(items => items.map(item => ({
      FIELD: item.split(/:(.+)/)[0],
      VALUE: item.split(/:(.+)/)[1]
    }))))
  )).then(result => result.flat())

  const FACETS = (...tokens) => Promise.all(
    // if no tokens specified then get everything ('{}')
    tokens.length ? tokens.map(FACET) : [FACET({})]
  ).then(
    // TODO: Does this need to be a SET, or can there be duplicates?
    // TODO: Is dedupe actually needed here?
    // dedupe
    facets => [
      ...facets.flat().reduce(
        (acc, cur) => acc.add(JSON.stringify(cur)),
        new Set())
    ].map(JSON.parse)
  )

  const FACET = token => parseToken(
    token
  ).then(token => Promise.all(
    token.FIELD.map(field => getRange({
      gte: field + ':' + token.VALUE.GTE,
      lte: field + ':' + token.VALUE.LTE + '￮'
    }).then(items => items.map(item => ({
      FIELD: item.key.split(/:(.+)/)[0],
      VALUE: item.key.split(/:(.+)/)[1],
      _id: item.value
    }))))
  )).then(result => result.flat())

  return {
    AGGREGATE: AGGREGATE, // TODO: remove
    AGGREGATION_FILTER: AGGREGATION_FILTER, // TODO: remove
    BUCKET: BUCKET, // DEPRECATED, TODO: remove
    // TODO: change so that this takes an options object containing
    // facet command, flag for returning empty facets or not, and a
    // set of ids to filter on
    BUCKETS: BUCKETS,
    CREATED: CREATED,
    DISTINCT: DISTINCT,
    EXIST: EXIST,
    EXPORT: getRange,
    // TODO: change so that this takes an options object containing
    // facet command, flag for returning empty facets or not, and a
    // set of ids to filter on
    FACETS: FACETS,
    FIELDS: AVAILABLE_FIELDS,
    GET: GET,
    INTERSECTION: INTERSECTION, // AND
    LAST_UPDATED: LAST_UPDATED,
    MAX: MAX,
    MIN: BOUNDING_VALUE,
    OBJECT: OBJECT,
    SET_SUBTRACTION: SET_SUBTRACTION,
    UNION: UNION, // OR,
    parseToken: parseToken
  }
}
