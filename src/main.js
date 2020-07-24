import level from 'level'
import read from './read.js'
import write from './write.js'

// _match is nested by default so that AND and OR work correctly under
// the bonnet. Flatten array before presenting to consumer
const flattenMatchArrayInResults = results => results.map(result => {
  result._match = result._match.flat(Infinity)
  return result
})

const makeAFii = (db, ops) => ({
  AND: (...keys) => read(db, ops).INTERSECTION(...keys).then(
    flattenMatchArrayInResults
  ),
  BUCKET: read(db, ops).BUCKET,
  BUCKETFILTER: read(db, ops).BUCKETFILTER,
  DELETE: write(db, ops).DELETE,
  DISTINCT: read(db, ops).DIST,
  FIELDS: read(db, ops).FIELDS,
  GET: read(db, ops).GET,
  MAX: read(db, ops).MAX,
  MIN: read(db, ops).MIN,
  NOT: (...keys) => read(db, ops).SET_SUBTRACTION(...keys).then(
    flattenMatchArrayInResults
  ),
  OBJECT: read(db, ops).OBJECT,
  OR: (...keys) => read(db, ops).UNION(...keys).then(
    flattenMatchArrayInResults
  ),
  PUT: write(db, ops).PUT,
  SET_SUBTRACTION: read(db, ops).SET_SUBTRACTION,
  STORE: db,
  parseToken: read(db, ops).parseToken
})

export default function fii (ops, callback) {
  console.log(ops)
  ops = Object.assign({
    name: 'fii',
    // tokenAppend can be used to create 'comment' spaces in
    // tokens. For example using '#' allows tokens like boom#1.00 to
    // be retrieved by using "boom". If tokenAppend wasnt used, then
    // {gte: 'boom', lte: 'boom'} would also return stuff like
    // boomness#1.00 etc
    tokenAppend: '',
    caseSensitive: true
  }, ops || {})
  // if no callback provided, "lazy load"
  if (!callback) {
    return makeAFii(
      (ops.store || level(ops.name, { valueEncoding: 'json' })),
      ops
    )
  } else {
    if (ops.store) return callback(new Error('When initing with a store use "lazy loading"'), null)
    // use callback to provide a notification that db is opened
    level(ops.name, { valueEncoding: 'json' }, (err, store) =>
      callback(err, makeAFii(store, ops)))
  }
}
