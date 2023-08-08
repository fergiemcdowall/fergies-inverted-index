import test from 'tape'
import { EntryStream } from 'level-read-stream'
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

test('can verify store', t => {
  const entries = [
    {
      key: ['DOC', 0],
      value: { _id: 0, text: ['this', 'is', 'a', 'sentence'] }
    },
    {
      key: ['DOC', 1],
      value: { _id: 1, text: ['a', 'sentence', 'that', 'is', 'interesting'] }
    },
    { key: ['FIELD', 'text'], value: 'text' },
    { key: ['IDX', 'text', ['interesting']], value: [1] },
    { key: ['IDX', 'text', ['sentence']], value: [0, 1] }
  ]
  t.plan(entries.length + 1)
  new EntryStream(global[indexName].STORE, { lt: ['~'] })
    .on('data', d => t.deepEquals(d, entries.shift()))
    .on('end', resolve => t.pass('ended'))
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
