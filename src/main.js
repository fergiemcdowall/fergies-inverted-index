const charwise = require('charwise')

/**
 * @typedef {{new<K, V>(name: string, options?: import("abstract-level").AbstractDatabaseOptions<K, V>): import("abstract-level").AbstractLevel<any, K, V>}} AbstractLevelConstructor
 */

/**
 * Fii options
 * @typedef {Object} FiiOptions
 * @property {string} [name="fii"] Name of database
 * @property {AbstractLevelConstructor} [db] Constructor of `class` extending [`abstract-level`](https://github.com/Level/abstract-level)
 * @property {string} [tokenAppend=""] Creates 'comment' spaces in tokens.
 * For example using `#` allows tokens like `boom#1.00` to be retrieved by using `boom`.
 * If `tokenAppend` wasnt used, then `{gte: 'boom', lte: 'boom'}` would also return stuff like `boomness#1.00` etc
 * @property {boolean} [caseSensitive=true] Sets case sensitivity of the index
 * @property {string[]} [stopwords=[]] Array of stop words to be stripped using [`stopword`](https://github.com/fergiemcdowall/stopword)
 * @property {string[]} [doNotIndexField=[]] Array of fields not to index
 * @property {boolean} [storeVectors=true]
 * @property {string} [docExistsSpace="DOC"] Field used to verify that doc exists
 */

/**
 * @typedef {{_db: import("abstract-level").AbstractLevel}} InitializedOptions
 */

/**
 * Returns objects that match one or more of the query clauses
 * @callback OR
 * @param {import("./parseToken.js").Token[]} tokens
 * @param {import("./read.js").AlterToken} [pipeline]
 * @returns {Promise<import("./read.js").QueryObject[]>}
 */

/**
 * @typedef {Object} Fii
 * @property {import("./read.js").AGGREGATION_FILTER} AGGREGATION_FILTER
 * @property {import("./read.js").AGGREGATE} AGGREGATE
 * @property {import("./read.js").AND} AND
 * @property {import("./read.js").BUCKET} BUCKET
 * @property {import("./read.js").BUCKETS} BUCKETS
 * @property {import("./read.js").CREATED} CREATED
 * @property {import("./write.js").DELETE} DELETE
 * @property {import("./read.js").DISTINCT} DISTINCT
 * @property {import("./read.js").EXIST} EXIST
 * @property {import("./read.js").EXPORT} EXPORT
 * @property {import("./read.js").FACETS} FACETS
 * @property {import("./read.js").FIELDS} FIELDS
 * @property {import("./read.js").GET} GET
 * @property {import("./write.js").IMPORT} IMPORT
 * @property {import("./read.js").LAST_UPDATED} LAST_UPDATED
 * @property {import("./read.js").MAX} MAX
 * @property {import("./read.js").MIN} MIN
 * @property {import("./read.js").NOT} NOT
 * @property {import("./read.js").OBJECT} OBJECT
 * @property {OR} OR
 * @property {import("./write.js").PUT} PUT
 * @property {import("./read.js").SORT} SORT
 * @property {import("abstract-level").AbstractLevel} STORE
 * @property {import("./write.js").TIMESTAMP_LAST_UPDATED} TIMESTAMP_LAST_UPDATED
 * @property {import("./parseToken.js").PARSE} parseToken
 */

const read = require('./read.js')
const write = require('./write.js')

// _match is nested by default so that AND and OR work correctly under
// the bonnet. Flatten array before presenting to consumer
/**
 * 
 * @param {import("./read.js").QueryObject[]} [results] 
 * @returns {import("./read.js").QueryObject[]} Flattened and sorted results
 */
const flattenMatchArrayInResults = results =>
  typeof results === 'undefined'
    ? undefined
    : results.map(result => {
      // Sort _match consistently (FIELD -> VALUE -> SCORE)
      result._match = result._match
        .flat(Infinity)
        .map(m => (typeof m === 'string' ? JSON.parse(m) : m))
        .sort((a, b) => {
          if (a.FIELD < b.FIELD) return -1
          if (a.FIELD > b.FIELD) return 1
          if (a.VALUE < b.VALUE) return -1
          if (a.VALUE > b.VALUE) return 1
          if (a.SCORE < b.SCORE) return -1
          if (a.SCORE > b.SCORE) return 1
          return 0
        })
      return result
    })

/**
 * Initializes store
 * @template {FiiOptions} O FiiOptions
 * @param {O} [ops={}] Options
 * @returns {Promise<O & InitializedOptions}>
 */
const initStore = (ops = {}) =>
  new Promise((resolve, reject) => {
    ops = Object.assign(
      {
        name: 'fii',
        tokenAppend: '',
        caseSensitive: true,
        stopwords: [],
        doNotIndexField: [],
        storeVectors: true,
        docExistsSpace: 'DOC'
      },
      ops
    )

    const DB = ops.db
    const db = new DB(ops.name, {
      keyEncoding: charwise,
      valueEncoding: 'json'
    })
    db.open(err =>
      err ? reject(err) : resolve(Object.assign(ops, { _db: db }))
    )
  })

/**
 * Creates an inverted index
 * @param {FiiOptions & InitializedOptions} [ops={}] Options
 * @returns {Promise<Fii>}
 */
const makeAFii = async (ops) => {
  const r = read(ops)
  const w = write(ops)

  return w.TIMESTAMP_CREATED().then(() => ({
    AGGREGATION_FILTER: r.AGGREGATION_FILTER,
    AND: (tokens, pipeline) =>
      r.INTERSECTION(tokens, pipeline).then(flattenMatchArrayInResults),
    BUCKET: r.BUCKET,
    BUCKETS: r.BUCKETS,
    CREATED: r.CREATED,
    DELETE: w.DELETE,
    DISTINCT: r.DISTINCT,
    EXIST: r.EXIST,
    EXPORT: r.EXPORT,
    FACETS: r.FACETS,
    FIELDS: r.FIELDS,
    GET: (token, pipeline) =>
      r.GET(token, pipeline).then(flattenMatchArrayInResults),
    IMPORT: w.IMPORT,
    LAST_UPDATED: r.LAST_UPDATED,
    MAX: r.MAX,
    MIN: r.MIN,
    NOT: (a, b) =>
      r.SET_SUBTRACTION(a, b).then(flattenMatchArrayInResults),
    OBJECT: r.OBJECT,
    OR: (tokens, pipeline) =>
      r
        .UNION(tokens, pipeline)
        .then(result => result.union)
        .then(flattenMatchArrayInResults),
    PUT: w.PUT,
    SORT: r.SORT,
    STORE: ops._db,
    TIMESTAMP_LAST_UPDATED: w.TIMESTAMP_LAST_UPDATED,
    parseToken: r.parseToken
  }))
}

/**
 * Creates and intializes index
 * @param {FiiOptions} [ops] Options
 */
const main = ops => initStore(ops).then(makeAFii)

module.exports = main
