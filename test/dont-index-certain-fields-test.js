const ndb = require('../lib/index.js')
const sandbox = 'test/sandbox/'
const test = require('tape')
const wbd = require('world-bank-dataset')

var wb

test('create a little world bank index', t => {
  t.plan(1)
  ndb({
    name: sandbox + 'stress-test'
  }).then(db => {
    wb = db
    t.pass('db created')
  })
})

test('prefixing field with ! makes it non-searchable', t => {
  t.plan(2)
  const start = Date.now()
  const timeLimit = 2000
  wb.PUT(
    wbd.slice(0, 3).map(item => {
      return {
        _id: item._id.$oid,
        '!board_approval_month': item.board_approval_month,
        impagency: item.impagency,
      }
    })
  ).then(result => {
    const elapsedTime = Date.now() - start
    t.equal(result.length, 3)
    t.ok(
      elapsedTime < timeLimit,
      'created index in ' + elapsedTime + 'ms (time limit: ' + timeLimit + 'ms)'
    )
  })
})

test('analyse index', t => {
  var storeState = [
    { key: '!DOC￮52b213b38594d8a2be17c780￮',
      value: 
      { _id: '52b213b38594d8a2be17c780',
        '!board_approval_month': 'November',
        impagency: 'MINISTRY OF EDUCATION' } },
    { key: '!DOC￮52b213b38594d8a2be17c781￮',
      value: 
      { _id: '52b213b38594d8a2be17c781',
        '!board_approval_month': 'November',
        impagency: 'MINISTRY OF FINANCE' } },
    { key: '!DOC￮52b213b38594d8a2be17c782￮',
      value: 
      { _id: '52b213b38594d8a2be17c782',
        '!board_approval_month': 'November',
        impagency: 'MINISTRY OF TRANSPORT AND COMMUNICATIONS' } },
    { key: '_id.52b213b38594d8a2be17c780',
      value: [ '52b213b38594d8a2be17c780' ] },
    { key: '_id.52b213b38594d8a2be17c781',
      value: [ '52b213b38594d8a2be17c781' ] },
    { key: '_id.52b213b38594d8a2be17c782',
      value: [ '52b213b38594d8a2be17c782' ] },
    { key: 'impagency.MINISTRY OF EDUCATION',
      value: [ '52b213b38594d8a2be17c780' ] },
    { key: 'impagency.MINISTRY OF FINANCE',
      value: [ '52b213b38594d8a2be17c781' ] },
    { key: 'impagency.MINISTRY OF TRANSPORT AND COMMUNICATIONS',
      value: [ '52b213b38594d8a2be17c782' ] }
  ]
  t.plan(storeState.length)
  
  r = wb.STORE.createReadStream()
  r.on('data', d => {
    t.looseEquals(d, storeState.shift())
  })
})
