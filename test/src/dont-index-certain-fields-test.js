import test from 'tape'
import { InvertedIndex } from 'fergies-inverted-index'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'dont-index-certain-fields'

const global = {}

test('create index', t => {
  t.plan(1)
  new InvertedIndex({ name: indexName }).then(db => {
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

test('analyse index', async t => {
  const entries = [
    [
      ['DOC', '0'],
      {
        _id: '0',
        make: 'Tesla',
        info: { manufacturer: 'Volvo', brand: 'Volvo' }
      }
    ],
    [
      ['DOC', '1'],
      {
        _id: '1',
        make: 'BMW',
        info: { manufacturer: 'Volvo', brand: 'Volvo' }
      }
    ],
    [
      ['DOC', '2'],
      {
        _id: '2',
        make: 'Tesla',
        info: { manufacturer: 'Tesla', brand: 'Volvo' }
      }
    ],
    [['FIELD', 'info.brand'], 'info.brand'],
    [['FIELD', 'make'], 'make'],
    [
      ['IDX', 'info.brand', ['Volvo']],
      ['0', '1', '2']
    ],
    [['IDX', 'make', ['BMW']], ['1']],
    [
      ['IDX', 'make', ['Tesla']],
      ['0', '2']
    ]
  ]
  t.plan(entries.length)
  for await (const entry of global[indexName].STORE.iterator({
    lt: ['~']
  })) {
    t.deepEquals(entry, entries.shift())
  }
})

const indexName2 = sandbox + 'non-searchable-fields-test2'

test('create another index', t => {
  t.plan(1)
  new InvertedIndex({ name: indexName2 }).then(db => {
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

test('analyse index', async t => {
  const entries = [
    [
      ['DOC', '0'],
      {
        _id: '0',
        make: 'Tesla',
        info: { manufacturer: 'Volvo', brand: 'Volvo' }
      }
    ],
    [
      ['DOC', '1'],
      {
        _id: '1',
        make: 'BMW',
        info: { manufacturer: 'Volvo', brand: 'Volvo' }
      }
    ],
    [
      ['DOC', '2'],
      {
        _id: '2',
        make: 'Tesla',
        info: { manufacturer: 'Tesla', brand: 'Volvo' }
      }
    ],
    [['FIELD', 'info.brand'], 'info.brand'],
    [['FIELD', 'info.manufacturer'], 'info.manufacturer'],
    [['FIELD', 'make'], 'make'],
    [
      ['IDX', 'info.brand', ['Volvo']],
      ['0', '1', '2']
    ],
    [['IDX', 'info.manufacturer', ['Tesla']], ['2']],
    [
      ['IDX', 'info.manufacturer', ['Volvo']],
      ['0', '1']
    ],
    [['IDX', 'make', ['BMW']], ['1']],
    [
      ['IDX', 'make', ['Tesla']],
      ['0', '2']
    ]
  ]
  t.plan(entries.length)
  for await (const entry of global[indexName2].STORE.iterator({
    lt: ['~']
  })) {
    t.deepEquals(entry, entries.shift())
  }
})
