import test from 'tape'
import { InvertedIndex } from 'fergies-inverted-index'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'reopening'

const global = {}

test('create index', t => {
  t.plan(1)
  const db = new InvertedIndex({ name: indexName })
  global[indexName] = db
  t.ok(db, !undefined)
})

test('can add some data', t => {
  t.plan(1)
  global[indexName]
    .PUT([
      {
        _id: 1,
        colour: 'Black',
        drivetrain: 'Diesel'
      }
    ])
    .then(() => t.pass())
})

test('get simple AND', t => {
  t.plan(1)

  global[indexName].AND(['Diesel']).then(result =>
    t.deepEqual(result, [
      {
        _id: 1,
        _match: [{ FIELD: 'drivetrain', VALUE: 'Diesel' }]
      }
    ])
  )
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

test('reopen index', t => {
  t.plan(2)
  const db = new InvertedIndex({ name: indexName })
  global[indexName] = db
  global[indexName].EVENTS.on('ready', () => t.pass('ready event emitted'))
  t.ok(db, !undefined)
})

test('get simple AND', t => {
  t.plan(1)

  global[indexName].AND(['Diesel']).then(result =>
    t.deepEqual(result, [
      {
        _id: 1,
        _match: [{ FIELD: 'drivetrain', VALUE: 'Diesel' }]
      }
    ])
  )
})
