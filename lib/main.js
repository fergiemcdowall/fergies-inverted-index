const encode = require('encoding-down')
const idMap = require('./map.id.js')
const leveldown = require('leveldown')
const levelup = require('levelup')
const objMap = require('./map.obj.js')
const propMap = require('./map.prop.js')
const writer = require('./write.js')

const makeAFii = db => {
  return {
    AGGREGATE: idMap(db).AGGREGATE,
    AND: idMap(db).INTERSECTION,
    BUCKET: idMap(db).BUCKET,
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

module.exports = (ops, callback) => {
  ops = Object.assign({}, {
    down: leveldown('fii')
  }, ops)
  // if no callback provided, "lazy load"
  if (!callback) {
    // Is encoding needed?
    let db = levelup(encode(ops.down, { valueEncoding: 'json' }))
    return makeAFii(db)
  } else {
    // use callback to provide a notification that db is opened
    levelup(encode(ops.down, {
      valueEncoding: 'json'
    }), (err, db) => callback(makeAFii(db)))
  }
}

