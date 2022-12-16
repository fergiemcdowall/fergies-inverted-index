const fii = require('./main.js')
const { ClassicLevel } = require('classic-level')

module.exports = ({ name = 'fii', ...ops }) => fii({
  db: new ClassicLevel(name),
  ...ops
})
