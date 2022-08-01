const charwise = require('charwise')
const { EntryStream } = require('level-read-stream')

/**
 * @typedef KeyValueObject
 * @property {any[]} key
 * @property {any} value
 */

/**
 * @typedef {import("level-read-stream").ReadStreamOptions & import("abstract-level").AbstractIteratorOptions<any, any>} RangeOptions
 */

/**
 * Exports the index
 * @callback EXPORT
 * @param {RangeOptions} [options]
 * @returns {Promise<KeyValueObject[]>}
 */

/**
 * Alters token
 * @callback AlterToken
 * @param {import("./parseToken").Token} token Input token
 * @returns {Promise<import("./parseToken").Token>} Altered token
 */

/**
 * @typedef MatchObject
 * @property {string} FIELD
 * @property {any} VALUE
 * @property {any} [SCORE]
 */

/**
 * @typedef ResultObject
 * @property {string} _id
 * @property {MatchObject[]} _matches
 */

/**
 * Returns all object ids for objects that contain the given property, aggregated by object id.
 * @callback GET
 * @param {import("./parseToken").Token} token
 * @param {AlterToken} [pipeline]
 * @returns {Promise<ResultObject[]>}
 */

/**
 * @typedef UnionResultObject
 * @property {number} sumTokensMinusStopwords
 * @property {ResultObject[]} union
 */

/**
 * @callback UNION
 * @param {import("./parseToken").Token} token
 * @param {AlterToken} [pipeline]
 * @returns {Promise<UnionResultObject[]>}
 */

const tokenParser = require('./parseToken.js')

// polyfill- HI and LO coming in next version of charwise
charwise.LO = null
charwise.HI = undefined

const read = ops => {
  const isString = s => typeof s === 'string'

  // TODO: in order to account for query processing pipelines,
  // parseToken should probably be moved to search-index and fii
  // should only deal with nicely formatted query tokens (JSON
  // objects)
  /**
   * Turn key into json object that is of the format {FIELD: ..., VALUE: {GTE: ..., LTE ...}}
   * @param {import("./parseToken").Token} token 
   * @returns {Promise<import("./parseToken").TokenObject>} `token` parsed into JSON object
   */
  const parseToken = async token => tokenParser(token, await AVAILABLE_FIELDS())

  const queryReplace = token => {
    // for example stopwords create undefined token
    if (typeof token === 'undefined') return RANGE(undefined)
    // REPLACEMENT
    if (
      // only consider tokens for single values, not ranges (lte == gte)
      token.VALUE.GTE === token.VALUE.LTE &&
      ops.queryReplace && // user specified queryReplace parameter
      ops.queryReplace[token.VALUE.GTE] // is there a replacement?
    ) {
      return UNION(
        ops.queryReplace[token.VALUE.GTE].map(replacementToken => ({
          FIELD: token.FIELD,
          VALUE: {
            GTE: replacementToken,
            LTE: replacementToken
          }
        }))
      ).then(res => res.union)
    }

    // return RANGE(token)
    return token
  }

  const setCaseSensitivity = token => {
    const setCase = str =>
      ops.caseSensitive || typeof str !== 'string' ? str : str.toLowerCase()
    return {
      FIELD: token.FIELD.map(setCase),
      VALUE: {
        GTE: setCase(token.VALUE.GTE),
        LTE: setCase(token.VALUE.LTE)
      }
    }
  }

  // If this token is a stopword then return 'undefined'
  const removeStopwords = token =>
    token.VALUE.GTE === token.VALUE.LTE &&
      ops.stopwords.includes(token.VALUE.GTE)
      ? undefined
      : token

  /**
   * @type {GET}
   */
  const GET = async (
    token,
    pipeline = token => new Promise(resolve => resolve(token))
  ) => {
    // eslint-disable-next-line
    return new Promise(async (resolve, reject) => {
      // If token turns into a Promise or undefined, then it is
      // assumed to have been processed completely
      const testForBreak = token => {
        if (typeof token === 'undefined') return resolve(undefined)
        if (token instanceof Promise) return resolve(token)
      }

      try {
        testForBreak(token)

        token = await parseToken(token)
        // testForBreak(token) // ?
        token = await setCaseSensitivity(token)
        // testForBreak(token) // ?
        token = await removeStopwords(token)
        // testForBreak(token) // ?
        token = await queryReplace(token) // TODO: rename to replaceToken?
        testForBreak(token)

        token = await pipeline(token)
        testForBreak(token)
      } catch (e) {
        return reject(e)
      }
      // If array, assume that this is an array of promises and run again
      if (Array.isArray(token)) return resolve(token)
      // else return the RANGE for the token
      return resolve(RANGE(token))
    })
  }

  // OR
  /**
   * @type {UNION}
   */
  const UNION = async (tokens, pipeline) =>
    Promise.all(tokens.map(token => GET(token, pipeline))).then(sets => {
      const setObject = sets.flat(Infinity).reduce((acc, cur) => {
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

  // AND
  const INTERSECTION = (tokens, pipeline) =>
    UNION(tokens, pipeline).then(result =>
      result.union.filter(
        item => item._match.length === result.sumTokensMinusStopwords
      )
    )

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

  const RANGE = token =>
    new Promise(resolve => {
      // If this token is undefined (stopword) then resolve 'undefined'
      if (typeof token === 'undefined') return resolve(undefined)

      const rs = new Map() // resultset
      return Promise.all(
        token.FIELD.map(fieldName => {
          return new Promise(resolve =>
            new EntryStream(ops._db, {
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
          Array.from(rs.keys()).map(id => {
            return {
              _id: id,
              _match: rs.get(id)
            }
          })
        )
      )
    })

  const AVAILABLE_FIELDS = () =>
    new Promise(resolve => {
      const fieldNames = []
      new EntryStream(ops._db, {
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
  const BUCKET = async token =>
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
  /**
   * @type {EXPORT}
   */
  const getRange = rangeOps =>
    new Promise((resolve, reject) => {
      const keys = []
      new EntryStream(ops._db, rangeOps)
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
      .then(token =>
        Promise.all(
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
              gte: formatKey(field, gte),
              lte: formatKey(field, lte, true),
              keys: true,
              values: false
            }).then(items =>
              items.map(({ key }) => ({
                FIELD: key[1],
                VALUE: key[2][0]
              }))
            )
          })
        )
      )
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

  // declare outside of loop as per https://stackoverflow.com/questions/14677060/400x-sorting-speedup-by-switching-a-localecompareb-to-ab-1ab10
  const collator = new Intl.Collator('en', {
    numeric: true,
    sensitivity: 'base'
  })

  const SORT = results =>
    new Promise(resolve =>
      resolve(results.sort((a, b) => collator.compare(a._id, b._id)))
    )

  return {
    AGGREGATE: AGGREGATE, // TODO: remove
    AGGREGATION_FILTER: AGGREGATION_FILTER,
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

module.exports = read
