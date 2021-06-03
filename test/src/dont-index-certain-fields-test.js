const fii = require('../../')
const test = require('tape')

const sandbox = 'test/sandbox/'

const indexName = sandbox + 'dont-index-certain-fields'

test('create index', t => {
  t.plan(1)
  fii({ name: indexName }).then(db => {
    global[indexName] = db
    t.ok(db, !undefined)
  })
})

test('can add data', t => {
  t.plan(1)
  global[indexName]
    .PUT(
      [
        {
          _id: '0',
          make: 'Tesla',
          info: {
            manufacturer: 'Volvo',
            brand: 'Volvo'
          }
        },
        {
          _id: '1',
          make: 'BMW',
          info: {
            manufacturer: 'Volvo',
            brand: 'Volvo'
          }
        },
        {
          _id: '2',
          make: 'Tesla',
          info: {
            manufacturer: 'Tesla',
            brand: 'Volvo'
          }
        }
      ],
      {
        doNotIndexField: ['info.manufacturer']
      }
    )
    .then(response =>
      t.deepEquals(response, [
        { _id: '0', status: 'CREATED', operation: 'PUT' },
        { _id: '1', status: 'CREATED', operation: 'PUT' },
        { _id: '2', status: 'CREATED', operation: 'PUT' }
      ])
    )
})

test('analyse index', t => {
  const storeState = [
    {
      key: ['DOC', '0'],
      value: {
        _id: '0',
        make: 'Tesla',
        info: { manufacturer: 'Volvo', brand: 'Volvo' }
      }
    },
    {
      key: ['DOC', '1'],
      value: {
        _id: '1',
        make: 'BMW',
        info: { manufacturer: 'Volvo', brand: 'Volvo' }
      }
    },
    {
      key: ['DOC', '2'],
      value: {
        _id: '2',
        make: 'Tesla',
        info: { manufacturer: 'Tesla', brand: 'Volvo' }
      }
    },
    { key: ['FIELD', 'info.brand'], value: 'info.brand' },
    { key: ['FIELD', 'make'], value: 'make' },
    { key: ['IDX', 'info.brand', ['Volvo']], value: ['0', '1', '2'] },
    { key: ['IDX', 'make', ['BMW']], value: ['1'] },
    { key: ['IDX', 'make', ['Tesla']], value: ['0', '2'] }
  ]
  t.plan(storeState.length)
  const r = global[indexName].STORE.createReadStream({ lt: ['~'] })
  r.on('data', d => t.deepEqual(d, storeState.shift()))
})

const indexName2 = sandbox + 'non-searchable-fields-test2'

test('create another index', t => {
  t.plan(1)
  fii({ name: indexName2 }).then(db => {
    global[indexName2] = db
    t.ok(db, !undefined)
  })
})

test('can add data', t => {
  t.plan(1)
  global[indexName2]
    .PUT([
      {
        _id: '0',
        make: 'Tesla',
        info: {
          manufacturer: 'Volvo',
          brand: 'Volvo'
        }
      },
      {
        _id: '1',
        make: 'BMW',
        info: {
          manufacturer: 'Volvo',
          brand: 'Volvo'
        }
      },
      {
        _id: '2',
        make: 'Tesla',
        info: {
          manufacturer: 'Tesla',
          brand: 'Volvo'
        }
      }
    ])
    .then(response =>
      t.deepEquals(response, [
        { _id: '0', status: 'CREATED', operation: 'PUT' },
        { _id: '1', status: 'CREATED', operation: 'PUT' },
        { _id: '2', status: 'CREATED', operation: 'PUT' }
      ])
    )
})

test('analyse index', t => {
  const storeState = [
    {
      key: ['DOC', '0'],
      value: {
        _id: '0',
        make: 'Tesla',
        info: { manufacturer: 'Volvo', brand: 'Volvo' }
      }
    },
    {
      key: ['DOC', '1'],
      value: {
        _id: '1',
        make: 'BMW',
        info: { manufacturer: 'Volvo', brand: 'Volvo' }
      }
    },
    {
      key: ['DOC', '2'],
      value: {
        _id: '2',
        make: 'Tesla',
        info: { manufacturer: 'Tesla', brand: 'Volvo' }
      }
    },
    { key: ['FIELD', 'info.brand'], value: 'info.brand' },
    { key: ['FIELD', 'info.manufacturer'], value: 'info.manufacturer' },
    { key: ['FIELD', 'make'], value: 'make' },
    { key: ['IDX', 'info.brand', ['Volvo']], value: ['0', '1', '2'] },
    { key: ['IDX', 'info.manufacturer', ['Tesla']], value: ['2'] },
    { key: ['IDX', 'info.manufacturer', ['Volvo']], value: ['0', '1'] },
    { key: ['IDX', 'make', ['BMW']], value: ['1'] },
    { key: ['IDX', 'make', ['Tesla']], value: ['0', '2'] }
  ]
  t.plan(storeState.length)
  const r = global[indexName2].STORE.createReadStream({ lt: ['~'] })
  r.on('data', d => t.deepEqual(d, storeState.shift()))
})
