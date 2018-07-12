const _ = require('lodash')

module.exports = function (db) {

  const RAN = function (ops) {
    var set = []
    return new Promise ((resolve, reject) => {
      db.createReadStream(ops)
        .on('data', data => {
          set.push(data)
        }).on('end', () => {
          return resolve(set)
        })
    })
  }

  const MIN = function (ops) {
    ops = Object.assign({ limit: 1 }, ops)
    ops.reverse = false   // force direction
    var set = []
    return new Promise ((resolve, reject) => {
      db.createReadStream(ops)
        .on('data', data => {
          set.push(data)
        }).on('end', () => {
          return resolve(set)
        })
    })
  }

  const MAX = function (ops) {
    ops = Object.assign({ limit: 1 }, ops)
    ops.reverse = true   // force direction
    var set = []
    return new Promise ((resolve, reject) => {
      db.createReadStream(ops)
        .on('data', data => {
          set.push(data)
        }).on('end', () => {
          return resolve(set)
        })
    })
  }

  return {
    RAN: RAN,
    MAX: MAX,
    MIN: MIN
  }
}
