const encode = require('encoding-down')
const idMap = require('./map.id.js')
const leveldown = require('leveldown')
const levelup = require('levelup')
const objMap = require('./map.obj.js')
const propMap = require('./map.prop.js')
const writer = require('./writer.js')

module.exports = function (options) {
  return new Promise((resolve, reject) => {
    levelup(encode(leveldown(options.name), {
      valueEncoding: 'json'
    }), (err, db) => {
      if (err) return reject(err)
      return resolve(api(db))
    })
  })
}

const api = function (db) {
  return {
    AND: idMap(db).INTERSECTION,
    DELETE: writer(db).DELETE,
    DISTINCT: propMap(db).DIST, // do start/end here
    EACH: idMap(db).EACH,
    GET: idMap(db).GET,
    MAX: propMap(db).MAX,
    MIN: propMap(db).MIN,
    NOT: idMap(db).SET_DIFFERENCE,
    OBJECT: objMap(db).OBJECT,
    OR: idMap(db).UNION,
    PUT: writer(db).PUT,
    RANGE: propMap(db).RAN
  }
}
