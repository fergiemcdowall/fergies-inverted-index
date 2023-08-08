const { InvertedIndex } = await import(
  '../../src/' + process.env.FII_ENTRYPOINT
)
import test from 'tape'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'MAXMIN'

const data = [
  {
    _id: 0,
    make: 'BMW',
    colour: 'Blue',
    year: [2011, 'comment'],
    price: 8398,
    model: '3-series',
    drivetrain: 'Hybrid'
  },
  {
    _id: 1,
    make: 'Volvo',
    colour: 'Black',
    year: [2016, 'comment'],
    price: 0,
    model: 'XC90',
    drivetrain: 'Petrol'
  },
  {
    _id: 2,
    make: 'Volvo',
    colour: 'Silver',
    year: [2008, 'comment'],
    price: 4,
    model: 'XC90',
    drivetrain: 'Hybrid'
  },
  {
    _id: 3,
    make: 'Volvo',
    colour: 'Silver',
    year: [2007, 'comment'],
    price: 4739100,
    model: 'XC60',
    drivetrain: 'Hybrid'
  },
  {
    _id: 4,
    make: 'BMW',
    colour: 'Black',
    year: [2000, 'comment'],
    price: 88652,
    model: '5-series',
    drivetrain: 'Diesel'
  },
  {
    _id: 5,
    make: 'Tesla',
    colour: 'Red',
    year: [2014, 'comment'],
    price: 10,
    model: 'X',
    drivetrain: 'Electric'
  },
  {
    _id: 6,
    make: 'Tesla',
    colour: 'Blue',
    year: [2017, 'comment'],
    price: 999,
    model: 'S',
    drivetrain: 'Electric'
  },
  {
    _id: 7,
    make: 'BMW',
    colour: 'Black',
    year: [2019, 'comment'],
    price: 111111111111111,
    model: '3-series',
    drivetrain: 'Petrol'
  },
  {
    _id: 8,
    make: 'BMW',
    colour: 'Silver',
    year: [2015, 'comment'],
    price: 81177,
    model: '3-series',
    drivetrain: 'Petrol'
  },
  {
    _id: 9,
    make: 'Volvo',
    colour: 'White',
    year: [2004, 'comment'],
    price: 37512,
    model: 'XC90',
    drivetrain: 'Hybrid'
  }
]

test('create index', t => {
  t.plan(1)
  new InvertedIndex({
    name: indexName,
    isLeaf: item =>
      typeof item === 'string' ||
      typeof item === 'number' ||
      Array.isArray(item)
  }).then(db => {
    global[indexName] = db
    t.ok(db, !undefined)
  })
})

test('can add some data', t => {
  t.plan(1)
  global[indexName].PUT(data).then(t.pass)
})

test('get MAX value for one field', t => {
  t.plan(1)
  global[indexName]
    .MAX({ FIELD: ['price'] })
    .then(result => t.deepEquals(result, 111111111111111))
})

test('get MAX value for one field', t => {
  t.plan(1)
  global[indexName]
    .MAX({
      FIELD: ['price'],
      VALUE: {
        LTE: 5
      }
    })
    .then(result => t.equals(result, 4))
})

test('get MIN value for one field', t => {
  t.plan(1)
  global[indexName]
    .MIN({ FIELD: ['price'] })
    .then(result => t.equals(result, 0))
})

test('get MAX value for one field containing a comment', t => {
  t.plan(1)
  global[indexName]
    .MAX({ FIELD: ['year'] })
    .then(result => t.equals(result, 2019))
})

test('get MIN value for one field containing a comment', t => {
  t.plan(1)
  global[indexName]
    .MIN({ FIELD: ['year'] })
    .then(result => t.equals(result, 2000))
})
