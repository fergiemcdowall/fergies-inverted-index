const encode = require('encoding-down')
const idMap = require('./map.id.js')
const leveldown = require('leveldown')
const levelup = require('levelup')
const memdown = require('memdown')
const objMap = require('./map.obj.js')
const propMap = require('./map.prop.js')
const writer = require('./write.js')


const OPEN = ops => new Promise((resolve, reject) => {
  const down = leveldown(ops.name)
  // const down = memdown(ops.name)
  levelup(encode(down, { // should maybe default to memdown?
    valueEncoding: 'json'
  }), (err, db) => resolve({
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
  }))
})

// open a new instance and create a reference from global
const INIT = async ops => {
  global[ops.name] = await OPEN(ops)
}

exports.INIT = INIT
exports.OPEN = OPEN
