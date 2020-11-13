const encode = require('encoding-down')
const fii = require('../../')
const levelup = require('levelup')
const memdown = require('memdown')
const test = require('tape')
const wbd = require('world-bank-dataset')

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'memdown-test'

const data = wbd.slice(0, 10).map(item => {
  return {
    _id: item._id.$oid,
    sectorcode: item.sectorcode.split(','),
    board_approval_month: item.board_approval_month,
    impagency: item.impagency,
    majorsector_percent: item.majorsector_percent,
    mjsector_namecode: item.mjsector_namecode,
    sector_namecode: item.sector_namecode,
    totalamt: item.totalamt
  }
})

var db

test('create a fii with memdown', t => {
  t.plan(3)
  levelup(encode(memdown(indexName), {
    valueEncoding: 'json'
  }), (err, store) => {
    t.error(err)
    fii({ db: store }).then(db =>
      db.PUT(data).then(() => {
        t.pass('ok')
      }).then(() => {
        db.GET({
          FIELD: 'board_approval_month',
          VALUE: 'November'
        })
          .then(result => {
            t.deepEqual(result, [
              { _id: '52b213b38594d8a2be17c780',
                _match: [ 'board_approval_month:November' ] },
              { _id: '52b213b38594d8a2be17c781',
                _match: [ 'board_approval_month:November' ] },
              { _id: '52b213b38594d8a2be17c782',
                _match: [ 'board_approval_month:November' ] }
            ])
          })
      })
    )
  })
  
})
