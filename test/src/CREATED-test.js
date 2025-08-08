import { InvertedIndex } from 'fergies-inverted-index'

import test from 'tape'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'CREATED'

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

test('timestamp was created', t => {
  t.plan(1)
  global[indexName].STORE.get(['~CREATED'])
    .then(created => {
      timestamp = created
      return t.pass('timestamp created')
    })
    .catch(t.error)
})

test('can read CREATED timestamp with API', t => {
  t.plan(1)
  global[indexName].CREATED().then(res => t.equals(res, timestamp))
})

test('closing instance', t => {
  t.plan(1)
  global[indexName].STORE.close().then(() => {
    global[indexName] = null
    t.ok('closed')
  })
})

test('confirm index is closed', t => {
  t.plan(1)
  t.equals(global[indexName], null)
})

test('recreate index', t => {
  t.plan(1)
  t.ok((global[indexName] = new InvertedIndex({ name: indexName })), !undefined)
})

test('CREATED timestamp is unchanged after db is closed and reopened', t => {
  t.plan(1)
  global[indexName].CREATED().then(res => t.equals(res, timestamp))
})
