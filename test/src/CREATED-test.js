const fii = require('../../')
const levelOptions = require('../../src/options.js')
const test = require('tape')

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'CREATED'

let timestamp

test('create index', t => {
  t.plan(1)
  fii({ name: indexName }).then(db => {
    global[indexName] = db
    t.ok(db, !undefined)
  })
})

test('timestamp was created', t => {
  t.plan(1)
  global[indexName].STORE.get(['~CREATED'], levelOptions)
    .then(created => {
      timestamp = created
      return t.pass('timestamp created')
    }).catch(t.error)
})

test('can read CREATED timestamp with API', t => {
  t.plan(1)
  global[indexName].CREATED().then(res => t.equals(res, timestamp))
})

test('closing instance', t => {
  t.plan(1)
  global[indexName].STORE.close(() => {
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
  fii({ name: indexName }).then(db => {
    global[indexName] = db
    t.ok(db, !undefined)
  })
})

test('CREATED timestamp is unchanged after db is closed and reopened', t => {
  t.plan(1)
  global[indexName].CREATED().then(res => t.equals(res, timestamp))
})
