import test from 'tape'
import { InvertedIndex } from 'fergies-inverted-index'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'parseToken'

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

test('can parse a token of the format "<VALUE>"', t => {
  t.plan(1)
  t.deepEqual(global[indexName].TOKEN_PARSER.parse('volvo'), {
    FIELD: ['colour', 'drivetrain', 'make', 'model', 'price', 'year'],
    VALUE: {
      GTE: 'volvo',
      LTE: 'volvo'
    }
  })
})

test('can parse a token of the format "<FIELD>:<VALUE>"', t => {
  t.plan(1)
  t.deepEqual(global[indexName].TOKEN_PARSER.parse('make:volvo'), {
    FIELD: ['make'],
    VALUE: {
      GTE: 'volvo',
      LTE: 'volvo'
    }
  })
})

test('can parse a token of the format "<FIELD>:<VALUE> where <VALUE> has a :"', t => {
  t.plan(1)
  t.deepEqual(global[indexName].TOKEN_PARSER.parse('make:vol:vo'), {
    FIELD: ['make'],
    VALUE: {
      GTE: 'vol:vo',
      LTE: 'vol:vo'
    }
  })
})

test('can parse a token of the format { FIELD: <field name> }', t => {
  t.plan(1)
  t.deepEqual(global[indexName].TOKEN_PARSER.parse({ FIELD: 'make' }), {
    FIELD: ['make'],
    VALUE: {
      GTE: null,
      LTE: undefined
    }
  })
})

test('can parse a token of the format { FIELD: <field name>, VALUE: <value> }', t => {
  t.plan(1)
  t.deepEqual(
    global[indexName].TOKEN_PARSER.parse({
      FIELD: 'make',
      VALUE: 'volvo'
    }),
    {
      FIELD: ['make'],
      VALUE: {
        GTE: 'volvo',
        LTE: 'volvo'
      }
    }
  )
})

test('can parse a token of the format { FIELD: [ <field name> ], VALUE: <value> }', t => {
  t.plan(1)
  t.deepEqual(
    global[indexName].TOKEN_PARSER.parse({
      FIELD: ['make'],
      VALUE: 'volvo'
    }),
    {
      FIELD: ['make'],
      VALUE: {
        GTE: 'volvo',
        LTE: 'volvo'
      }
    }
  )
})

test('can parse a token of the format { FIELD: [ <field name> ], VALUE: <value> }', t => {
  t.plan(1)
  t.deepEqual(
    global[indexName].TOKEN_PARSER.parse({
      FIELD: ['make', 'model'],
      VALUE: 'volvo'
    }),
    {
      FIELD: ['make', 'model'],
      VALUE: {
        GTE: 'volvo',
        LTE: 'volvo'
      }
    }
  )
})

test('can parse a token of the format { VALUE: <value> }', t => {
  t.plan(1)
  t.deepEqual(
    global[indexName].TOKEN_PARSER.parse({
      VALUE: 'volvo'
    }),
    {
      FIELD: ['colour', 'drivetrain', 'make', 'model', 'price', 'year'],
      VALUE: {
        GTE: 'volvo',
        LTE: 'volvo'
      }
    }
  )
})

test('can parse an object token with LTE "￮"', t => {
  t.plan(1)
  t.deepEqual(
    global[indexName].TOKEN_PARSER.parse({
      FIELD: ['make', 'model'],
      VALUE: {
        GTE: 'volvo',
        LTE: '￮'
      }
    }),
    {
      FIELD: ['make', 'model'],
      VALUE: {
        GTE: 'volvo',
        LTE: '￮'
      }
    }
  )
})

test('can parse an object token without GTE', t => {
  t.plan(1)
  t.deepEqual(
    global[indexName].TOKEN_PARSER.parse({
      FIELD: ['make', 'model'],
      VALUE: {
        LTE: 'volvo'
      }
    }),
    {
      FIELD: ['make', 'model'],
      VALUE: {
        GTE: null,
        LTE: 'volvo'
      }
    }
  )
})
