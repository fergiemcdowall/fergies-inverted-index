import fii from '../../dist/fergies-inverted-index.esm.js'
import test from 'tape'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'indexing-without-ids-test'

test('create a tiny test index', t => {
  t.plan(1)
  fii({ name: indexName }, (err, idx) => {
    global[indexName] = idx
    t.error(err)
  })
})

test('can add some worldbank data', t => {
  const data = [
    {
      land: 'SCOTLAND',
      colour: 'GREEN'
    },
    {
      land: 'IRELAND',
      colour: 'GREEN'
    }
  ]
  t.plan(1)
  global[indexName].PUT(data).then(t.pass)
})

test('can GET with string', t => {
  var result = [
    { key: 'colour:GREEN', value: [ 1, 2 ] },
    { key: 'land:IRELAND', value: [ 2 ] },
    { key: 'land:SCOTLAND', value: [ 1 ] },
    { key: '￮DOC￮1￮',
      value: { land: 'SCOTLAND', colour: 'GREEN', _id: 1 } },
    { key: '￮DOC￮2￮',
      value: { land: 'IRELAND', colour: 'GREEN', _id: 2 } },
    { key: '￮FIELD￮colour￮', value: true },
    { key: '￮FIELD￮land￮', value: true },
  ]
  t.plan(result.length)
  global[indexName].STORE.createReadStream()
    .on('data', d => t.looseEqual(d, result.shift()))
})
