const encode = require('encoding-down')
const leveldown = require('leveldown')
const levelup = require('levelup')
const docMap = require('./doc.map.js')
const keyMap = require('./key.map.js')

const create = require('./create.js')
//const destroy = require('./destroy.js')

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
        get: key => db.get(key),
        put: create(db).put,
        doc: {
          map: docMap(db),
          reduce: {
            // uses ID to fetch doc from db
            fetchDocs: ids => Promise.all(
              ids.map(id => db.get('!DOC￮' + id._id + '￮'))
            )
          }
        },
        key: {
          map: keyMap(db)
        }        
      })
    })
  })

}
