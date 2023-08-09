import charwise from 'charwise'
import read from './read.js'
import write from './write.js'
import { TokenParser } from './parseToken.js'

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

const init = async (ops = {}) => {
  ops = {
    caseSensitive: true,
    isLeaf: item => typeof item === 'string' || typeof item === 'number',
    stopwords: [],
    doNotIndexField: [],
    storeVectors: true,
    docExistsSpace: 'DOC', // the field used to verify that doc exists
    db: await new ops.Level(ops.name, {
      keyEncoding: charwise,
      valueEncoding: 'json'
    }),
    tokenParser: new TokenParser(),
    ...ops
  }

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
    NOT: (...keys) =>
      r.SET_SUBTRACTION(...keys).then(flattenMatchArrayInResults),
    OBJECT: r.OBJECT,
    OR: (tokens, pipeline) =>
      r
        .UNION(tokens, pipeline)
        .then(result => result.union)
        .then(flattenMatchArrayInResults),
    PUT: w.PUT,
    SORT: r.SORT,
    STORE: ops.db,
    TIMESTAMP_LAST_UPDATED: w.TIMESTAMP_LAST_UPDATED,
    TOKEN_PARSER: ops.tokenParser
  }))
}

export class Main {
  constructor (ops) {
    return init(ops)
  }
}
