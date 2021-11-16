const fii = require('./main.js')
const leveldown = require('level-js')

module.exports = ops =>
  fii(
    Object.assign(
      {
        db: leveldown
      },
      ops
    )
  )
