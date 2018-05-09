const encode = require('encoding-down')
const leveldown = require('leveldown')
const levelup = require('levelup')

const create = require('./create.js')
const read = require('./read.js')

module.exports = function (options) {
  var options = Object.assign({
    name: 'naturaldb'
  }, options || {})
  
  return new Promise((resolve, reject) => {
    levelup(encode(leveldown(options.name), {
      valueEncoding: 'json'
    }), (err, db) => {
      if (err) return reject(err)
      return resolve ({
        put: create(db).put,
        get: read(db).get
      })
    })
  })

}
