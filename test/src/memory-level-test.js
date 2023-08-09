import test from 'tape'
import wbd from 'world-bank-dataset'
import { InvertedIndex } from 'fergies-inverted-index'
import { MemoryLevel } from 'memory-level'

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

test('create a fii with memory-level', t => {
  t.plan(2)
  new InvertedIndex({
    Level: MemoryLevel
  }).then(db =>
    db
      .PUT(data)
      .then(() => {
        t.pass('ok')
      })
      .then(() => {
        db.GET({
          FIELD: 'board_approval_month',
          VALUE: 'November'
        }).then(result => {
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
  )
})
