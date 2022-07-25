const fii = require('./main.js')
const charwise = require('charwise')
const { BrowserLevel } = require('browser-level')

module.exports = ops =>
  fii(
    Object.assign(
      {
        db: new BrowserLevel(ops.name, {
          keyEncoding: charwise,
          valueEncoding: 'json'
        })
      },
      ops
    )
  )
