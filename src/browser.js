const fii = require('./main.js')
const { BrowserLevel } = require('browser-level')

/**
 * Creates an inverted index using [`BrowserLevel`](https://github.com/Level/browser-level)
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
