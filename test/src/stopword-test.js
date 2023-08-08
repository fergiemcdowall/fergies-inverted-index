import test from 'tape'
import { InvertedIndex } from 'fergies-inverted-index'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'stopword-test'

const global = {}

test('create index', t => {
  t.plan(1)
  new InvertedIndex({
    name: indexName,
    stopwords: ['this', 'is', 'a', 'that', 'bananas']
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
  global[indexName].PUT(data).then(t.pass)
})

test('can verify store', async t => {
  const entries = [
    [['DOC', 0], { _id: 0, text: ['this', 'is', 'a', 'sentence'] }],
    [
      ['DOC', 1],
      { _id: 1, text: ['a', 'sentence', 'that', 'is', 'interesting'] }
    ],
    [['FIELD', 'text'], 'text'],
    [['IDX', 'text', ['interesting']], [1]],
    [
      ['IDX', 'text', ['sentence']],
      [0, 1]
    ]
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
  global[indexName]
    .AND(['this', 'is', 'a', 'sentence', 'bananas'])
    .then(result => {
      t.deepEqual(result, [
        { _id: 0, _match: [{ FIELD: 'text', VALUE: 'sentence' }] },
        { _id: 1, _match: [{ FIELD: 'text', VALUE: 'sentence' }] }
      ])
    })
})
