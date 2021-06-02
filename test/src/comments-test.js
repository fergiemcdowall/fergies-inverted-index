const fii = require('../../')
const test = require('tape')

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'comments'

// TODO: use this to test "comments" functionality

const data = [
  {
    _id: 0,
    make: 'BMW',
    colour: 'Blue',
    year: {
      value: 2000,
      score: 3000
    },
    price: {
      8368: 3000
    },
    words: [
      {
        mary: 0.223
      },
      {
        poppins: 0.323
      },
      {
        windowsill: 0.123
      }
    ],
    model: '3-series',
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

test('get MAX value for one field', t => {
  t.plan(1)
  global[indexName]
    .MAX({ FIELD: ['price'] })
    .then(result => t.equals(result, 3000))
})

test('get MAX value for one field', t => {
  t.plan(1)
  global[indexName]
    .MAX({ FIELD: ['words'] })
    .then(result => t.equals(result, 0.323))
})
