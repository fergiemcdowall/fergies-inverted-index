import level from 'level'

import idMap from './map.id.js'
import objMap from './map.obj.js'
import propMap from './map.prop.js'
import writer from './write.js'

// _match is nested by default so that AND and OR work correctly under
// the bonnet. Flatten array before presenting to consumer
const flattenMatchArrayInResults = results => results.map(result => {
  result._match = result._match.flat(Infinity)
  return result
})

const makeAFii = (db, ops) => ({
  AVAILABLE_FIELDS: idMap(db, ops).AVAILABLE_FIELDS,
  AND: (...keys) => idMap(db, ops).INTERSECTION(...keys).then(
    flattenMatchArrayInResults
  ),
  BUCKET: idMap(db, ops).BUCKET,
  BUCKETFILTER: idMap(db, ops).BUCKETFILTER,
  DELETE: writer(db, ops).DELETE,
  DISTINCT: propMap(db, ops).DIST,
  GET: idMap(db, ops).GET,
  MAX: propMap(db, ops).MAX,
  MIN: propMap(db, ops).MIN,
  NOT: (...keys) => idMap(db, ops).SET_SUBTRACTION(...keys).then(
    flattenMatchArrayInResults
  ),
  OBJECT: objMap(db, ops).OBJECT,
  OR: (...keys) => idMap(db, ops).UNION(...keys).then(
    flattenMatchArrayInResults
  ),
  PUT: writer(db, ops).PUT,
  SET_SUBTRACTION: idMap(db, ops).SET_SUBTRACTION,
  STORE: db
})

export default function fii (ops, callback) {
  ops = Object.assign({}, {
    name: 'fii',
    // tokenAppend can be used to create 'comment' spaces in
    // tokens. For example using '#' allows tokens like boom#1.00 to
    // be retrieved by using "boom". If tokenAppend wasnt used, then
    // {gte: 'boom', lte: 'boom'} would also return stuff like
    // boomness#1.00 etc
    tokenAppend: ''
  }, ops)
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
