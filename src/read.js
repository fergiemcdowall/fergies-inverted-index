const charwise = require('charwise')
// polyfill- HI and LO coming in next version of charwise
charwise.LO = null
charwise.HI = undefined

module.exports = ops => {
  const isString = s => typeof s === 'string'

  // TODO: in order to account for query processing pipelines,
  // parseToken should probably be moved to search-index and fii
  // should only deal with nicely formatted query tokens (JSON
  // objects)

  // key might be object or string like this
  // <fieldname>:<value>. Turn key into json object that is of the
  // format {FIELD: ..., VALUE: {GTE: ..., LTE ...}}
  const parseToken = token =>
    new Promise((resolve, reject) => {
      // case: <value>
      // case: <FIELD>:<VALUE>
      // case: undefined

      // TODO: this should be moved into a query processing pipeline
      const setCase = str =>
        ops.caseSensitive || typeof str !== 'string' ? str : str.toLowerCase()

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
        return AVAILABLE_FIELDS().then(fields =>
          resolve({
            FIELD: fields,
            VALUE: {
              GTE: value,
              LTE: value
            }
          })
        )
      }

      // else not string so assume Object
      // {
      //   FIELD: [ fields ],
      //   VALUE: {
      //     GTE: gte,
      //     LTE: lte
      //   }
      // }

      // parse object string VALUE
      if (typeof token.VALUE === 'string' || typeof token.VALUE === 'number') {
        token.VALUE = {
          GTE: setCase(token.VALUE),
          LTE: setCase(token.VALUE)
        }
      }

      if (
        typeof token.VALUE === 'undefined' || // VALUE is not present
        !Object.keys(token.VALUE).length // VALUE is an empty object- {}
      ) {
        token.VALUE = {
          GTE: charwise.LO,
          LTE: charwise.HI
        }
      }

      if (typeof token.VALUE.GTE === 'undefined') token.VALUE.GTE = charwise.LO
      if (typeof token.VALUE.LTE === 'undefined') token.VALUE.LTE = charwise.HI

      token.VALUE = Object.assign(token.VALUE, {
        GTE: setCase(token.VALUE.GTE),
        LTE: setCase(token.VALUE.LTE)
      })

      // parse object FIELD
      if (typeof token.FIELD === 'undefined') {
        return AVAILABLE_FIELDS().then(fields =>
          resolve(
            Object.assign(token, {
              FIELD: fields
            })
          )
        )
      }
      // Allow FIELD to be an array or a string
      token.FIELD = [token.FIELD].flat()

      return resolve(token)
    })

  const GET = token =>
    token instanceof Promise ? token : parseToken(token).then(RANGE)

  // OR
  const UNION = (...keys) => {
    return Promise.all(keys.map(GET)).then(sets => {
      const setObject = sets.flat(Infinity).reduce((acc, cur) => {
        // TODO: handle stopwords in query pipeline
        // cur will be undefined if stopword
        if (cur) acc.set(cur._id, [...(acc.get(cur._id) || []), cur._match])
        return acc
      }, new Map())
      return {
        sumTokensMinusStopwords: sets.filter(s => s).length,
        union: Array.from(setObject.keys()).map(id => ({
          _id: id,
          _match: setObject.get(id)
        }))
      }
    })
  }

  // AND
  const INTERSECTION = (...tokens) => {
    return UNION(...tokens).then(result => {
      return result.union.filter(
        item => item._match.length === result.sumTokensMinusStopwords
      )
    })
  }

  // NOT (set a minus set b)
  const SET_SUBTRACTION = (a, b) =>
    Promise.all([isString(a) ? GET(a) : a, isString(b) ? GET(b) : b]).then(
      ([a, b]) =>
        a.filter(aItem => b.map(bItem => bItem._id).indexOf(aItem._id) === -1)
    )

  const formatKey = (field, value, lte) => {
    const valueAndScore = []
    if (value !== undefined || typeof value === 'number') {
      valueAndScore.push(value)
    }
    if (lte) valueAndScore.push(charwise.HI)

    return ['IDX', field, valueAndScore]
  }

  // TODO: there should be a query processing pipeline between GET
  // and RANGE. Also- RANGE should probably accept an array of TOKENS
  // in order to handle stuff like synonyms
  const RANGE = token => {
    return new Promise(resolve => {
      // TODO: move this to some sort of query processing pipeline
      // If this token is a stopword then return 'undefined'
      if (
        token.VALUE.GTE === token.VALUE.LTE &&
        ops.stopwords.includes(token.VALUE.GTE)
      ) {
        return resolve(undefined)
      }

      // TODO: rs should be a Map to preserve key order
      const rs = new Map() // resultset
      return Promise.all(
        token.FIELD.map(fieldName => {
          // console.log(formatKey(fieldName, token.VALUE.GTE))
          // console.log(formatKey(fieldName, token.VALUE.LTE))
          return new Promise(resolve =>
            ops._db
              .createReadStream({
                gte: formatKey(fieldName, token.VALUE.GTE),
                lte: formatKey(fieldName, token.VALUE.LTE, true),
                limit: token.LIMIT,
                reverse: token.REVERSE
              })
              .on('data', token => {
                return token.value.forEach(docId => {
                  return rs.set(docId, [
                    ...(rs.get(docId) || []),
                    JSON.stringify({
                      FIELD: token.key[1],
                      VALUE: token.key[2][0],
                      SCORE: token.key[2][1]
                    })
                  ])
                })
              })
              .on('end', resolve)
          )
        })
      ).then(() =>
        resolve(
          Array.from(rs.keys()).map(id => ({
            _id: id,
            _match: rs.get(id).sort()
          }))
        )
      )
    })
  }

  const AVAILABLE_FIELDS = () =>
    new Promise(resolve => {
      const fieldNames = []
      ops._db
        .createReadStream({
          gte: ['FIELD', charwise.LO],
          lte: ['FIELD', charwise.HI]
        })
        .on('data', d => fieldNames.push(d.value))
        .on('end', () => resolve(fieldNames))
    })

  const CREATED = () => ops._db.get(['~CREATED'])

  const LAST_UPDATED = () => ops._db.get(['~LAST_UPDATED'])

  // takes an array of ids and determines if the corresponding
  // documents exist in the index.
  // const EXIST = (...ids) =>
  //   new Promise(resolve => {
  //     const existingIds = []
  //     console.log(ids)
  //     // TODO: this is totally wrong- the index should only check the
  //     // docs that are specified
  //     ops._db
  //       .createReadStream({
  //         gte: [ops.docExistsSpace, charwise.LO],
  //         lte: [ops.docExistsSpace, charwise.HI],
  //         values: false
  //       })
  //       .on('data', d => existingIds.push(d[1]))
  //       .on('end', () => resolve(ids.filter(id => existingIds.includes(id))))
  //   })

  // takes an array of ids and determines if the corresponding
  // documents exist in the index.
  const EXIST = (...ids) =>
    Promise.all(
      ids.map(id => ops._db.get([ops.docExistsSpace, id]).catch(e => null))
    ).then(result =>
      result.reduce((acc, cur, i) => {
        if (cur != null) acc.push(ids[i])
        return acc
      }, [])
    )

  // Given the results of an aggregation and the results of a query,
  // return the filtered aggregation
  const AGGREGATION_FILTER = (aggregation, filterSet) => {
    if (!filterSet || filterSet.length === 0) return aggregation
    filterSet = new Set(filterSet.map(item => item._id))
    return aggregation.map(bucket =>
      Object.assign(bucket, {
        _id: [...new Set([...bucket._id].filter(x => filterSet.has(x)))]
      })
    )
  }

  const AGGREGATE = ({ BUCKETS, FACETS, QUERY }) =>
    Promise.all([BUCKETS, FACETS, QUERY]).then(
      ([bucketsResult = [], facetsResult = [], queryResult = []]) => ({
        BUCKETS: AGGREGATION_FILTER(bucketsResult.flat(), queryResult),
        FACETS: AGGREGATION_FILTER(facetsResult.flat(), queryResult),
        RESULT: queryResult
      })
    )

  const BUCKETS = (...buckets) => Promise.all(buckets.map(BUCKET))

  // return a bucket of IDs. Key is an object like this:
  // {gte:..., lte:...} (gte/lte == greater/less than or equal)
  const BUCKET = token =>
    parseToken(
      token // TODO: is parseToken needed her? Already called in GET
    ).then(token =>
      GET(token).then(result =>
        Object.assign(token, {
          _id: [
            ...result.reduce((acc, cur) => acc.add(cur._id), new Set())
          ].sort(),
          VALUE: token.VALUE
        })
      )
    )

  const OBJECT = _ids =>
    Promise.all(
      _ids.map(id => ops._db.get(['DOC', id._id]).catch(reason => null))
    ).then(_objects =>
      _ids.map((_id, i) => {
        _id._object = _objects[i]
        return _id
      })
    )

  // TODO: can this be replaced by RANGE?
  const getRange = rangeOps =>
    new Promise((resolve, reject) => {
      const keys = []
      ops._db
        .createReadStream(rangeOps)
        .on('data', data => {
          keys.push(data)
        })
        .on('end', () => resolve(keys))
    })

  const MAX = fieldName => BOUNDING_VALUE(fieldName, true)

  const BOUNDING_VALUE = (token, reverse) =>
    parseToken(token)
      .then(token =>
        RANGE(
          Object.assign(token, {
            LIMIT: 1,
            REVERSE: reverse
          })
        )
      )
      .then(max =>
        max.length ? JSON.parse(max.pop()._match.pop()).VALUE : null
      )

  // TODO remove if DISTINCT is no longer used
  const DISTINCT = (...tokens) =>
    Promise.all(
      // if no tokens specified then get everything ('{}')
      tokens.length ? tokens.map(DIST) : [DIST({})]
    ).then(dist =>
      [
        ...dist
          .flat()
          .reduce((acc, cur) => acc.add(JSON.stringify(cur)), new Set())
      ].map(JSON.parse)
    )

  // TODO remove if DISTINCT is no longer used
  const DIST = token =>
    parseToken(token)
      .then(token => {
        return Promise.all(
          token.FIELD.map(field => {
            let lte = token.VALUE.LTE
            if (
              typeof token.VALUE.LTE !== 'undefined' &&
              typeof token.VALUE.LTE !== 'number'
            ) {
              lte = lte + '￮'
            }

            let gte = token.VALUE.GTE
            if (token.VALUE.GTE && typeof token.VALUE.GTE !== 'number') {
              gte = gte + ' '
            }

            return getRange({
              // gte: formatKey(field, token.VALUE.GTE),
              // lte: formatKey(field, lte, true),

              // gte: ['IDX', field, [null]],
              // lte: ['IDX', field, [undefined]],

              gte: formatKey(field, gte),
              lte: formatKey(field, lte, true),
              keys: true,
              values: false
            }).then(items =>
              items.map(item => ({
                FIELD: item[1],
                VALUE: item[2][0]
              }))
            )
          })
        )
      })
      .then(result => result.flat())

  const FACETS = (...tokens) =>
    Promise.all(
      // if no tokens specified then get everything ('{}')
      tokens.length ? tokens.map(FACET) : [FACET({})]
    ).then(
      // TODO: Does this need to be a SET, or can there be duplicates?
      // TODO: Is dedupe actually needed here?
      // dedupe
      facets =>
        [
          ...facets
            .flat()
            .reduce((acc, cur) => acc.add(JSON.stringify(cur)), new Set())
        ].map(JSON.parse)
    )

  const FACET = token =>
    parseToken(token)
      .then(token =>
        Promise.all(
          token.FIELD.map(field =>
            getRange({
              gte: formatKey(field, token.VALUE.GTE),
              lte: formatKey(field, token.VALUE.LTE, true)
            }).then(items =>
              items.map(item => ({
                FIELD: item.key[1],
                VALUE: item.key[2][0],
                _id: item.value
              }))
            )
          )
        )
      )
      .then(result => result.flat())

  const SORT = results =>
    new Promise(resolve =>
      resolve(
        results.sort((a, b) =>
          // This should sort an array of strings and
          // numbers in an intuitive way (numbers numerically, strings
          // alphabetically)
          (a + '').localeCompare(b + '', undefined, {
            numeric: true,
            sensitivity: 'base'
          })
        )
      )
    )

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
    SET_SUBTRACTION: SET_SUBTRACTION, // NOT
    SORT: SORT,
    UNION: UNION, // OR,
    parseToken: parseToken
  }
}
