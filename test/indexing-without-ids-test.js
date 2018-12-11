const fii = require('../')
const sandbox = 'test/sandbox/'
const test = require('tape')

const indexName = sandbox + 'indexing-without-ids-test'

test('create a little world bank index', t => {
  t.plan(1)
  fii.INIT({ name: indexName }).then(t.pass)
})

test('can add some worldbank data', t => {
  var dataSize = 10
  const data = [
    {
      land: 'SCOTLAND',
      colour: 'GREEN'
    },
    {
      land: 'IRELAND',
      colour: 'GREEN'
    },
  ]
  t.plan(1)
  global[indexName].PUT(data).then(t.pass)
})

test('can GET with string', t => {
  t.plan(5)
  var result = [
    { key: 'colour:GREEN', value: [ 1, 3 ] },
    { key: 'land:IRELAND', value: [ 1 ] },
    { key: 'land:SCOTLAND', value: [ 3 ] },
    { key: '￮DOC￮0￮',
      value: { land: 'SCOTLAND', colour: 'GREEN', _id: 0 } },
    { key: '￮DOC￮1￮',
      value: { land: 'IRELAND', colour: 'GREEN', _id: 1 } }
  ]
  global[indexName].STORE.createReadStream()
   .on('data', d => t.looseEqual(d, result.shift()))
})
