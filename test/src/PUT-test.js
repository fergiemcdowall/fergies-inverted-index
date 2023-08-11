import test from 'tape'
import { InvertedIndex } from 'fergies-inverted-index'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'PUT'

const global = {}

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
  t.ok((global[indexName] = new InvertedIndex({ name: indexName })), !undefined)
})

test('can add some data', t => {
  t.plan(1)
  global[indexName].PUT(data).then(res =>
    t.deepEquals(res, [
      { _id: 0, status: 'CREATED', operation: 'PUT' },
      { _id: 1, status: 'CREATED', operation: 'PUT' },
      { _id: 2, status: 'CREATED', operation: 'PUT' }
    ])
  )
})

test('adds a duplicate doc', t => {
  t.plan(1)
  global[indexName]
    .PUT([data[1]])
    .then(res =>
      t.deepEquals(res, [{ _id: 1, status: 'UPDATED', operation: 'PUT' }])
    )
})
