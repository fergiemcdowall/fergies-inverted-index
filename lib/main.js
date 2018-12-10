const encode = require('encoding-down')
const idMap = require('./map.id.js')
const leveldown = require('leveldown')
const levelup = require('levelup')
const memdown = require('memdown')
const objMap = require('./map.obj.js')
const propMap = require('./map.prop.js')
const writer = require('./write.js')

module.exports = function (options) {

  const down = leveldown(options.name)
  // const down = memdown(options.name)

  return new Promise((resolve, reject) => {
    levelup(encode(down, { // should maybe default to memdown?
      valueEncoding: 'json'
    }), (err, db) => {
      return resolve(api(db))
    })

  })
}

const api = db => {
  return {
    AND: idMap(db).INTERSECTION,
    DELETE: writer(db).DELETE,
    DISTINCT: propMap(db).DIST,
    EACH: idMap(db).EACH,
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
