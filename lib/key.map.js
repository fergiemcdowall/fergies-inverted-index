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

  const MIN = function (key) {
    ops = {
      limit: 1,
      gte: key + '!'
    }
    return new Promise ((resolve, reject) => {
      db.createKeyStream(ops)
        .on('data', data => { return resolve(data) })
    })
  }

  const MAX = function (key) {
    ops = {
      limit: 1,
      lte: key + '￮',
      reverse: true
    }
    return new Promise ((resolve, reject) => {
      db.createKeyStream(ops)
        .on('data', data => { return resolve(data) })
    })
  }

  const DIST = function (key) {
    ops = {
      gte: key + '!',
      lte: key + '￮'
    }
    const keys = []
    return new Promise ((resolve, reject) => {
      db.createKeyStream(ops)
        .on('data', data => { keys.push(data) })
        .on('end', () => { return resolve(keys) })
    })
  }

  
  return {
    DIST: DIST,
    RAN: RAN,
    MAX: MAX,
    MIN: MIN
  }
}
