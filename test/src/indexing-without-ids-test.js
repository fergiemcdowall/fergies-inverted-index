import test from 'tape'
import { InvertedIndex } from 'fergies-inverted-index'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'indexing-without-ids-test'

const global = {}

test('create another index', t => {
  t.plan(1)
  t.ok((global[indexName] = new InvertedIndex({ name: indexName })), !undefined)
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

test('can GET with string', async t => {
  const entries = [
    [['DOC', 1], { land: 'SCOTLAND', colour: 'GREEN', _id: 1 }],
    [['DOC', 2], { land: 'IRELAND', colour: 'GREEN', _id: 2 }],
    [['FIELD', 'colour'], 'colour'],
    [['FIELD', 'land'], 'land'],
    [
      ['IDX', 'colour', ['GREEN']],
      [1, 2]
    ],
    [['IDX', 'land', ['IRELAND']], [2]],
    [['IDX', 'land', ['SCOTLAND']], [1]]
  ]
  t.plan(entries.length)
  for await (const entry of global[indexName].STORE.iterator({
    lt: ['~']
  })) {
    t.deepEquals(entry, entries.shift())
  }
})
