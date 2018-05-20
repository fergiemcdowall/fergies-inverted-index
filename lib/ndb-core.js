const encode = require('encoding-down')
const leveldown = require('leveldown')
const levelup = require('levelup')

const create = require('./create.js')
//const destroy = require('./destroy.js')
const read = require('./read.js')

module.exports = function (options) {
  options = Object.assign({
    name: 'naturaldb'
  }, options || {})
  
  return new Promise((resolve, reject) => {
    levelup(encode(leveldown(options.name), {
      valueEncoding: 'json'
    }), (err, db) => {
      if (err) return reject(err)
      return resolve ({
        bat: create(db).bat,
        /* del: destroy(db).del,*/
        get: read(db).get,
        put: create(db).put
      })
    })
  })

}
