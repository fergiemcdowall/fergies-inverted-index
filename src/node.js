const fii = require('./main.js')
const leveldown = require('leveldown')

module.exports = ops =>
  fii(
    Object.assign(
      {
        db: leveldown
      },
      ops
    )
  )
