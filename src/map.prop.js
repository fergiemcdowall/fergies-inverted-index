export default function init (db) {
  const MIN = key => {
    var ops = {
      limit: 1,
      gte: key + '!'
    }
    return new Promise((resolve, reject) => {
      db.createKeyStream(ops)
        .on('data', resolve)
    })
  }

  const MAX = key => {
    var ops = {
      limit: 1,
      lte: key + '￮',
      reverse: true
    }
    return new Promise((resolve, reject) => {
      db.createKeyStream(ops)
        .on('data', resolve)
    })
  }

  const DIST = ops => {
    if (typeof ops === 'string') {
      ops = {
        gte: ops,
        lte: ops + '￮'
      }
    }
    const keys = []
    return new Promise((resolve, reject) => {
      db.createKeyStream(ops)
        .on('data', data => { keys.push(data) })
        .on('end', () => resolve(keys))
    })
  }

  return {
    DIST: DIST,
    MAX: MAX,
    MIN: MIN
  }
}
