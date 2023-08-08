import test from 'tape'
import { EntryStream } from 'level-read-stream'
import { InvertedIndex } from 'fergies-inverted-index'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'indexing-without-ids-test'

const global = {}

test('create another index', t => {
  t.plan(1)
  new InvertedIndex({ name: indexName }).then(db => {
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
  new EntryStream(global[indexName].STORE, { lt: ['~'] }).on('data', d =>
    t.deepEqual(d, result.shift())
  )
})
