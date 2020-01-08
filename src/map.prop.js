export default function init (db) {
  const getRange = ops => new Promise((resolve, reject) => {
    const keys = []
    db.createKeyStream(ops)
      .on('data', data => { keys.push(data) })
      .on('end', () => resolve(keys))
  })

  const MIN = key => new Promise((resolve, reject) => {
    db.createKeyStream({
      limit: 1,
      gte: key + '!'
    }).on('data', resolve)
  })
  
  const MAX = key => new Promise((resolve, reject) => {
    db.createKeyStream({
      limit: 1,
      lte: key + '￮',
      reverse: true
    }).on('data', resolve)
  })
  
  const DIST = ops => getRange({
    gte: ops.field + ':' + ((ops.value && ops.value.gte) || ''),
    lte: ops.field + ':' + ((ops.value && ops.value.lte) || '') + '￮',
  }).then(items => items.map(item => ({
    field: item.split(/:(.+)/)[0],
    value: item.split(/:(.+)/)[1]
  })))
  
  return {
    DIST: DIST,
    MAX: MAX,
    MIN: MIN
  }
}
