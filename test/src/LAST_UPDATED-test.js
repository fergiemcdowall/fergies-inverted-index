import test from 'tape'
import { InvertedIndex } from 'fergies-inverted-index'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'LAST_UPDATED'

const global = {}

let timestamp

test('create index', t => {
  t.plan(1)
  t.ok((global[indexName] = new InvertedIndex({ name: indexName })), !undefined)
})

test('a little pause here since timestamping is asynchronous', t => {
  t.plan(1)
  setTimeout(() => {
    t.ok(true)
  }, 100)
})

test('LAST_UPDATED timestamp was created', t => {
  t.plan(1)
  global[indexName].STORE.get(['~LAST_UPDATED'])
    .then(created => {
      timestamp = created
      return t.pass('LAST_UPDATED timestamp created ' + timestamp)
    })
    .catch(t.error)
})

test('can read LAST_UPDATED timestamp with API', t => {
  t.plan(1)
  global[indexName].LAST_UPDATED().then(res => t.equals(res, timestamp))
})

test('when adding a new doc, LAST_UPDATE increments', t => {
  t.plan(1)
  setTimeout(function () {
    // wait to ensure that newer timestamp is bigger
    global[indexName]
      .PUT([
        {
          text: 'this is a new doc'.split()
        }
      ])
      .then(global[indexName].LAST_UPDATED)
      .then(newTimestamp => t.ok(newTimestamp > timestamp))
  }, 100)
})
