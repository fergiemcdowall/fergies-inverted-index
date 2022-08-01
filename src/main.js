const charwise = require('charwise')

/**
 * @typedef {{new<K, V>(name: string, options?: import('abstract-level').AbstractDatabaseOptions<K, V>): import('abstract-level').AbstractLevel<any, K, V>}} AbstractLevelConstructor
 */

/**
 * @typedef {Object} FiiOptions Fii options
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
 * @typedef {{_db: import('abstract-level').AbstractLevel}} InitializedOptions
 */

/**
 * Return ids of objects that are in one or more of the query clauses
 * @callback OR
 * @param {import("./parseToken").Token} token
 * @param {import("./read").AlterToken} [pipeline]
 * @returns {Promise<import("./read").QueryObject[]>}
 */

/**
 * @typedef {Object} Fii
 * @property {import("./read").INTERSECTION} AND
 * @property {import("./write").DELETE} DELETE
 * @property {import("./read").EXPORT} EXPORT
 * @property {import("./read").GET} GET
 * @property {import("./write").IMPORT} IMPORT
 * @property {import("./read").SET_SUBTRACTION} NOT
 * @property {OR} OR
 * @property {import("./write").PUT} PUT
 * @property {import("./write").TIMESTAMP_LAST_UPDATED} TIMESTAMP_LAST_UPDATED
 */

const read = require('./read.js')
const write = require('./write.js')

// _match is nested by default so that AND and OR work correctly under
// the bonnet. Flatten array before presenting to consumer
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
    GET: (tokens, pipeline) =>
      r.GET(tokens, pipeline).then(flattenMatchArrayInResults),
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
