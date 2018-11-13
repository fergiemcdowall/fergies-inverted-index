const encode = require('encoding-down')
const leveldown = require('leveldown')
const levelup = require('levelup')
const idMap = require('./map.id.js')
const objMap = require('./map.obj.js')
const propMap = require('./map.prop.js')
const writer = require('./writer2.js')

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
    write: {
      PUT: writer(db).PUT,
      DELETE: writer(db).DELETE
    },
    ids: {
      AND: idMap(db).INTERSECTION,
      EACH: idMap(db).EACH,
      GET: idMap(db).GET,
      NOT: idMap(db).SET_DIFFERENCE,
      OR: idMap(db).UNION
    },
    OBJECT: objMap(db).OBJECT,
    properties: {
      MAX: propMap(db).MAX,
      MIN: propMap(db).MIN,
      DISTINCT: propMap(db).DIST,  // do start/end here
      RANGE: propMap(db).RAN   // is this needed?
    }        
  }
}
