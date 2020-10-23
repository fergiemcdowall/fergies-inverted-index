import level from 'level'
import read from './read.js'
import write from './write.js'

// _match is nested by default so that AND and OR work correctly under
// the bonnet. Flatten array before presenting to consumer
const flattenMatchArrayInResults = results => results.map(result => {
  result._match = result._match.flat(Infinity)
  return result
})

const makeAFii = (ops) => ({
  AND: (...keys) => read(ops).INTERSECTION(...keys).then(
    flattenMatchArrayInResults
  ),
  BUCKET: read(ops).BUCKET,
  BUCKETS: read(ops).BUCKETS,
  AGGREGATE: read(ops).AGGREGATE,
  DELETE: write(ops).DELETE,
  DISTINCT: read(ops).DISTINCT,
  EXPORT: read(ops).EXPORT,
  FACETS: read(ops).FACETS,
  FIELDS: read(ops).FIELDS,
  GET: read(ops).GET,
  IMPORT: write(ops).IMPORT,
  MAX: read(ops).MAX,
  MIN: read(ops).MIN,
  NOT: (...keys) => read(ops).SET_SUBTRACTION(...keys).then(
    flattenMatchArrayInResults
  ),
  OBJECT: read(ops).OBJECT,
  OR: (...keys) => read(ops).UNION(...keys)
    .then(result => result.union)
    .then(flattenMatchArrayInResults),
  PUT: write(ops).PUT,
  SET_SUBTRACTION: read(ops).SET_SUBTRACTION,
  STORE: ops.db,
  parseToken: read(ops).parseToken
})

// export default function fii (ops, callback) {
//   ops = Object.assign({
//     name: 'fii',
//     // tokenAppend can be used to create 'comment' spaces in
//     // tokens. For example using '#' allows tokens like boom#1.00 to
//     // be retrieved by using "boom". If tokenAppend wasnt used, then
//     // {gte: 'boom', lte: 'boom'} would also return stuff like
//     // boomness#1.00 etc
//     tokenAppend: '',
//     caseSensitive: true,
//     stopwords: []
//   }, ops || {})
//   // if no callback provided, "lazy load"
//   if (!callback) {
//     return makeAFii(
//       (ops.store || level(ops.name, { valueEncoding: 'json' })),
//       ops
//     )
//   } else {
//     if (ops.store) return callback(new Error('When initing with a store use "lazy loading"'), null)
//     // use callback to provide a notification that db is opened
//     level(ops.name, { valueEncoding: 'json' }, (err, store) =>
//       callback(err, makeAFii(store, ops)))
//   }
// }


const initStore = ops => new Promise((resolve, reject) => {
  
})

export default ops => new Promise ((resolve, reject) => {
  ops = Object.assign({
    name: 'fii',
    // tokenAppend can be used to create 'comment' spaces in
    // tokens. For example using '#' allows tokens like boom#1.00 to
    // be retrieved by using "boom". If tokenAppend wasnt used, then
    // {gte: 'boom', lte: 'boom'} would also return stuff like
    // boomness#1.00 etc
    tokenAppend: '',
    caseSensitive: true,
    stopwords: []
  }, ops || {})
  if (ops.store) return resolve(makeAFii(ops))
  // else make a new level store
  return level(
    ops.name, { valueEncoding: 'json' }, (err, db) => err
      ? reject(err)
      : resolve(makeAFii(Object.assign(ops, { db: db })))
  )


})
