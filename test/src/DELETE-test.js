import fii from '../../dist/fergies-inverted-index.esm.js'
import test from 'tape'
import wbd from 'world-bank-dataset'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'DELETE-TEST'

test('create a little world bank index by lazy loading', t => {
  t.plan(1)
  global[indexName] = fii({ name: indexName })
  t.pass()
})

test('give lazy loading some time to complete', t => {
  t.plan(1)
  setTimeout(t.pass, 500)
})

test('can add some worldbank data', t => {
//  console.log(global[indexName])
  var dataSize = 10
  const data = wbd.slice(0, dataSize).map(item => {
    return {
      _id: item._id.$oid,
      board_approval_month: item.board_approval_month,
      totalamt: item.totalamt
    }
  })
  console.log(JSON.stringify(data.map(item => {
    return {
      _id: item._id,
      board_approval_month: item.board_approval_month,
      sectorcode: item.sectorcode
    }
  }), null, 2))
  t.plan(1)
  global[indexName].PUT(data).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c780', status: 'OK', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c781', status: 'OK', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c782', status: 'OK', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c783', status: 'OK', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c784', status: 'OK', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c785', status: 'OK', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c786', status: 'OK', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c787', status: 'OK', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c788', status: 'OK', operation: 'PUT' },
      { _id: '52b213b38594d8a2be17c789', status: 'OK', operation: 'PUT' } 
    ])
  })
})

test('can GET with string', t => {
  t.plan(1)
  global[indexName].GET({
    FIELD: 'board_approval_month',
    VALUE: 'November'
  })
    .then(result => {
      t.looseEqual(result, [
        { _id: '52b213b38594d8a2be17c780', _match: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c781', _match: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c782', _match: [ 'board_approval_month:November' ] }
      ])
    })
})

test('can get with OBJECT', t => {
  t.plan(1)
  global[indexName].OBJECT([
    {_id:'52b213b38594d8a2be17c781'},
    {_id:'52b213b38594d8a2be17c782'}
  ]).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c781',
        _object: { _id: '52b213b38594d8a2be17c781', board_approval_month: 'November', totalamt: 0 }
      }, {
        _id: '52b213b38594d8a2be17c782',
        _object: { _id: '52b213b38594d8a2be17c782', board_approval_month: 'November', totalamt: 6060000 }
      }
    ])
  })
})


// TODO: delete keys should be in the index somewhere
test('can DELETE', t => {
  t.plan(1)
  global[indexName].DELETE([
    '52b213b38594d8a2be17c781',
    'thisIDNotFound',
    '52b213b38594d8a2be17c782'
  ]).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c781', status: 'OK', operation: 'DELETE' },
      { _id: 'thisIDNotFound', status: 'OK', operation: 'DELETE' },
      { _id: '52b213b38594d8a2be17c782', status: 'OK', operation: 'DELETE' }
    ])
  })
})

test('can get with OBJECT', t => {
  t.plan(1)
  global[indexName].OBJECT([
    { _id: '52b213b38594d8a2be17c780'},
    { _id: '52b213b38594d8a2be17c781'},
    { _id: '52b213b38594d8a2be17c782'}
  ]).then(result => {
    t.looseEqual(result, [
      
      { _id: '52b213b38594d8a2be17c780',
        _object: { _id: '52b213b38594d8a2be17c780', board_approval_month: 'November', totalamt: 130000000 }
      }, {
        _id: '52b213b38594d8a2be17c781', _object: null },
      { _id: '52b213b38594d8a2be17c782', _object: null } 
    ])
  })
})

test('can GET with object having deleted two docs', t => {
  t.plan(1)
  global[indexName].GET({
    FIELD: 'board_approval_month',
    VALUE: {
      GTE: 'November',
      LTE: 'November'
    }
  })
   .then(result => {
     t.looseEqual(result, [
       { _id: '52b213b38594d8a2be17c780', _match: [ 'board_approval_month:November' ] }
     ])
   })
})
