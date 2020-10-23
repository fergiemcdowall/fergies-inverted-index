import fii from '../../dist/fergies-inverted-index.esm.js'
import test from 'tape'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'AGGREGATE'

const data = [
  {
    "_id": 0,
    "make": "BMW",
    "colour": "Blue",
    "year": 2011,
    "price": 83988,
    "model": "3-series",
    "drivetrain": "Hybrid"
  },
  {
    "_id": 1,
    "make": "Volvo",
    "colour": "Black",
    "year": 2016,
    "price": 44274,
    "model": "XC90",
    "drivetrain": "Petrol"
  },
  {
    "_id": 2,
    "make": "Volvo",
    "colour": "Silver",
    "year": 2008,
    "price": 33114,
    "model": "XC90",
    "drivetrain": "Hybrid"
  },
  {
    "_id": 3,
    "make": "Volvo",
    "colour": "Silver",
    "year": 2007,
    "price": 47391,
    "model": "XC60",
    "drivetrain": "Hybrid"
  },
  {
    "_id": 4,
    "make": "BMW",
    "colour": "Black",
    "year": 2000,
    "price": 88652,
    "model": "5-series",
    "drivetrain": "Diesel"
  },
  {
    "_id": 5,
    "make": "Tesla",
    "colour": "Red",
    "year": 2014,
    "price": 75397,
    "model": "X",
    "drivetrain": "Electric"
  },
  {
    "_id": 6,
    "make": "Tesla",
    "colour": "Blue",
    "year": 2017,
    "price": 79540,
    "model": "S",
    "drivetrain": "Electric"
  },
  {
    "_id": 7,
    "make": "BMW",
    "colour": "Black",
    "year": 2019,
    "price": 57280,
    "model": "3-series",
    "drivetrain": "Petrol"
  },
  {
    "_id": 8,
    "make": "BMW",
    "colour": "Silver",
    "year": 2015,
    "price": 81177,
    "model": "3-series",
    "drivetrain": "Petrol"
  },
  {
    "_id": 9,
    "make": "Volvo",
    "colour": "White",
    "year": 2004,
    "price": 37512,
    "model": "XC90",
    "drivetrain": "Hybrid"
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

test('simple AGGREGATE with BUCKETS', t => {
  t.plan(1)
  const { GET, BUCKETS, AGGREGATE } = global[indexName]
  AGGREGATE({
    BUCKETS: BUCKETS({
      FIELD: 'drivetrain',
      VALUE: 'Hybrid'
    }, {
      FIELD: 'drivetrain',
      VALUE: 'Petrol'
    }, {
      FIELD: 'drivetrain',
      VALUE: 'Electric'
    }),
    QUERY: GET('make:Volvo')
  }).then(result => t.deepEqual(result, {
    BUCKETS: [
      { FIELD: [ 'drivetrain' ], VALUE: {
        GTE: 'Hybrid', LTE: 'Hybrid' }, _id: [ '2', '3', '9' ]
      },
      { FIELD: [ 'drivetrain' ], VALUE: {
        GTE: 'Petrol', LTE: 'Petrol' }, _id: [ '1' ]
      },
      { FIELD: [ 'drivetrain' ], VALUE: {
        GTE: 'Electric', LTE: 'Electric' }, _id: []
      }  
    ],
    FACETS: [],
    RESULT: [
      { _id: '1', _match: [ 'make:Volvo' ] },
      { _id: '2', _match: [ 'make:Volvo' ] },
      { _id: '3', _match: [ 'make:Volvo' ] },
      { _id: '9', _match: [ 'make:Volvo' ] }
    ]
  }))
})

test('simple AGGREGATE with FACETS', t => {
  t.plan(1)
  const { GET, FACETS, AGGREGATE } = global[indexName]
  AGGREGATE({
    FACETS: FACETS({
      FIELD: 'drivetrain'
    }),
    QUERY: GET('make:Volvo')
  }).then(result => t.deepEqual(result, {
    BUCKETS: [],
    FACETS: [
      { FIELD: 'drivetrain', VALUE: 'Diesel', _id: [] },
      { FIELD: 'drivetrain', VALUE: 'Electric', _id: [] },
      { FIELD: 'drivetrain', VALUE: 'Hybrid', _id: [ '2', '3', '9' ] },
      { FIELD: 'drivetrain', VALUE: 'Petrol', _id: [ '1' ] }
    ],
    RESULT: [
      { _id: '1', _match: [ 'make:Volvo' ] },
      { _id: '2', _match: [ 'make:Volvo' ] },
      { _id: '3', _match: [ 'make:Volvo' ] },
      { _id: '9', _match: [ 'make:Volvo' ] }
    ]
  }))
})


test('simple AGGREGATE with BUCKETS and FACETS', t => {
  t.plan(1)
  const { GET, BUCKETS, FACETS, AGGREGATE } = global[indexName]
  AGGREGATE({
    BUCKETS: BUCKETS({
      FIELD: 'drivetrain', VALUE: 'Electric'
    }),
    FACETS: FACETS({
      FIELD: 'colour'
    }),
    QUERY: GET('make:Volvo')
  }).then(result => t.deepEqual(result, {
    BUCKETS: [
      {
        FIELD: [ 'drivetrain' ], VALUE: {
        GTE: 'Electric', LTE: 'Electric' }, _id: []
      }
    ],
    FACETS: [
      { FIELD: 'colour', VALUE: 'Black', _id: [ '1' ] },
      { FIELD: 'colour', VALUE: 'Blue', _id: [] },
      { FIELD: 'colour', VALUE: 'Red', _id: [] },
      { FIELD: 'colour', VALUE: 'Silver', _id: [ '2', '3' ] },
      { FIELD: 'colour', VALUE: 'White', _id: [ '9' ] }
    ],
    RESULT: [
      { _id: '1', _match: [ 'make:Volvo' ] },
      { _id: '2', _match: [ 'make:Volvo' ] },
      { _id: '3', _match: [ 'make:Volvo' ] },
      { _id: '9', _match: [ 'make:Volvo' ] }
    ]
  }))
})


test('simple AGGREGATE with BUCKETS and FACETS, no QUERY', t => {
  t.plan(1)
  const { GET, BUCKETS, FACETS, AGGREGATE } = global[indexName]
  AGGREGATE({
    BUCKETS: BUCKETS({
      FIELD: 'drivetrain', VALUE: 'Electric'
    }),
    FACETS: FACETS({
      FIELD: 'colour'
    })
  }).then(result => {
    return t.deepEqual(result, {
      BUCKETS: [ { FIELD: [ 'drivetrain' ], VALUE: {
        GTE: 'Electric', LTE: 'Electric'
      }, _id: [ '5', '6' ] } ],
      FACETS: [
        { FIELD: 'colour', VALUE: 'Black', _id: [ '1', '4', '7' ] },
        { FIELD: 'colour', VALUE: 'Blue', _id: [ '0', '6' ] },
        { FIELD: 'colour', VALUE: 'Red', _id: [ '5' ] },
        { FIELD: 'colour', VALUE: 'Silver', _id: [ '2', '3', '8' ] },
        { FIELD: 'colour', VALUE: 'White', _id: [ '9' ] }
      ],
      RESULT: []
    })
  })
})
