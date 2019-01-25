import level from 'level'

import encode from 'encoding-down'
import idMap from './map.id.js'
import objMap from './map.obj.js'
import propMap from './map.prop.js'
import writer from './write.js'


const makeAFii = db => {
  return {
    AGGREGATE: idMap(db).AGGREGATE,
    AND: idMap(db).INTERSECTION,
    BUCKET: idMap(db).BUCKET,
    BUCKETFILTER: idMap(db).AGGREGATE,
    DELETE: writer(db).DELETE,
    DISTINCT: propMap(db).DIST,
    GET: idMap(db).GET,
    MAX: propMap(db).MAX,
    MIN: propMap(db).MIN,
    NOT: idMap(db).SET_DIFFERENCE,
    OBJECT: objMap(db).OBJECT,
    OR: idMap(db).UNION,
    PUT: writer(db).PUT,
    STORE: db
  }
}

export default function fii(ops, callback) {
  ops = Object.assign({}, {
    name: 'fii'
  }, ops)
  // if no callback provided, "lazy load"
  if (!callback) {
    return makeAFii(ops.store || level(ops.name, { valueEncoding: 'json' }))
  } else {
    if (ops.store) return callback(new Error('When initing with a store use "lazy loading"'), null)
    // use callback to provide a notification that db is opened
    level(ops.name, { valueEncoding: 'json' }, (err, store) => callback(err, makeAFii(store)))
  }
}
