const charwise = require('charwise')
const encode = require('encoding-down')
const level = require('level')
const levelup = require('levelup')
const read = require('./read.js')
const write = require('./write.js')

// _match is nested by default so that AND and OR work correctly under
// the bonnet. Flatten array before presenting to consumer
const flattenMatchArrayInResults = results =>
  results.map(result => {
    result._match = result._match
      .flat(Infinity)
      .map(m => (typeof m === 'string' ? JSON.parse(m) : m))
    return result
  })

const initStore = (ops = {}) =>
  new Promise((resolve, reject) => {
    ops = Object.assign(
      {
        name: 'fii',
        // tokenAppend can be used to create 'comment' spaces in
        // tokens. For example using '#' allows tokens like boom#1.00 to
        // be retrieved by using "boom". If tokenAppend wasnt used, then
        // {gte: 'boom', lte: 'boom'} would also return stuff like
        // boomness#1.00 etc
        tokenAppend: '',
        caseSensitive: true,
        stopwords: [],
        doNotIndexField: [],
        storeVectors: true,
        docExistsSpace: 'DOC' // field used to verify that doc exists
      },
      ops
    )
    if (ops.db) {
      return levelup(
        encode(ops.db, {
          keyEncoding: charwise,
          valueEncoding: 'json'
        }),
        (err, db) =>
          err ? reject(err) : resolve(Object.assign(ops, { _db: db }))
      )
    }
    // else
    return level(
      ops.name,
      {
        keyEncoding: charwise,
        valueEncoding: 'json'
      },
      (err, db) =>
        err ? reject(err) : resolve(Object.assign(ops, { _db: db }))
    )
  })

const makeAFii = ops => {
  const r = read(ops)
  const w = write(ops)

  return w.TIMESTAMP_CREATED().then(() => ({
    AGGREGATE: r.AGGREGATE,
    AGGREGATION_FILTER: r.AGGREGATION_FILTER,
    AND: (...keys) => r.INTERSECTION(...keys).then(flattenMatchArrayInResults),
    BUCKET: r.BUCKET,
    BUCKETS: r.BUCKETS,
    CREATED: r.CREATED,
    DELETE: w.DELETE,
    DISTINCT: r.DISTINCT,
    EXIST: r.EXIST,
    EXPORT: r.EXPORT,
    FACETS: r.FACETS,
    FIELDS: r.FIELDS,
    GET: key => r.GET(key).then(flattenMatchArrayInResults),
    IMPORT: w.IMPORT,
    LAST_UPDATED: r.LAST_UPDATED,
    MAX: r.MAX,
    MIN: r.MIN,
    NOT: (...keys) =>
      r.SET_SUBTRACTION(...keys).then(flattenMatchArrayInResults),
    OBJECT: r.OBJECT,
    OR: (...keys) =>
      r
        .UNION(...keys)
        .then(result => result.union)
        .then(flattenMatchArrayInResults),
    PUT: w.PUT,
    SET_SUBTRACTION: r.SET_SUBTRACTION,
    STORE: ops._db,
    TIMESTAMP_LAST_UPDATED: w.TIMESTAMP_LAST_UPDATED,
    parseToken: r.parseToken
  }))
}

module.exports = ops => initStore(ops).then(makeAFii)
