import { InvertedIndex } from 'fergies-inverted-index'
import test from 'tape'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'AGGREGATION_FILTER'

const global = {}

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
  t.ok((global[indexName] = new InvertedIndex({ name: indexName })), !undefined)
})

test('can add some data', t => {
  t.plan(1)
  global[indexName].PUT(data).then(t.pass)
})

test('use AGGREGATION_FILTER with FACETS, 0-hit query', t => {
  t.plan(1)
  const { FACETS, AGGREGATION_FILTER, AND } = global[indexName]
  Promise.all([
    FACETS({
      FIELD: ['year']
    }),
    AND([37512, 'colour:White'])
  ]).then(([facetResult, queryResult]) => {
    t.deepEqual(AGGREGATION_FILTER(facetResult, queryResult), [
      { FIELD: 'year', VALUE: 2004, _id: [9] }
    ])
  })
})

test('use AGGREGATION_FILTER with FACETS', t => {
  t.plan(1)
  const { FACETS, AGGREGATION_FILTER, AND } = global[indexName]
  Promise.all([
    FACETS({
      FIELD: ['drivetrain', 'model']
    }),
    AND(['colour:Black'])
  ]).then(([facetResult, queryResult]) => {
    t.deepEqual(AGGREGATION_FILTER(facetResult, queryResult), [
      { FIELD: 'drivetrain', VALUE: 'Diesel', _id: [4] },
      { FIELD: 'drivetrain', VALUE: 'Petrol', _id: [1, 7] },
      { FIELD: 'model', VALUE: '3-series', _id: [7] },
      { FIELD: 'model', VALUE: '5-series', _id: [4] },
      { FIELD: 'model', VALUE: 'XC90', _id: [1] }
    ])
  })
})

test('use AGGREGATION_FILTER with FACETS, keep empty facets', t => {
  t.plan(1)
  const { FACETS, AGGREGATION_FILTER, AND } = global[indexName]
  Promise.all([
    FACETS({
      FIELD: ['drivetrain', 'model']
    }),
    AND(['Tesla'])
  ]).then(([facetResult, queryResult]) => {
    t.deepEqual(AGGREGATION_FILTER(facetResult, queryResult, false), [
      { FIELD: 'drivetrain', VALUE: 'Diesel', _id: [] },
      { FIELD: 'drivetrain', VALUE: 'Electric', _id: [5, 6] },
      { FIELD: 'drivetrain', VALUE: 'Hybrid', _id: [] },
      { FIELD: 'drivetrain', VALUE: 'Petrol', _id: [] },
      { FIELD: 'model', VALUE: '3-series', _id: [] },
      { FIELD: 'model', VALUE: '5-series', _id: [] },
      { FIELD: 'model', VALUE: 'S', _id: [6] },
      { FIELD: 'model', VALUE: 'X', _id: [5] },
      { FIELD: 'model', VALUE: 'XC60', _id: [] },
      { FIELD: 'model', VALUE: 'XC90', _id: [] }
    ])
  })
})

test('use AGGREGATION_FILTER with FACETS, 0-hit query', t => {
  t.plan(1)
  const { FACETS, AGGREGATION_FILTER, AND } = global[indexName]
  Promise.all([
    FACETS({
      FIELD: ['drivetrain', 'model']
    }),
    AND(['colour:Black', 'colour:Diesel'])
  ]).then(([facetResult, queryResult]) => {
    t.deepEqual(AGGREGATION_FILTER(facetResult, queryResult), [])
  })
})

test('use AGGREGATION_FILTER with BUCKETS', t => {
  t.plan(1)
  const { BUCKETS, AGGREGATION_FILTER, AND } = global[indexName]
  Promise.all([
    BUCKETS(
      {
        FIELD: ['year'],
        VALUE: {
          LTE: 2010
        }
      },
      {
        FIELD: ['year'],
        VALUE: {
          GTE: 2010
        }
      }
    ),
    AND(['colour:Black'])
  ]).then(([facetResult, queryResult]) => {
    t.deepEqual(AGGREGATION_FILTER(facetResult, queryResult), [
      {
        FIELD: ['year'],
        VALUE: { GTE: null, LTE: 2010 },
        _id: [4]
      },
      {
        FIELD: ['year'],
        VALUE: { GTE: 2010, LTE: undefined },
        _id: [1, 7]
      }
    ])
  })
})

test('use AGGREGATION_FILTER with BUCKETS', t => {
  t.plan(1)
  const { BUCKETS, AGGREGATION_FILTER, AND } = global[indexName]
  Promise.all([
    BUCKETS({
      FIELD: ['year'],
      VALUE: {
        GTE: 3000,
        LTE: 3010
      }
    }),
    AND(['colour:Black'])
  ]).then(([facetResult, queryResult]) => {
    t.deepEqual(AGGREGATION_FILTER(facetResult, queryResult, false), [
      {
        FIELD: ['year'],
        VALUE: { GTE: 3000, LTE: 3010 },
        _id: []
      }
    ])
  })
})
