const fii = require('../../')
const test = require('tape')

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'EXIST'

const data = [
  {
    _id: 0,
    make: 'BMW',
    colour: 'Blue'
  },
  {
    _id: 1,
    make: 'Volvo',
    colour: 'Black'
  },
  {
    _id: 2,
    make: 'Volvo',
    colour: 'Silver'
  },
  {
    _id: 3,
    make: 'Volvo',
    colour: 'Silver'
  },
  {
    _id: 4,
    make: 'BMW',
    colour: 'Black'
  },
  {
    _id: 5,
    make: 'Tesla',
    colour: 'Red'
  },
  {
    _id: 6,
    make: 'Tesla',
    colour: 'Blue'
  },
  {
    _id: 7,
    make: 'BMW',
    colour: 'Black'
  },
  {
    _id: 8,
    make: 'BMW',
    colour: 'Silver'
  },
  {
    _id: 9,
    make: 'Volvo',
    colour: 'White'
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
  global[indexName].PUT(data.slice(0, 6)).then(res =>
    t.deepEquals(res, [
      { _id: 0, status: 'CREATED', operation: 'PUT' },
      { _id: 1, status: 'CREATED', operation: 'PUT' },
      { _id: 2, status: 'CREATED', operation: 'PUT' },
      { _id: 3, status: 'CREATED', operation: 'PUT' },
      { _id: 4, status: 'CREATED', operation: 'PUT' },
      { _id: 5, status: 'CREATED', operation: 'PUT' }
    ])
  )
})

test('see if docs EXIST', t => {
  t.plan(1)
  global[indexName]
    .EXIST(1, 2, 3)
    .then(result => t.deepEqual(result, [1, 2, 3]))
})

test('see if docs EXIST', t => {
  t.plan(1)
  global[indexName].EXIST(7, 8, 9).then(result => t.deepEqual(result, []))
})

test('see if docs EXIST', t => {
  t.plan(1)
  global[indexName].EXIST(4, 1, 7).then(result => t.deepEqual(result, [4, 1]))
})

test('can add some more data', t => {
  t.plan(1)
  global[indexName].PUT(data.slice(-6)).then(res =>
    t.deepEquals(res, [
      { _id: 4, status: 'UPDATED', operation: 'PUT' },
      { _id: 5, status: 'UPDATED', operation: 'PUT' },
      { _id: 6, status: 'CREATED', operation: 'PUT' },
      { _id: 7, status: 'CREATED', operation: 'PUT' },
      { _id: 8, status: 'CREATED', operation: 'PUT' },
      { _id: 9, status: 'CREATED', operation: 'PUT' }
    ])
  )
})
