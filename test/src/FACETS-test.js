const fii = require('../../')
const test = require('tape')

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'FACETS'

const data = [
  {
    _id: 0,
    make: 'BMW',
    colour: 'Blue',
    year: 2011,
    price: 83988,
    model: '3-series',
    drivetrain: 'Hybrid'
  },
  {
    _id: 1,
    make: 'Volvo',
    colour: 'Black',
    year: 2016,
    price: 44274,
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
    price: 47391,
    model: 'XC60',
    drivetrain: 'Hybrid'
  },
  {
    _id: 4,
    make: 'BMW',
    colour: 'Black',
    year: 2000,
    price: 88652,
    model: '5-series',
    drivetrain: 'Diesel'
  },
  {
    _id: 5,
    make: 'Tesla',
    colour: 'Red',
    year: 2014,
    price: 75397,
    model: 'X',
    drivetrain: 'Electric'
  },
  {
    _id: 6,
    make: 'Tesla',
    colour: 'Blue',
    year: 2017,
    price: 79540,
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

test('get FACETS for one field', t => {
  t.plan(1)
  global[indexName].FACETS({
    FIELD: 'drivetrain'
  }).then(result => t.deepEqual(result, [
    { FIELD: 'drivetrain', VALUE: 'Diesel', _id: ['4'] },
    { FIELD: 'drivetrain', VALUE: 'Electric', _id: ['5', '6'] },
    { FIELD: 'drivetrain', VALUE: 'Hybrid', _id: ['0', '2', '3', '9'] },
    { FIELD: 'drivetrain', VALUE: 'Petrol', _id: ['1', '7', '8'] }
  ]))
})

test('get FACETS for another FIELD', t => {
  t.plan(1)
  global[indexName].FACETS({
    FIELD: 'colour'
  }).then(result => t.deepEqual(result, [
    { FIELD: 'colour', VALUE: 'Black', _id: ['1', '4', '7'] },
    { FIELD: 'colour', VALUE: 'Blue', _id: ['0', '6'] },
    { FIELD: 'colour', VALUE: 'Red', _id: ['5'] },
    { FIELD: 'colour', VALUE: 'Silver', _id: ['2', '3', '8'] },
    { FIELD: 'colour', VALUE: 'White', _id: ['9'] }
  ]))
})

test('get FACETS for two FIELDs', t => {
  t.plan(1)
  global[indexName].FACETS({
    FIELD: ['colour', 'drivetrain']
  }).then(result => t.deepEqual(result, [
    { FIELD: 'colour', VALUE: 'Black', _id: ['1', '4', '7'] },
    { FIELD: 'colour', VALUE: 'Blue', _id: ['0', '6'] },
    { FIELD: 'colour', VALUE: 'Red', _id: ['5'] },
    { FIELD: 'colour', VALUE: 'Silver', _id: ['2', '3', '8'] },
    { FIELD: 'colour', VALUE: 'White', _id: ['9'] },
    { FIELD: 'drivetrain', VALUE: 'Diesel', _id: ['4'] },
    { FIELD: 'drivetrain', VALUE: 'Electric', _id: ['5', '6'] },
    { FIELD: 'drivetrain', VALUE: 'Hybrid', _id: ['0', '2', '3', '9'] },
    { FIELD: 'drivetrain', VALUE: 'Petrol', _id: ['1', '7', '8'] }
  ]))
})

test('get FACETS for two FIELDs (spread)', t => {
  t.plan(1)
  global[indexName].FACETS({
    FIELD: 'colour'
  }, {
    FIELD: 'drivetrain'
  }).then(result => t.deepEqual(result, [
    { FIELD: 'colour', VALUE: 'Black', _id: ['1', '4', '7'] },
    { FIELD: 'colour', VALUE: 'Blue', _id: ['0', '6'] },
    { FIELD: 'colour', VALUE: 'Red', _id: ['5'] },
    { FIELD: 'colour', VALUE: 'Silver', _id: ['2', '3', '8'] },
    { FIELD: 'colour', VALUE: 'White', _id: ['9'] },
    { FIELD: 'drivetrain', VALUE: 'Diesel', _id: ['4'] },
    { FIELD: 'drivetrain', VALUE: 'Electric', _id: ['5', '6'] },
    { FIELD: 'drivetrain', VALUE: 'Hybrid', _id: ['0', '2', '3', '9'] },
    { FIELD: 'drivetrain', VALUE: 'Petrol', _id: ['1', '7', '8'] }
  ]))
})

test('get FACETS for all FIELDS', t => {
  t.plan(1)
  global[indexName].FACETS().then(result => t.deepEqual(result, [
    { FIELD: 'colour', VALUE: 'Black', _id: ['1', '4', '7'] },
    { FIELD: 'colour', VALUE: 'Blue', _id: ['0', '6'] },
    { FIELD: 'colour', VALUE: 'Red', _id: ['5'] },
    { FIELD: 'colour', VALUE: 'Silver', _id: ['2', '3', '8'] },
    { FIELD: 'colour', VALUE: 'White', _id: ['9'] },
    { FIELD: 'drivetrain', VALUE: 'Diesel', _id: ['4'] },
    { FIELD: 'drivetrain', VALUE: 'Electric', _id: ['5', '6'] },
    { FIELD: 'drivetrain', VALUE: 'Hybrid', _id: ['0', '2', '3', '9'] },
    { FIELD: 'drivetrain', VALUE: 'Petrol', _id: ['1', '7', '8'] },
    { FIELD: 'make', VALUE: 'BMW', _id: ['0', '4', '7', '8'] },
    { FIELD: 'make', VALUE: 'Tesla', _id: ['5', '6'] },
    { FIELD: 'make', VALUE: 'Volvo', _id: ['1', '2', '3', '9'] },
    { FIELD: 'model', VALUE: '3-series', _id: ['0', '7', '8'] },
    { FIELD: 'model', VALUE: '5-series', _id: ['4'] },
    { FIELD: 'model', VALUE: 'S', _id: ['6'] },
    { FIELD: 'model', VALUE: 'X', _id: ['5'] },
    { FIELD: 'model', VALUE: 'XC60', _id: ['3'] },
    { FIELD: 'model', VALUE: 'XC90', _id: ['1', '2', '9'] },
    { FIELD: 'price', VALUE: '33114', _id: ['2'] },
    { FIELD: 'price', VALUE: '37512', _id: ['9'] },
    { FIELD: 'price', VALUE: '44274', _id: ['1'] },
    { FIELD: 'price', VALUE: '47391', _id: ['3'] },
    { FIELD: 'price', VALUE: '57280', _id: ['7'] },
    { FIELD: 'price', VALUE: '75397', _id: ['5'] },
    { FIELD: 'price', VALUE: '79540', _id: ['6'] },
    { FIELD: 'price', VALUE: '81177', _id: ['8'] },
    { FIELD: 'price', VALUE: '83988', _id: ['0'] },
    { FIELD: 'price', VALUE: '88652', _id: ['4'] },
    { FIELD: 'year', VALUE: '2000', _id: ['4'] },
    { FIELD: 'year', VALUE: '2004', _id: ['9'] },
    { FIELD: 'year', VALUE: '2007', _id: ['3'] },
    { FIELD: 'year', VALUE: '2008', _id: ['2'] },
    { FIELD: 'year', VALUE: '2011', _id: ['0'] },
    { FIELD: 'year', VALUE: '2014', _id: ['5'] },
    { FIELD: 'year', VALUE: '2015', _id: ['8'] },
    { FIELD: 'year', VALUE: '2016', _id: ['1'] },
    { FIELD: 'year', VALUE: '2017', _id: ['6'] },
    { FIELD: 'year', VALUE: '2019', _id: ['7'] }
  ]))
})

test('get FACETS for all FIELDS with {}', t => {
  t.plan(1)
  global[indexName].FACETS({}).then(result => t.deepEqual(result, [
    { FIELD: 'colour', VALUE: 'Black', _id: ['1', '4', '7'] },
    { FIELD: 'colour', VALUE: 'Blue', _id: ['0', '6'] },
    { FIELD: 'colour', VALUE: 'Red', _id: ['5'] },
    { FIELD: 'colour', VALUE: 'Silver', _id: ['2', '3', '8'] },
    { FIELD: 'colour', VALUE: 'White', _id: ['9'] },
    { FIELD: 'drivetrain', VALUE: 'Diesel', _id: ['4'] },
    { FIELD: 'drivetrain', VALUE: 'Electric', _id: ['5', '6'] },
    { FIELD: 'drivetrain', VALUE: 'Hybrid', _id: ['0', '2', '3', '9'] },
    { FIELD: 'drivetrain', VALUE: 'Petrol', _id: ['1', '7', '8'] },
    { FIELD: 'make', VALUE: 'BMW', _id: ['0', '4', '7', '8'] },
    { FIELD: 'make', VALUE: 'Tesla', _id: ['5', '6'] },
    { FIELD: 'make', VALUE: 'Volvo', _id: ['1', '2', '3', '9'] },
    { FIELD: 'model', VALUE: '3-series', _id: ['0', '7', '8'] },
    { FIELD: 'model', VALUE: '5-series', _id: ['4'] },
    { FIELD: 'model', VALUE: 'S', _id: ['6'] },
    { FIELD: 'model', VALUE: 'X', _id: ['5'] },
    { FIELD: 'model', VALUE: 'XC60', _id: ['3'] },
    { FIELD: 'model', VALUE: 'XC90', _id: ['1', '2', '9'] },
    { FIELD: 'price', VALUE: '33114', _id: ['2'] },
    { FIELD: 'price', VALUE: '37512', _id: ['9'] },
    { FIELD: 'price', VALUE: '44274', _id: ['1'] },
    { FIELD: 'price', VALUE: '47391', _id: ['3'] },
    { FIELD: 'price', VALUE: '57280', _id: ['7'] },
    { FIELD: 'price', VALUE: '75397', _id: ['5'] },
    { FIELD: 'price', VALUE: '79540', _id: ['6'] },
    { FIELD: 'price', VALUE: '81177', _id: ['8'] },
    { FIELD: 'price', VALUE: '83988', _id: ['0'] },
    { FIELD: 'price', VALUE: '88652', _id: ['4'] },
    { FIELD: 'year', VALUE: '2000', _id: ['4'] },
    { FIELD: 'year', VALUE: '2004', _id: ['9'] },
    { FIELD: 'year', VALUE: '2007', _id: ['3'] },
    { FIELD: 'year', VALUE: '2008', _id: ['2'] },
    { FIELD: 'year', VALUE: '2011', _id: ['0'] },
    { FIELD: 'year', VALUE: '2014', _id: ['5'] },
    { FIELD: 'year', VALUE: '2015', _id: ['8'] },
    { FIELD: 'year', VALUE: '2016', _id: ['1'] },
    { FIELD: 'year', VALUE: '2017', _id: ['6'] },
    { FIELD: 'year', VALUE: '2019', _id: ['7'] }
  ]))
})
