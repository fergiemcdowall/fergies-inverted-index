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
      { _id: '52b213b38594d8a2be17c780', board_approval_month: 'November', totalamt: 130000000 },
      { _id: '52b213b38594d8a2be17c781', board_approval_month: 'November', totalamt: 0 },
      { _id: '52b213b38594d8a2be17c782', board_approval_month: 'November', totalamt: 6060000 },
      { _id: '52b213b38594d8a2be17c783', board_approval_month: 'October', totalamt: 0 },
      { _id: '52b213b38594d8a2be17c784', board_approval_month: 'October', totalamt: 13100000 },
      { _id: '52b213b38594d8a2be17c785', board_approval_month: 'October', totalamt: 10000000 },
      { _id: '52b213b38594d8a2be17c786', board_approval_month: 'October', totalamt: 500000000 },
      { _id: '52b213b38594d8a2be17c787', board_approval_month: 'October', totalamt: 0 },
      { _id: '52b213b38594d8a2be17c788', board_approval_month: 'October', totalamt: 160000000 },
      { _id: '52b213b38594d8a2be17c789', board_approval_month: 'October', totalamt: 200000000 }
    ])
  })
})

test('can GET with string', t => {
  t.plan(1)
  global[indexName].GET('board_approval_month:November')
    .then(result => {
      t.looseEqual(result, [
        { _id: '52b213b38594d8a2be17c780', match: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c781', match: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c782', match: [ 'board_approval_month:November' ] }
      ])
    })
})

test('can DELETE', t => {
  t.plan(1)
  global[indexName].DELETE([
    '52b213b38594d8a2be17c781',
    '52b213b38594d8a2be17c782'
  ]).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c781', board_approval_month: 'November', totalamt: 0 },
      { _id: '52b213b38594d8a2be17c782', board_approval_month: 'November', totalamt: 6060000 }
    ])
  })
})

test('can GET with object', t => {
  t.plan(1)
  global[indexName].GET({
    gte: 'board_approval_month:November',
    lte: 'board_approval_month:November'
  })
    .then(result => {
      t.looseEqual(result, [
        { _id: '52b213b38594d8a2be17c780', match: [ 'board_approval_month:November' ] }
      ])
    })
})
