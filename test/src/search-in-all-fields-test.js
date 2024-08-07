import test from 'tape'
import { InvertedIndex } from 'fergies-inverted-index'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'search-in-all-fields'

const global = {}

test('create index', t => {
  t.plan(1)
  t.ok((global[indexName] = new InvertedIndex({ name: indexName })), !undefined)
})

test('can add some worldbank data', t => {
  const data = [
    {
      _id: 0,
      make: 'Tesla',
      manufacturer: 'Volvo',
      brand: 'Volvo'
    },
    {
      _id: 1,
      make: 'BMW',
      manufacturer: 'Volvo',
      brand: 'Volvo'
    },
    {
      _id: 2,
      make: 'Tesla',
      manufacturer: 'Tesla',
      brand: 'Volvo'
    },
    {
      _id: 3,
      make: 'Tesla',
      manufacturer: 'Volvo',
      brand: 'BMW'
    },
    {
      _id: 4,
      make: 'Volvo',
      manufacturer: 'Volvo',
      brand: 'Volvo'
    },
    {
      _id: 5,
      make: 'Volvo',
      manufacturer: 'Tesla',
      brand: 'Volvo'
    },
    {
      _id: 6,
      make: 'Tesla',
      manufacturer: 'Tesla',
      brand: 'BMW'
    },
    {
      _id: 7,
      make: 'BMW',
      manufacturer: 'Tesla',
      brand: 'Tesla'
    },
    {
      _id: 8,
      make: 'Volvo',
      manufacturer: 'BMW',
      brand: 'Tesla'
    },
    {
      _id: 9,
      make: 'BMW',
      manufacturer: 'Tesla',
      brand: 'Volvo'
    }
  ]
  t.plan(1)
  global[indexName].PUT(data).then(t.pass)
})

test('get FIELDS', t => {
  t.plan(1)
  global[indexName].FIELDS().then(result => {
    t.deepEqual(result, ['brand', 'make', 'manufacturer'])
  })
})

// test('can dump store', t => {
//   t.plan(1)
//   global[indexName].STORE.createReadStream()
//     .on('data', console.log)
//     .on('end', resolve => t.pass('ended'))
// })

test('can GET with string specifying a field', t => {
  t.plan(1)
  global[indexName].GET('make:Tesla').then(result => {
    t.deepEqual(result, [
      { _id: 0, _match: [{ FIELD: 'make', VALUE: 'Tesla' }] },
      { _id: 2, _match: [{ FIELD: 'make', VALUE: 'Tesla' }] },
      { _id: 3, _match: [{ FIELD: 'make', VALUE: 'Tesla' }] },
      { _id: 6, _match: [{ FIELD: 'make', VALUE: 'Tesla' }] }
    ])
  })
})

test('can GET with string without specifying field (GET from all fields)', t => {
  t.plan(1)
  const { GET, SORT } = global[indexName]
  GET('Tesla')
    .then(SORT)
    .then(result => {
      t.deepEqual(result, [
        { _id: 0, _match: [{ FIELD: 'make', VALUE: 'Tesla' }] },
        {
          _id: 2,
          _match: [
            { FIELD: 'make', VALUE: 'Tesla' },
            { FIELD: 'manufacturer', VALUE: 'Tesla' }
          ]
        },
        { _id: 3, _match: [{ FIELD: 'make', VALUE: 'Tesla' }] },
        { _id: 5, _match: [{ FIELD: 'manufacturer', VALUE: 'Tesla' }] },
        {
          _id: 6,
          _match: [
            { FIELD: 'make', VALUE: 'Tesla' },
            { FIELD: 'manufacturer', VALUE: 'Tesla' }
          ]
        },
        {
          _id: 7,
          _match: [
            { FIELD: 'brand', VALUE: 'Tesla' },
            { FIELD: 'manufacturer', VALUE: 'Tesla' }
          ]
        },
        { _id: 8, _match: [{ FIELD: 'brand', VALUE: 'Tesla' }] },
        { _id: 9, _match: [{ FIELD: 'manufacturer', VALUE: 'Tesla' }] }
      ])
    })
})

test('can GET without specifying field (GET from all fields)', t => {
  t.plan(1)
  const { GET, SORT } = global[indexName]
  GET({
    VALUE: {
      GTE: 'Tesla',
      LTE: 'Tesla'
    }
  })
    .then(SORT)
    .then(result => {
      t.deepEqual(result, [
        { _id: 0, _match: [{ FIELD: 'make', VALUE: 'Tesla' }] },
        {
          _id: 2,
          _match: [
            { FIELD: 'make', VALUE: 'Tesla' },
            { FIELD: 'manufacturer', VALUE: 'Tesla' }
          ]
        },
        { _id: 3, _match: [{ FIELD: 'make', VALUE: 'Tesla' }] },
        { _id: 5, _match: [{ FIELD: 'manufacturer', VALUE: 'Tesla' }] },
        {
          _id: 6,
          _match: [
            { FIELD: 'make', VALUE: 'Tesla' },
            { FIELD: 'manufacturer', VALUE: 'Tesla' }
          ]
        },
        {
          _id: 7,
          _match: [
            { FIELD: 'brand', VALUE: 'Tesla' },
            { FIELD: 'manufacturer', VALUE: 'Tesla' }
          ]
        },
        { _id: 8, _match: [{ FIELD: 'brand', VALUE: 'Tesla' }] },
        { _id: 9, _match: [{ FIELD: 'manufacturer', VALUE: 'Tesla' }] }
      ])
    })
})

test('can GET specifying 2 fields (GET from all fields)', t => {
  t.plan(1)
  const { GET, SORT } = global[indexName]
  GET({
    FIELD: ['brand', 'manufacturer'],
    VALUE: {
      GTE: 'Tesla',
      LTE: 'Tesla'
    }
  })
    .then(SORT)
    .then(result => {
      t.deepEqual(result, [
        { _id: 2, _match: [{ FIELD: 'manufacturer', VALUE: 'Tesla' }] },
        { _id: 5, _match: [{ FIELD: 'manufacturer', VALUE: 'Tesla' }] },
        { _id: 6, _match: [{ FIELD: 'manufacturer', VALUE: 'Tesla' }] },
        {
          _id: 7,
          _match: [
            { FIELD: 'brand', VALUE: 'Tesla' },
            { FIELD: 'manufacturer', VALUE: 'Tesla' }
          ]
        },
        { _id: 8, _match: [{ FIELD: 'brand', VALUE: 'Tesla' }] },
        { _id: 9, _match: [{ FIELD: 'manufacturer', VALUE: 'Tesla' }] }
      ])
    })
})

test('can GET specifying 2 fields (GET from all fields)', t => {
  t.plan(1)
  global[indexName]
    .GET({
      FIELD: 'brand',
      VALUE: {
        GTE: 'Tesla',
        LTE: 'Tesla'
      }
    })
    .then(result => {
      t.deepEqual(result, [
        { _id: 7, _match: [{ FIELD: 'brand', VALUE: 'Tesla' }] },
        { _id: 8, _match: [{ FIELD: 'brand', VALUE: 'Tesla' }] }
      ])
    })
})

test('can GET specifying FIELD and VALUE', t => {
  t.plan(1)
  global[indexName]
    .GET({
      FIELD: 'brand',
      VALUE: 'Tesla'
    })
    .then(result => {
      t.deepEqual(result, [
        { _id: 7, _match: [{ FIELD: 'brand', VALUE: 'Tesla' }] },
        { _id: 8, _match: [{ FIELD: 'brand', VALUE: 'Tesla' }] }
      ])
    })
})
