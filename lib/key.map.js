module.exports = function (db) {

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

  const DIST = function (key, o) {
    o = o || {}
    ops = {
      gte: key + '.' + (o.gte || '') + '!',
      lte: key + '.' + (o.lte || '') + '￮'
    }
    console.log(ops)
    const keys = []
    return new Promise ((resolve, reject) => {
      db.createKeyStream(ops)
        .on('data', data => { keys.push(data) })
        .on('end', () => { return resolve(keys) })
    })
  }
  
  return {
    DIST: DIST,
    MAX: MAX,
    MIN: MIN
  }
}
