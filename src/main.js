import level from 'level'

import idMap from './map.id.js'
import objMap from './map.obj.js'
import propMap from './map.prop.js'
import writer from './write.js'

const makeAFii = (db, ops) => ({
  AVAILABLE_FIELDS: idMap(db, ops).AVAILABLE_FIELDS,
  AND: idMap(db, ops).INTERSECTION,
  BUCKET: idMap(db, ops).BUCKET,
  BUCKETFILTER: idMap(db, ops).BUCKETFILTER,
  DELETE: writer(db, ops).DELETE,
  DISTINCT: propMap(db, ops).DIST,
  GET: idMap(db, ops).GET,
  MAX: propMap(db, ops).MAX,
  MIN: propMap(db, ops).MIN,
  //    NOT: idMap(db).SET_DIFFERENCE,
  NOT: idMap(db, ops).SET_SUBTRACTION,
  OBJECT: objMap(db, ops).OBJECT,
  OR: idMap(db, ops).UNION,
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
