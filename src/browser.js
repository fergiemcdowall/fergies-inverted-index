const fii = require('./main.js')
const { BrowserLevel } = require('browser-level')

/**
 * Browser Fii
 * @param {import("./main").FiiOptions} [ops] Options
 * @returns {Promise<import("./main").Fii>}
 */
const browser = ops =>
  fii(
    Object.assign(
      {
        db: BrowserLevel
      },
      ops
    )
  )

module.exports = browser
