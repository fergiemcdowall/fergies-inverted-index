const fii = require('../../')
const levelOptions = require('../../src/options.js')
const test = require('tape')
const { EntryStream } = require('level-read-stream')

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'store-vector-test'

test('create index', t => {
  t.plan(1)
  fii({
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

test('can verify store', t => {
  const entries = [
    { key: ['FIELD', 'text'], value: 'text' },
    { key: ['IDX', 'text', ['a']], value: [0, 1] },
    { key: ['IDX', 'text', ['interesting']], value: [1] },
    { key: ['IDX', 'text', ['is']], value: [0, 1] },
    { key: ['IDX', 'text', ['sentence']], value: [0, 1] },
    { key: ['IDX', 'text', ['that']], value: [1] },
    { key: ['IDX', 'text', ['this']], value: [0] }
  ]
  t.plan(entries.length + 1)
  new EntryStream(global[indexName].STORE, { lt: ['~'], ...levelOptions })
    .on('data', d => t.deepEquals(d, entries.shift()))
    .on('end', resolve => t.pass('ended'))
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
