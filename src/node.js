const fii = require('./main.js')
const { ClassicLevel } = require('classic-level')

module.exports = ops =>
  fii(
    Object.assign(
      {
        db: ClassicLevel
      },
      ops
    )
  )
