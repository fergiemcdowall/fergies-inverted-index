import fii from '../../dist/fergies-inverted-index.esm.js'
// import fs from 'fs'
import levelup from 'levelup'
import memdown from 'memdown'
import test from 'tape'
import wbd from 'world-bank-dataset'
import encode from 'encoding-down'

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
    db = fii({ store: store })
//    t.ok(!fs.existsSync('test/' + indexName))
    db.PUT(data).then(() => {
      t.pass('ok')
    }).then(() => {
      db.GET('board_approval_month:November')
        .then(result => {
          t.looseEqual(result, [
            { _id: '52b213b38594d8a2be17c780',
              match: [ 'board_approval_month:November' ] },
            { _id: '52b213b38594d8a2be17c781',
              match: [ 'board_approval_month:November' ] },
            { _id: '52b213b38594d8a2be17c782',
              match: [ 'board_approval_month:November' ] }
          ])
        })

    })

  })
  

})
