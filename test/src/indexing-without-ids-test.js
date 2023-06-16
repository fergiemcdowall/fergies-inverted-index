const fii = require('../../')
const levelOptions = require('../../src/options.js')
const test = require('tape')
const { EntryStream } = require('level-read-stream')

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'indexing-without-ids-test'

test('create another index', t => {
  t.plan(1)
  fii({ name: indexName }).then(db => {
    global[indexName] = db
    t.ok(db, !undefined)
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
  const result = [
    {
      key: ['DOC', 1],
      value: { land: 'SCOTLAND', colour: 'GREEN', _id: 1 }
    },
    {
      key: ['DOC', 2],
      value: { land: 'IRELAND', colour: 'GREEN', _id: 2 }
    },
    { key: ['FIELD', 'colour'], value: 'colour' },
    { key: ['FIELD', 'land'], value: 'land' },
    { key: ['IDX', 'colour', ['GREEN']], value: [1, 2] },
    { key: ['IDX', 'land', ['IRELAND']], value: [2] },
    { key: ['IDX', 'land', ['SCOTLAND']], value: [1] }
  ]
  t.plan(result.length)
  new EntryStream(global[indexName].STORE, { lt: ['~'], ...levelOptions }).on('data', d =>
    t.deepEqual(d, result.shift())
  )
})
