const fii = require('../../')
const test = require('tape')

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'PUT'

const data = [
  {
    _id: 0,
    make: 'BMW',
    colour: 'Blue',
    model: '3-series',
    drivetrain: 'Hybrid'
  },
  {
    _id: 1,
    make: 'Volvo',
    colour: 'Black',
    model: 'XC90',
    drivetrain: 'Petrol'
  },
  {
    _id: 2,
    make: 'Volvo',
    colour: 'Silver',
    model: 'XC90',
    drivetrain: 'Hybrid'
  }
]

test('create index', t => {
  t.plan(1)
  fii({ name: indexName }).then(db => {
    global[indexName] = db
    t.ok(db, !undefined)
  })
})

test('can add some data', t => {
  t.plan(1)
  global[indexName]
    .PUT(data)
    .then(res => t.deepEquals(res, [
      { _id: '0', status: 'CREATED', operation: 'PUT' },
      { _id: '1', status: 'CREATED', operation: 'PUT' },
      { _id: '2', status: 'CREATED', operation: 'PUT' }
    ]))
})

test('adds a duplicate doc', t => {
  t.plan(1)
  global[indexName]
    .PUT([data[1]])
    .then(res => t.deepEquals(res, [
      { _id: '1', status: 'UPDATED', operation: 'PUT' }
    ]))
})
