const fii = require('../../')
const test = require('tape')

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'AND'

const data = [
  {
    _id: 0,
    make: 'BMW',
    colour: 'Blue',
    year: 2011,
    price: 8398,
    model: '3-series',
    drivetrain: 'Hybrid'
  },
  {
    _id: 1,
    make: 'Volvo',
    colour: 'Black',
    year: 2016,
    price: 442742,
    model: 'XC90',
    drivetrain: 'Petrol'
  },
  {
    _id: 2,
    make: 'Volvo',
    colour: 'Silver',
    year: 2008,
    price: 33114,
    model: 'XC90',
    drivetrain: 'Hybrid'
  },
  {
    _id: 3,
    make: 'Volvo',
    colour: 'Silver',
    year: 2007,
    price: 0,
    model: 'XC60',
    drivetrain: 'Hybrid'
  },
  {
    _id: 4,
    make: 'BMW',
    colour: 'Black',
    year: 2000,
    price: 10,
    model: '5-series',
    drivetrain: 'Diesel'
  },
  {
    _id: 5,
    make: 'Tesla',
    colour: 'Red',
    year: 2014,
    price: 100000000000000000,
    model: 'X',
    drivetrain: 'Electric'
  },
  {
    _id: 6,
    make: 'Tesla',
    colour: 'Blue',
    year: 2017,
    price: 9,
    model: 'S',
    drivetrain: 'Electric'
  },
  {
    _id: 7,
    make: 'BMW',
    colour: 'Black',
    year: 2019,
    price: 57280,
    model: '3-series',
    drivetrain: 'Petrol'
  },
  {
    _id: 8,
    make: 'BMW',
    colour: 'Silver',
    year: 2015,
    price: 81177,
    model: '3-series',
    drivetrain: 'Petrol'
  },
  {
    _id: 9,
    make: 'Volvo',
    colour: 'White',
    year: 2004,
    price: 3751,
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
  global[indexName].PUT(data).then(t.pass)
})

test('get simple AND', t => {
  t.plan(1)
  global[indexName].AND('drivetrain:Diesel', 'colour:Black').then(result =>
    t.deepEqual(result, [
      {
        _id: 4,
        _match: [
          { FIELD: 'drivetrain', VALUE: 'Diesel' },
          { FIELD: 'colour', VALUE: 'Black' }
        ]
      }
    ])
  )
})

test('get simple AND for NUMERIC values, no VALUE specified', t => {
  t.plan(1)
  global[indexName]
    .AND({
      FIELD: 'price'
    })
    .then(result =>
      t.deepEqual(result, [
        { _id: 3, _match: [{ FIELD: 'price', VALUE: 0 }] },
        { _id: 6, _match: [{ FIELD: 'price', VALUE: 9 }] },
        { _id: 4, _match: [{ FIELD: 'price', VALUE: 10 }] },
        { _id: 9, _match: [{ FIELD: 'price', VALUE: 3751 }] },
        { _id: 0, _match: [{ FIELD: 'price', VALUE: 8398 }] },
        { _id: 2, _match: [{ FIELD: 'price', VALUE: 33114 }] },
        { _id: 7, _match: [{ FIELD: 'price', VALUE: 57280 }] },
        { _id: 8, _match: [{ FIELD: 'price', VALUE: 81177 }] },
        { _id: 1, _match: [{ FIELD: 'price', VALUE: 442742 }] },
        { _id: 5, _match: [{ FIELD: 'price', VALUE: 100000000000000000 }] }
      ])
    )
})

test('get simple AND for ALPHABETICAL values, no VALUE specified', t => {
  t.plan(1)
  global[indexName]
    .AND({
      FIELD: 'make'
    })
    .then(result =>
      t.deepEqual(result, [
        { _id: 0, _match: [{ FIELD: 'make', VALUE: 'BMW' }] },
        { _id: 4, _match: [{ FIELD: 'make', VALUE: 'BMW' }] },
        { _id: 7, _match: [{ FIELD: 'make', VALUE: 'BMW' }] },
        { _id: 8, _match: [{ FIELD: 'make', VALUE: 'BMW' }] },
        { _id: 5, _match: [{ FIELD: 'make', VALUE: 'Tesla' }] },
        { _id: 6, _match: [{ FIELD: 'make', VALUE: 'Tesla' }] },
        { _id: 1, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
        { _id: 2, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
        { _id: 3, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
        { _id: 9, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] }
      ])
    )
})

test('get simple AND for NUMERIC values', t => {
  t.plan(1)
  global[indexName]
    .AND({
      FIELD: 'price',
      VALUE: {
        GTE: 100,
        LTE: 60000
      }
    })
    .then(result =>
      t.deepEqual(result, [
        { _id: 9, _match: [{ FIELD: 'price', VALUE: 3751 }] },
        { _id: 0, _match: [{ FIELD: 'price', VALUE: 8398 }] },
        { _id: 2, _match: [{ FIELD: 'price', VALUE: 33114 }] },
        { _id: 7, _match: [{ FIELD: 'price', VALUE: 57280 }] }
      ])
    )
})

test('get simple AND for NUMERIC values', t => {
  t.plan(1)
  global[indexName]
    .AND({
      FIELD: 'price',
      VALUE: {
        GTE: 0,
        LTE: 100
      }
    })
    .then(result =>
      t.deepEqual(result, [
        { _id: 3, _match: [{ FIELD: 'price', VALUE: 0 }] },
        { _id: 6, _match: [{ FIELD: 'price', VALUE: 9 }] },
        { _id: 4, _match: [{ FIELD: 'price', VALUE: 10 }] }
      ])
    )
})
