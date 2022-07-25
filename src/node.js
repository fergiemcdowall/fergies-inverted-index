const fii = require('./main.js')
const charwise = require('charwise')
const { ClassicLevel } = require('classic-level')

module.exports = ops =>
  fii(
    Object.assign(
      {
        db: new ClassicLevel(ops.name, {
          keyEncoding: charwise,
          valueEncoding: 'json'
        })
      },
      ops
    )
  )
