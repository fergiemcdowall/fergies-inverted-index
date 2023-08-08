import test from 'tape'
import { InvertedIndex } from 'fergies-inverted-index'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'store-vector-test'

const global = {}

test('create index', t => {
  t.plan(1)
  new InvertedIndex({
    name: indexName
  }).then(db => {
    global[indexName] = db
    t.ok(db, !undefined)
  })
})

test('can add some data', t => {
  const data = [
    {
      _id: 0,
      text: 'this is a sentence'.split(' ')
    },
    {
      _id: 1,
      text: 'a sentence that is interesting'.split(' ')
    }
  ]
  t.plan(1)
  global[indexName]
    .PUT(data, {
      storeVectors: false
    })
    .then(t.pass)
})

test('can verify store', async t => {
  const entries = [
    [['FIELD', 'text'], 'text'],
    [
      ['IDX', 'text', ['a']],
      [0, 1]
    ],
    [['IDX', 'text', ['interesting']], [1]],
    [
      ['IDX', 'text', ['is']],
      [0, 1]
    ],
    [
      ['IDX', 'text', ['sentence']],
      [0, 1]
    ],
    [['IDX', 'text', ['that']], [1]],
    [['IDX', 'text', ['this']], [0]]
  ]
  t.plan(entries.length)
  for await (const entry of global[indexName].STORE.iterator({
    lt: ['~']
  })) {
    t.deepEquals(entry, entries.shift())
  }
})

test('can read data ignoring stopwords', t => {
  t.plan(1)
  global[indexName].GET('interesting').then(result => {
    t.deepEqual(result, [
      { _id: 1, _match: [{ FIELD: 'text', VALUE: 'interesting' }] }
    ])
  })
})

test('gracefully fails when attempting to delete', t => {
  t.plan(1)
  global[indexName].DELETE([1]).then(result => {
    t.deepEqual(result, [{ _id: 1, status: 'FAILED', operation: 'DELETE' }])
  })
})
