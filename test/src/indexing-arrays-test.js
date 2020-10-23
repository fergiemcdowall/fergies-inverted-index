import fii from '../../dist/fergies-inverted-index.esm.js'
import test from 'tape'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'indexing-arrays-test'

const data = [
  {
    "_id": 0,
    "make": "BMW",
    "price": 83988,
    "description": {
      "longer": ['this', 'is', 'a', 'longer', 'description', ['with', 'nesting']],
      "shorter": ['this', 'is', 'a', 'description']},
    "model": "3-series",
  },
  {
    "_id": 1,
    "make": "Volvo",
    "price": 44274,
    "description": ['this', 'is', 'a', 'description', 'too'],
    "model": "XC90",
  },
  {
    "_id": 2,
    "make": "Volvo",
    "price": 33114,
    "description": [
      'this', 'is', 'a', 'description', 'too', [
        'with', 'a', [
          'nested', 'array'
        ]
      ]
    ],
    "model": "XC90",
  },
  {
    "_id": 3,
    "make": "Volvo",
    "price": 33114,
    "description": [
      'this', 'is', 'a', 'description', 'too', {
        "moreDetails": [ 'more', 'details' ]
      }
    ],
    "model": "XC90",
  }
]

test('create index', t => {
  t.plan(1)
  fii({ name: indexName }).then(db => {
    global[indexName] = db    
    t.ok(db, !undefined)
  })
})

test('can add some worldbank data', t => {
  t.plan(1)
  global[indexName].PUT(data).then(t.pass)
})

test('fields are indexed correctly when there are nested arrays involved', t => {
  const expected = [
    { key: '￮FIELD￮description.longer￮', value: 'description.longer' },
    {
      key: '￮FIELD￮description.moreDetails￮',
      value: 'description.moreDetails'
    },
    { key: '￮FIELD￮description.shorter￮', value: 'description.shorter' },
    { key: '￮FIELD￮description￮', value: 'description' },
    { key: '￮FIELD￮make￮', value: 'make' },
    { key: '￮FIELD￮model￮', value: 'model' },
    { key: '￮FIELD￮price￮', value: 'price' }
  ]
  t.plan(expected.length)
  global[indexName].STORE.createReadStream({
    gte: '￮FIELD￮',
    lte: '￮FIELD￮￮',
  }).on('data', d => t.deepEqual(d, expected.shift()))
})


test('tokens are indexed correctly when there are nested arrays involved', t => {
  const expected = [
    { key: 'description.longer:a', value: [ '0' ] },
    { key: 'description.longer:description', value: [ '0' ] },
    { key: 'description.longer:is', value: [ '0' ] },
    { key: 'description.longer:longer', value: [ '0' ] },
    { key: 'description.longer:nesting', value: [ '0' ] },
    { key: 'description.longer:this', value: [ '0' ] },
    { key: 'description.longer:with', value: [ '0' ] },
    { key: 'description.moreDetails:details', value: [ '3' ] },
    { key: 'description.moreDetails:more', value: [ '3' ] },
    { key: 'description.shorter:a', value: [ '0' ] },
    { key: 'description.shorter:description', value: [ '0' ] },
    { key: 'description.shorter:is', value: [ '0' ] },
    { key: 'description.shorter:this', value: [ '0' ] },
    { key: 'description:a', value: [ '1', '2', '3' ] },
    { key: 'description:array', value: [ '2' ] },
    { key: 'description:description', value: [ '1', '2', '3' ] },
    { key: 'description:is', value: [ '1', '2', '3' ] },
    { key: 'description:nested', value: [ '2' ] },
    { key: 'description:this', value: [ '1', '2', '3' ] },
    { key: 'description:too', value: [ '1', '2', '3' ] },
    { key: 'description:with', value: [ '2' ] },
    { key: 'make:BMW', value: [ '0' ] },
    { key: 'make:Volvo', value: [ '1', '2', '3' ] },
    { key: 'model:3-series', value: [ '0' ] },
    { key: 'model:XC90', value: [ '1', '2', '3' ] },
    { key: 'price:33114', value: [ '2', '3' ] },
    { key: 'price:44274', value: [ '1' ] },
    { key: 'price:83988', value: [ '0' ] },
  ]
  t.plan(expected.length)
  global[indexName].STORE.createReadStream({
    lte: '￮',
  }).on('data', d => t.deepEqual(d, expected.shift()))
})

