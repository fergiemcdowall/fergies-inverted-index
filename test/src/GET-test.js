const fii = require('../../')
const test = require('tape')

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'GET'

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
    colour: JSON.stringify(['Black', 999]),
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

test('simple GET', t => {
  t.plan(1)
  global[indexName].GET('make:Volvo').then(result =>
    t.deepEqual(result, [
      { _id: 1, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
      { _id: 2, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
      { _id: 3, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
      { _id: 9, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] }
    ])
  )
})

test('simple GET with SCORE', t => {
  t.plan(1)
  global[indexName].GET('colour:Black').then(result =>
    t.deepEqual(result, [
      { _id: 1, _match: [{ FIELD: 'colour', VALUE: 'Black' }] },
      { _id: 7, _match: [{ FIELD: 'colour', VALUE: 'Black' }] },
      { _id: 4, _match: [{ FIELD: 'colour', VALUE: 'Black', SCORE: 999 }] }
    ])
  )
})
