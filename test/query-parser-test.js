const ndb = require('../lib/ndb-core.js')
const sandbox = 'test/sandbox/'
const test = require('tape')
const wbd = require('world-bank-dataset')


// THOUGHTS

// use property/object (prop/obj?) instead of key/doc
// possibly just focus on boolean AND/OR


// QUERIES

// ndb.doc.map.ALL
// ndb.doc.map.ANY
// ndb.doc.map.RAN (range) <- make embeddable

// ndb.key.map.RAN (range- can do gte and lte)
// ndb.key.map.MAX
// ndb.key.map.MIN


// REDUCERS

// ndb.doc.reduce.NOT


// MAPPERS

// ndb.m.DOC
// ndb.m.FIELDS(fieldNames)


// SORTERS

// ndb.s.ID

var wb

test('create a little world bank index', t => {
  t.plan(1)
  ndb({
    name: sandbox + 'wb2'
  }).then(db => {
    wb = db
    t.pass('db created')
  })
})


test('can add some worldbank data', t => {
  var dataSize = 10
  const data = wbd.slice(0, dataSize).map(item => {
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
  console.log(JSON.stringify(data.map(item => item.totalamt), null, 2))
  t.plan(dataSize)
  wb.bat(data, progress => {
    t.pass(JSON.stringify(progress))
  }, () => {
    t.pass('done')
  })
})


test('can do some ALL searches', t => {
  t.plan(2)

// this should maybe be wb.obj.ALL
  
  wb.getObjectIds.AND([
    'sectorcode.BS',
    'sectorcode.BZ',
    'board_approval_month.November'
  ])
    .then(wb.getFullObjects)
    .then(result => {
      t.equal(result.length, 1)
      t.equal(result.shift()._id, '52b213b38594d8a2be17c781')
    })
})

test('can do some ANY searches', t => {
  t.plan(5)
  wb.getObjectIds.OR([
    'sectorcode.BS',
    'sectorcode.BZ',
    'board_approval_month.November'
  ])
    .then(wb.getFullObjects)
    .then(result => {
      t.equal(result.length, 4)
      t.equal(result.shift()._id, '52b213b38594d8a2be17c780')
      t.equal(result.shift()._id, '52b213b38594d8a2be17c781')
      t.equal(result.shift()._id, '52b213b38594d8a2be17c789')
      t.equal(result.shift()._id, '52b213b38594d8a2be17c782')
    })
})

test('can do ALL with embedded ANY search', t => {
  t.plan(4)
  wb.getObjectIds.AND([
    'board_approval_month.November',
    wb.getObjectIds.OR(['sectorcode.BS', 'sectorcode.TI'])
  ])
    .then(wb.getFullObjects)
    .then(result => {
      t.equal(result.length, 3)
      t.equal(result.shift()._id, '52b213b38594d8a2be17c780')
      t.equal(result.shift()._id, '52b213b38594d8a2be17c781')
      t.equal(result.shift()._id, '52b213b38594d8a2be17c782')
    })
})

test('can get highest value of totalamt (MAX)', t => {
  t.plan(1)
  wb.getProperties.MAX('totalamt')
    .then(result => {
      t.equal(result, 'totalamt.6060000')
    })
})

test('can get lowest value of totalamt (MIN)', t => {
  t.plan(1)
  wb.getProperties.MIN('totalamt')
    .then(result => {
      t.equal(result, 'totalamt.0')
    })
})

test('can get all values of totalamt (DIST)', t => {
  t.plan(1)
  wb.getProperties.DIST('totalamt')
    .then(result => {
      t.looseEqual(result, [ 'totalamt.0',
                             'totalamt.10000000',
                             'totalamt.130000000',
                             'totalamt.13100000',
                             'totalamt.160000000',
                             'totalamt.200000000',
                             'totalamt.500000000',
                             'totalamt.6060000' ])
    })
})


test('can aggregate totalamt', t => {
  t.plan(1)
  wb.getProperties.DIST('totalamt').then(result => {
    wb.getObjectIds.EACH(result).then(result => {
      t.looseEqual( result, [
        { property: 'totalamt.0', objectIds: [ '52b213b38594d8a2be17c781', '52b213b38594d8a2be17c783', '52b213b38594d8a2be17c787' ] },
        { property: 'totalamt.10000000', objectIds: [ '52b213b38594d8a2be17c785' ] },
        { property: 'totalamt.130000000', objectIds: [ '52b213b38594d8a2be17c780' ] },
        { property: 'totalamt.13100000', objectIds: [ '52b213b38594d8a2be17c784' ] },
        { property: 'totalamt.160000000', objectIds: [ '52b213b38594d8a2be17c788' ] },
        { property: 'totalamt.200000000', objectIds: [ '52b213b38594d8a2be17c789' ] },
        { property: 'totalamt.500000000', objectIds: [ '52b213b38594d8a2be17c786' ] },
        { property: 'totalamt.6060000', objectIds: [ '52b213b38594d8a2be17c782' ] }
      ])
    })
  })
})




// test('can do ALL with embedded ANY search and NOT', t => {
//   t.plan(4)
//   var dataSize = 50  
//   wb.get('sectorcode.BS').then(console.log)
//   wb.value.map.ALL([
//     'board_approval_month.November',
//     wb.doc.map.ANY(['sectorcode.BS', 'sectorcode.TI'])
//   ]).then(
//     wb.doc.reduce.NOT([
//       wb.doc.map.ALL([
//         'impagency.MINISTRY OF EDUCATION'
//       ])
//     ])
//   )
//     .then(wb.doc.reduce.fetchDocs)
//     .then(result => {
//       t.equal(result.length, 3)
//       t.equal(result.shift()._id, '52b213b38594d8a2be17c780')
//       t.equal(result.shift()._id, '52b213b38594d8a2be17c781')
//       t.equal(result.shift()._id, '52b213b38594d8a2be17c782')
//     })
// })


// test('can do RANGE search', t => {
//   t.plan(6)
//   var dataSize = 50  
//   wb.doc.map.RAN('totalamt.0', 'totalamt.5')
//     .then(wb.doc.reduce.fetchDocs)
//     .then(result => {
//       t.equal(result.length, 5)
//       t.equal(result.shift()._id, '52b213b38594d8a2be17c785')
//       t.equal(result.shift()._id, '52b213b38594d8a2be17c780')
//       t.equal(result.shift()._id, '52b213b38594d8a2be17c784')
//       t.equal(result.shift()._id, '52b213b38594d8a2be17c788')
//       t.equal(result.shift()._id, '52b213b38594d8a2be17c789')
//     })
// })

// test('can do key RANGE search', t => {
//   t.plan(4)
//   var dataSize = 50  
//   wb.key.map.RAN({
//     gte: 'totalamt.0',
//     lte: 'totalamt.131'
//   }).then(result => {
//     t.equal(result.length, 3)
//     t.looseEqual(result.shift(), { key: 'totalamt.0',
//                                    value: [ '52b213b38594d8a2be17c781',
//                                             '52b213b38594d8a2be17c783',
//                                             '52b213b38594d8a2be17c787' ] })
//     t.looseEqual(result.shift(), { key: 'totalamt.10000000',
//                                    value: [ '52b213b38594d8a2be17c785' ] })
//     t.looseEqual(result.shift(), { key: 'totalamt.130000000',
//                                    value: [ '52b213b38594d8a2be17c780' ] })
//   })
// })

// test('can do key MIN search', t => {
//   t.plan(2)
//   var dataSize = 50  
//   wb.key.map.MIN({
//     gte: 'totalamt.'
//   }).then(result => {
//     t.equal(result.length, 1)
//     t.looseEqual(result.shift(), { key: 'totalamt.0',
//                                    value: [ '52b213b38594d8a2be17c781',
//                                             '52b213b38594d8a2be17c783',
//                                             '52b213b38594d8a2be17c787' ] })
//   })
// })

// test('can do key MIN search with limit', t => {
//   t.plan(3)
//   var dataSize = 50  
//   wb.key.map.MIN({
//     gte: 'totalamt.',
//     limit: 2
//   }).then(result => {
//     t.equal(result.length, 2)
//     t.looseEqual(result.shift(), { key: 'totalamt.0',
//                                    value: [ '52b213b38594d8a2be17c781',
//                                             '52b213b38594d8a2be17c783',
//                                             '52b213b38594d8a2be17c787' ] })
//     t.looseEqual(result.shift(), { key: 'totalamt.10000000',
//                                    value: [ '52b213b38594d8a2be17c785' ] })
//   })
// })

// test('can do key MAX search', t => {
//   t.plan(2)
//   var dataSize = 50  
//   wb.key.map.MAX({
//     lte: 'totalamt.'
//   }).then(result => {
//     t.equal(result.length, 1)
//     t.looseEqual(result.shift(), { key: 'totalamt.6060000',
//                                    value: [ '52b213b38594d8a2be17c782' ] })
//   })
// })

// test('can do key MAX search with limit', t => {
//   t.plan(4)
//   var dataSize = 50  
//   wb.key.map.MAX({
//     lte: 'totalamt.',
//     limit: 3
//   }).then(result => {
//     t.equal(result.length, 3)
//     t.looseEqual(result.shift(), { key: 'totalamt.6060000',
//                                    value: [ '52b213b38594d8a2be17c782' ] })
//     t.looseEqual(result.shift(), { key: 'totalamt.500000000',
//                                    value: [ '52b213b38594d8a2be17c786' ] })
//     t.looseEqual(result.shift(), { key: 'totalamt.200000000',
//                                    value: [ '52b213b38594d8a2be17c789' ] })
//   })
// })




// XXXXXXXXXXX


// test('can do some searches', t => {
//   t.plan(2)
//   var dataSize = 50  
//   wb.get({
//     select: {
//       sectorcode: [ 'BS', 'BZ' ],
//       board_approval_month: 'November'
//     }
//   }).then(result => {
//     t.equal(result.length, 1)
//     t.equal(result[0]._id, '52b213b38594d8a2be17c781')
//   })
// })


// test('can do some searches', t => {
//   t.plan(3)
//   var dataSize = 50
//   wb.get({
//     select: {
//       impagency: 'MINISTRY OF FINANCE'
//     }
//   }).then(result => {
//     t.equal(result.length, 2)
//     t.equal(result[0]._id, '52b213b38594d8a2be17c781')
//     t.equal(result[1]._id, '52b213b38594d8a2be17c789')
//   })
// })


// test('can do some searches', t => {
//   t.plan(4)
//   var dataSize = 50
//   //this only works because Transportation is at position 0 in the source docs
//   wb.get({
//     select: {
//       majorsector_percent: [
//         {
//           Name: 'Transportation'
//         }
//       ]
//     }
//   }).then(result => {
//     t.equal(result.length, 3)
//     t.equal(result[0]._id, '52b213b38594d8a2be17c782')
//     t.equal(result[1]._id, '52b213b38594d8a2be17c786')
//     t.equal(result[2]._id, '52b213b38594d8a2be17c788')
//   })
// })


// test('can do some searches (nested array)', t => {
//   t.plan(2)
//   var dataSize = 50
//   wb.get({
//     select: {
//       sector_namecode: [
//         {
//           name: 'Tertiary education'
//         }
//       ]
//     }
//   }).then(result => {
//     t.equal(result.length, 1)
//     t.equal(result[0]._id, '52b213b38594d8a2be17c780')
//   })
// })


// test('can do some searches (ORing)', t => {
//   t.plan(3)
//   var dataSize = 50
//   wb.get({
//     select: {
//       mjsector_namecode: [
//         {
//           // what about ndb.q.OR ?
//           name: {
//             _OR: ['Finance', 'Education']
//           }
//         }
//       ]
//     }
//   }).then(result => {
//     t.equal(result.length, 2)
//     t.equal(result[0]._id, '52b213b38594d8a2be17c784')
//     t.equal(result[1]._id, '52b213b38594d8a2be17c780')
//   })
// })

