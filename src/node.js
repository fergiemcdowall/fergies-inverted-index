const fii = require('./main.js')
const { ClassicLevel } = require('classic-level')

/**
 * Creates an inverted index using [`ClassicLevel`](https://github.com/Level/classic-level)
 * @param {import("./main.js").FiiOptions} [ops] Options
 * @returns {Promise<import("./main").Fii>}
 */
const node = ops =>
  fii(
    Object.assign(
      {
        db: ClassicLevel
      },
      ops
    )
  )

module.exports = node
