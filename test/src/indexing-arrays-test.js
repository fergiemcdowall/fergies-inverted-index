import test from 'tape'
import { InvertedIndex } from 'fergies-inverted-index'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'indexing-arrays-test'

const global = {}

const data = [
  {
    _id: 0,
    make: 'BMW',
    price: 83988,
    description: {
      longer: ['this', 'is', 'a', 'longer', 'description', ['with', 'nesting']],
      shorter: ['this', 'is', 'a', 'description']
    },
    model: '3-series'
  },
  {
    _id: 1,
    make: 'Volvo',
    price: 44274,
    description: ['this', 'is', 'a', 'description', 'too'],
    model: 'XC90'
  },
  {
    _id: 2,
    make: 'Volvo',
    price: 33114,
    description: [
      'this',
      'is',
      'a',
      'description',
      'too',
      ['with', 'a', ['nested', 'array']]
    ],
    model: 'XC90'
  },
  {
    _id: 3,
    make: 'Volvo',
    price: 33114,
    description: [
      'this',
      'is',
      'a',
      'description',
      'too',
      {
        moreDetails: ['more', 'details']
      }
    ],
    model: 'XC90'
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

test('fields are indexed correctly when there are nested arrays involved', async t => {
  const expected = [
    { key: ['FIELD', 'description'], value: 'description' },
    { key: ['FIELD', 'description.longer'], value: 'description.longer' },
    {
      key: ['FIELD', 'description.moreDetails'],
      value: 'description.moreDetails'
    },
    { key: ['FIELD', 'description.shorter'], value: 'description.shorter' },
    { key: ['FIELD', 'make'], value: 'make' },
    { key: ['FIELD', 'model'], value: 'model' },
    { key: ['FIELD', 'price'], value: 'price' }
  ]
  t.plan(expected.length)
  for await (const [key, value] of global[indexName].STORE.iterator({
    gte: ['FIELD', ''],
    lte: ['FIELD', '￮']
  })) {
    t.deepEqual({ key, value }, expected.shift())
  }
})

test('tokens are indexed correctly when there are nested arrays involved', async t => {
  const expected = [
    { key: ['IDX', 'description', ['a']], value: [1, 2, 3] },
    { key: ['IDX', 'description', ['array']], value: [2] },
    { key: ['IDX', 'description', ['description']], value: [1, 2, 3] },
    { key: ['IDX', 'description', ['is']], value: [1, 2, 3] },
    { key: ['IDX', 'description', ['nested']], value: [2] },
    { key: ['IDX', 'description', ['this']], value: [1, 2, 3] },
    { key: ['IDX', 'description', ['too']], value: [1, 2, 3] },
    { key: ['IDX', 'description', ['with']], value: [2] },
    { key: ['IDX', 'description.longer', ['a']], value: [0] },
    { key: ['IDX', 'description.longer', ['description']], value: [0] },
    { key: ['IDX', 'description.longer', ['is']], value: [0] },
    { key: ['IDX', 'description.longer', ['longer']], value: [0] },
    { key: ['IDX', 'description.longer', ['nesting']], value: [0] },
    { key: ['IDX', 'description.longer', ['this']], value: [0] },
    { key: ['IDX', 'description.longer', ['with']], value: [0] },
    { key: ['IDX', 'description.moreDetails', ['details']], value: [3] },
    { key: ['IDX', 'description.moreDetails', ['more']], value: [3] },
    { key: ['IDX', 'description.shorter', ['a']], value: [0] },
    { key: ['IDX', 'description.shorter', ['description']], value: [0] },
    { key: ['IDX', 'description.shorter', ['is']], value: [0] },
    { key: ['IDX', 'description.shorter', ['this']], value: [0] },
    { key: ['IDX', 'make', ['BMW']], value: [0] },
    { key: ['IDX', 'make', ['Volvo']], value: [1, 2, 3] },
    { key: ['IDX', 'model', ['3-series']], value: [0] },
    { key: ['IDX', 'model', ['XC90']], value: [1, 2, 3] },
    { key: ['IDX', 'price', [33114]], value: [2, 3] },
    { key: ['IDX', 'price', [44274]], value: [1] },
    { key: ['IDX', 'price', [83988]], value: [0] }
  ]
  t.plan(expected.length)
  for await (const [key, value] of global[indexName].STORE.iterator({
    gte: ['IDX'],
    lte: ['IDX', '￮']
  })) {
    t.deepEqual({ key, value }, expected.shift())
  }
})
