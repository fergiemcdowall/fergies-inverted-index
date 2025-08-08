import test from 'tape'
import wbd from 'world-bank-dataset'
import { InvertedIndex } from 'fergies-inverted-index'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'DELETE-TEST'

const global = {}

test('create index', t => {
  t.plan(1)
  t.ok((global[indexName] = new InvertedIndex({ name: indexName })), !undefined)
})

test('can add some worldbank data', t => {
  const dataSize = 10
  const data = wbd.slice(0, dataSize).map(item => {
    return {
      _id: item._id.$oid,
      board_approval_month: item.board_approval_month,
      totalamt: item.totalamt
    }
  })
  t.plan(1)
  global[indexName].PUT(data).then(result => {
    t.deepEqual(result, [
      { _id: '52b213b38594d8a2be17c780', status: 'CREATED', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c781', status: 'CREATED', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c782', status: 'CREATED', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c783', status: 'CREATED', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c784', status: 'CREATED', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c785', status: 'CREATED', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c786', status: 'CREATED', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c787', status: 'CREATED', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c788', status: 'CREATED', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c789', status: 'CREATED', operation: 'PUT' }
    ])
  })
})

test('can GET with string', t => {
  t.plan(1)
  global[indexName]
    .GET({
      FIELD: 'board_approval_month',
      VALUE: 'November'
    })
    .then(result => {
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c780',
          _match: [{ FIELD: 'board_approval_month', VALUE: 'November' }]
        },
        {
          _id: '52b213b38594d8a2be17c781',
          _match: [{ FIELD: 'board_approval_month', VALUE: 'November' }]
        },
        {
          _id: '52b213b38594d8a2be17c782',
          _match: [{ FIELD: 'board_approval_month', VALUE: 'November' }]
        }
      ])
    })
})

test('can get with OBJECT', t => {
  t.plan(1)
  global[indexName]
    .OBJECT([
      { _id: '52b213b38594d8a2be17c781' },
      { _id: '52b213b38594d8a2be17c782' }
    ])
    .then(result => {
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c781',
          _object: {
            _id: '52b213b38594d8a2be17c781',
            board_approval_month: 'November',
            totalamt: 0
          }
        },
        {
          _id: '52b213b38594d8a2be17c782',
          _object: {
            _id: '52b213b38594d8a2be17c782',
            board_approval_month: 'November',
            totalamt: 6060000
          }
        }
      ])
    })
})

// TODO: delete keys should be in the index somewhere
test('can DELETE', t => {
  t.plan(1)
  global[indexName]
    .DELETE([
      '52b213b38594d8a2be17c781',
      'thisIDNotFound',
      '52b213b38594d8a2be17c782'
    ])
    .then(result => {
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c781',
          status: 'DELETED',
          operation: 'DELETE'
        },
        { _id: 'thisIDNotFound', status: 'FAILED', operation: 'DELETE' },
        {
          _id: '52b213b38594d8a2be17c782',
          status: 'DELETED',
          operation: 'DELETE'
        }
      ])
    })
})

test('can get with OBJECT', t => {
  t.plan(1)
  global[indexName]
    .OBJECT([
      { _id: '52b213b38594d8a2be17c780' },
      { _id: '52b213b38594d8a2be17c781' },
      { _id: '52b213b38594d8a2be17c782' }
    ])
    .then(result => {
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c780',
          _object: {
            _id: '52b213b38594d8a2be17c780',
            board_approval_month: 'November',
            totalamt: 130000000
          }
        },
        { _id: '52b213b38594d8a2be17c781', _object: undefined },
        { _id: '52b213b38594d8a2be17c782', _object: undefined }
      ])
    })
})

test('can GET with object having deleted two docs', t => {
  t.plan(1)
  global[indexName]
    .GET({
      FIELD: 'board_approval_month',
      VALUE: {
        GTE: 'November',
        LTE: 'November'
      }
    })
    .then(result => {
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c780',
          _match: [{ FIELD: 'board_approval_month', VALUE: 'November' }]
        }
      ])
    })
})
