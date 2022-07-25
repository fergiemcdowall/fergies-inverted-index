const fii = require('./main.js')
const { BrowserLevel } = require('browser-level')

module.exports = ops =>
  fii(
    Object.assign(
      {
        db: new BrowserLevel(ops.name)
      },
      ops
    )
  )
