import fii from '../../dist/fergies-inverted-index.esm.js'
import test from 'tape'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'MAXMIN'

const data = [
  {
    "_id": 0,
    "make": "BMW",
    "colour": "Blue",
    "year": '2011#comment',
    "price": 83988,
    "model": "3-series",
    "drivetrain": "Hybrid"
  },
  {
    "_id": 1,
    "make": "Volvo",
    "colour": "Black",
    "year": '2016#comment',
    "price": 44274,
    "model": "XC90",
    "drivetrain": "Petrol"
  },
  {
    "_id": 2,
    "make": "Volvo",
    "colour": "Silver",
    "year": '2008#comment',
    "price": 33114,
    "model": "XC90",
    "drivetrain": "Hybrid"
  },
  {
    "_id": 3,
    "make": "Volvo",
    "colour": "Silver",
    "year": '2007#comment',
    "price": 473910,
    "model": "XC60",
    "drivetrain": "Hybrid"
  },
  {
    "_id": 4,
    "make": "BMW",
    "colour": "Black",
    "year": '2000#comment',
    "price": 88652,
    "model": "5-series",
    "drivetrain": "Diesel"
  },
  {
    "_id": 5,
    "make": "Tesla",
    "colour": "Red",
    "year": '2014#comment',
    "price": 75397,
    "model": "X",
    "drivetrain": "Electric"
  },
  {
    "_id": 6,
    "make": "Tesla",
    "colour": "Blue",
    "year": '2017#comment',
    "price": 79540,
    "model": "S",
    "drivetrain": "Electric"
  },
  {
    "_id": 7,
    "make": "BMW",
    "colour": "Black",
    "year": '2019#comment',
    "price": 57280,
    "model": "3-series",
    "drivetrain": "Petrol"
  },
  {
    "_id": 8,
    "make": "BMW",
    "colour": "Silver",
    "year": '2015#comment',
    "price": 81177,
    "model": "3-series",
    "drivetrain": "Petrol"
  },
  {
    "_id": 9,
    "make": "Volvo",
    "colour": "White",
    "year": '2004#comment',
    "price": 37512,
    "model": "XC90",
    "drivetrain": "Hybrid"
  }
]

test('create an index', t => {
  t.plan(1)
  fii({ name: indexName }, (err, idx) => {
    global[indexName] = idx
    t.error(err)
  })
})

test('can add some data', t => {
  t.plan(1)
  global[indexName].PUT(data).then(t.pass)
})

test('get MAX value for one field', t => {
  t.plan(1)
  global[indexName].MAX('price').then(
    result => t.equals(result, '88652')
  )
})

test('get MIN value for one field', t => {
  t.plan(1)
  global[indexName].MIN('price').then(
    result => t.equals(result, '33114')
  )
})

test('get MAX value for one field containing a comment', t => {
  t.plan(1)
  global[indexName].MAX('year').then(
    result => t.equals(result, '2019')
  )
})

test('get MIN value for one field containing a comment', t => {
  t.plan(1)
  global[indexName].MIN('year').then(
    result => t.equals(result, '2000')
  )
})

