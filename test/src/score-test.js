const fii = require('../../')
const test = require('tape')

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'score'

const data = [
  {
    _id: 0,
    make: 'BMW',
    colour: 'Blue',
    year: JSON.stringify([2011, 0.3]),
    price: 8398,
    model: '3-series',
    drivetrain: 'Hybrid'
  },
  {
    _id: 1,
    make: 'Volvo',
    colour: 'Black',
    year: JSON.stringify([2016, 234]),
    price: 0,
    model: 'XC90',
    drivetrain: 'Petrol'
  },
  {
    _id: 2,
    make: 'Volvo',
    colour: 'Silver',
    year: JSON.stringify([2008, 98623]),
    price: 4,
    model: 'XC90',
    drivetrain: 'Hybrid'
  },
  {
    _id: 3,
    make: 'Volvo',
    colour: 'Silver',
    year: JSON.stringify([2007, -1]),
    price: 4739100,
    model: 'XC60',
    drivetrain: 'Hybrid'
  },
  {
    _id: 4,
    make: 'BMW',
    colour: 'Black',
    year: JSON.stringify([2000, 'comment']),
    price: 88652,
    model: '5-series',
    drivetrain: 'Diesel'
  },
  {
    _id: 5,
    make: 'Tesla',
    colour: 'Red',
    year: JSON.stringify([2014, -0.95]),
    price: 10,
    model: 'X',
    drivetrain: 'Electric'
  },
  {
    _id: 6,
    make: 'Tesla',
    colour: 'Blue',
    year: JSON.stringify([2017, 1]),
    price: 999,
    model: 'S',
    drivetrain: 'Electric'
  },
  {
    _id: 7,
    make: 'BMW',
    colour: 'Black',
    year: JSON.stringify([2019, 0]),
    price: 111111111111111,
    model: '3-series',
    drivetrain: 'Petrol'
  },
  {
    _id: 8,
    make: 'BMW',
    colour: 'Silver',
    year: JSON.stringify([2015, 12345]),
    price: 81177,
    model: '3-series',
    drivetrain: 'Petrol'
  },
  {
    _id: 9,
    make: 'Volvo',
    colour: 'White',
    year: JSON.stringify([2004, 'ÅØÆ']),
    price: 37512,
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

test('search in specified field', t => {
  const { AND } = global[indexName]
  t.plan(1)
  AND({
    FIELD: 'year',
    VALUE: 2000
  }).then(result =>
    t.deepEquals(result, [
      { _id: '4', _match: [{ FIELD: 'year', VALUE: 2000, SCORE: 'comment' }] }
    ])
  )
})

test('search in specified field', t => {
  const { AND } = global[indexName]
  t.plan(1)
  AND({
    FIELD: 'year',
    VALUE: {
      GTE: 2004,
      LTE: 2015
    }
  }).then(result =>
    t.deepEquals(result, [
      { _id: '9', _match: [{ FIELD: 'year', VALUE: 2004, SCORE: 'ÅØÆ' }] },
      { _id: '3', _match: [{ FIELD: 'year', VALUE: 2007, SCORE: -1 }] },
      { _id: '2', _match: [{ FIELD: 'year', VALUE: 2008, SCORE: 98623 }] },
      { _id: '0', _match: [{ FIELD: 'year', VALUE: 2011, SCORE: 0.3 }] },
      { _id: '5', _match: [{ FIELD: 'year', VALUE: 2014, SCORE: -0.95 }] },
      { _id: '8', _match: [{ FIELD: 'year', VALUE: 2015, SCORE: 12345 }] }
    ])
  )
})

test('search in all fields', t => {
  const { AND } = global[indexName]
  t.plan(1)
  AND({
    VALUE: 2000
  }).then(result =>
    t.deepEquals(result, [
      { _id: '4', _match: [{ FIELD: 'year', VALUE: 2000, SCORE: 'comment' }] }
    ])
  )
})
