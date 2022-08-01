const fii = require('./main.js')
const { ClassicLevel } = require('classic-level')

/**
 * Node Fii
 * @param {import("./main").FiiOptions} [ops] Options
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
