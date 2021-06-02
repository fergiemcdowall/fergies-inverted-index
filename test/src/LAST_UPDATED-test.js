const fii = require('../../')
const test = require('tape')

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'LAST_UPDATED'

var timestamp

test('create index', t => {
  t.plan(1)
  fii({ name: indexName }).then(db => {
    global[indexName] = db
    t.ok(db, !undefined)
  })
})

test('LAST_UPDATED timestamp was created', t => {
  t.plan(1)
  global[indexName].STORE.get(['~LAST_UPDATED'])
    .then(created => {
      timestamp = created
      return t.pass('LAST_UPDATED timestamp created ' + timestamp)
    })
})

test('can read LAST_UPDATED timestamp with API', t => {
  t.plan(1)
  global[indexName].LAST_UPDATED().then(res => t.equals(res, timestamp))
})

test('when adding a new doc, LAST_UPDATE increments', t => {
  t.plan(1)
  global[indexName].PUT([{
    text: 'this is a new doc'.split()
  }]).then(global[indexName].LAST_UPDATED)
    .then(newTimestamp => t.ok(newTimestamp > timestamp))
})
