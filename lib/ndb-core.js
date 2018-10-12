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
        put: create(db).put,
        getObjectIds: {
          OR: docMap(db).OR,
          AND: docMap(db).AND,
          EACH: docMap(db).EACH
          
          // needs an EACH
          
        },
        getFullObjects: ids => Promise.all(
          ids.map(id => db.get('!DOC￮' + id._id + '￮'))
        ),
        getProperties: {
          MAX: keyMap(db).MAX,
          MIN: keyMap(db).MIN,
          DIST: keyMap(db).DIST,
          
          RAN: keyMap(db).RAN   // is this needed?
          // put MAX, MIN etc in here.
        }        
      })
    })
  })

}
