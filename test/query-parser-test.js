const ndb = require('../lib/index.js')
const sandbox = 'test/sandbox/'
const test = require('tape')
const wbd = require('world-bank-dataset')

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
  console.log(JSON.stringify(data.map(item => {
    return {
      _id: item._id,
      board_approval_month: item.board_approval_month,
      sectorcode: item.sectorcode
    }
  }), null, 2))
  t.plan(dataSize)
  wb.bat(data, progress => {
    t.pass(JSON.stringify(progress))
  }, () => {
    t.pass('done')
  })
})

test('can GET', t => {
  t.plan(1)
  wb.getObjectIds.GET([
    'board_approval_month.November'
  ])
   .then(result => {
     t.looseEqual(result, [
       { _id: '52b213b38594d8a2be17c780', prop: [ 'board_approval_month.November' ] },
       { _id: '52b213b38594d8a2be17c781', prop: [ 'board_approval_month.November' ] },
       { _id: '52b213b38594d8a2be17c782', prop: [ 'board_approval_month.November' ] }
     ])      
   })
})


test('can do some AND searches', t => {
  t.plan(1)
  wb.getObjectIds.AND([
    'sectorcode.BS',
    'sectorcode.BZ',
    'board_approval_month.November'
  ])
   .then(result => {
     t.looseEqual(result, [
       {
         _id: '52b213b38594d8a2be17c781',
         prop: [ [ 'sectorcode.BS' ], [ 'sectorcode.BZ' ], [ 'board_approval_month.November' ] ]
       }
     ])      
   })
})

test('can do some OR searches', t => {
  t.plan(1)
  wb.getObjectIds.OR([
    'sectorcode.BS',
    'sectorcode.BZ',
    'board_approval_month.November'
  ])
   .then(result => {
     t.looseEqual(result, [
       { _id: '52b213b38594d8a2be17c780', prop: [ [ 'sectorcode.BS' ], [ 'board_approval_month.November' ] ] },
       { _id: '52b213b38594d8a2be17c781', prop: [ [ 'sectorcode.BS' ], [ 'sectorcode.BZ' ], [ 'board_approval_month.November' ] ] },
       { _id: '52b213b38594d8a2be17c789', prop: [ [ 'sectorcode.BZ' ] ] },
       { _id: '52b213b38594d8a2be17c782', prop: [ [ 'board_approval_month.November' ] ] } 
       
     ]) 
   })
})


test('can do some OR searches', t => {
  t.plan(1)
  wb.getObjectIds.OR([
    'sectorcode.BZ',
    'sectorcode.TI'
  ])
   .then(result => {
     t.looseEqual(result, [
       { _id: '52b213b38594d8a2be17c781', prop: [ [ 'sectorcode.BZ' ] ] },
       { _id: '52b213b38594d8a2be17c789', prop: [ [ 'sectorcode.BZ' ] ] },
       { _id: '52b213b38594d8a2be17c782', prop: [ [ 'sectorcode.TI' ] ] },
       { _id: '52b213b38594d8a2be17c786', prop: [ [ 'sectorcode.TI' ] ] },
       { _id: '52b213b38594d8a2be17c788', prop: [ [ 'sectorcode.TI' ] ] }
     ]) 
   })
})


test('can do AND with embedded OR', t => {
  t.plan(1)
  wb.getObjectIds.AND([
    'board_approval_month.November',
    wb.getObjectIds.OR(['sectorcode.BZ', 'sectorcode.TI'])
  ])
   .then(result => {
     t.looseEqual(result, [
       { _id: '52b213b38594d8a2be17c781',
         prop: [ [ 'board_approval_month.November' ], [ [ 'sectorcode.BZ' ] ] ] },
       { _id: '52b213b38594d8a2be17c782',
         prop: [ [ 'board_approval_month.November' ], [ [ 'sectorcode.TI' ] ] ] } 
     ]) 
   })
})

test('can do AND with embedded AND', t => {
  t.plan(1)
  wb.getObjectIds.AND([
    'board_approval_month.October',
    wb.getObjectIds.OR([
      wb.getObjectIds.AND([ 'sectorcode.BZ', 'sectorcode.BC' ]),
      'sectorcode.TI'
    ])
  ])
   .then(result => {
     t.looseEqual(result, [       
       {
         _id: '52b213b38594d8a2be17c786',
         prop: [ [ 'board_approval_month.October' ], [ [ 'sectorcode.TI' ] ] ]
       },
       {
         _id: '52b213b38594d8a2be17c788',
         prop: [ [ 'board_approval_month.October' ], [ [ 'sectorcode.TI' ] ] ]
       },
       {
         _id: '52b213b38594d8a2be17c789',
         prop: [ [ 'board_approval_month.October' ], [ [ [ 'sectorcode.BZ' ], [ 'sectorcode.BC' ] ] ] ]
       }
     ]) 
   })
})



test('can do AND', t => {
  t.plan(1)
  wb.getObjectIds.AND([
    'board_approval_month.November',
    wb.getObjectIds.OR(['sectorcode.BZ', 'sectorcode.TI'])
  ])
   .then(wb.getObjects)
   .then(result => {
     t.looseEqual(result, [
       { _id: '52b213b38594d8a2be17c781', sectorcode: [ 'BZ', 'BS' ], board_approval_month: 'November', impagency: 'MINISTRY OF FINANCE', majorsector_percent: [ { Name: 'Public Administration, Law, and Justice', Percent: 70 }, { Name: 'Public Administration, Law, and Justice', Percent: 30 } ], mjsector_namecode: [ { name: 'Public Administration, Law, and Justice', code: 'BX' }, { name: 'Public Administration, Law, and Justice', code: 'BX' } ], sector_namecode: [ { name: 'Public administration- Other social services', code: 'BS' }, { name: 'General public administration sector', code: 'BZ' } ], totalamt: 0 }, { _id: '52b213b38594d8a2be17c782', sectorcode: [ 'TI' ], board_approval_month: 'November', impagency: 'MINISTRY OF TRANSPORT AND COMMUNICATIONS', majorsector_percent: [ { Name: 'Transportation', Percent: 100 } ], mjsector_namecode: [ { name: 'Transportation', code: 'TX' } ], sector_namecode: [ { name: 'Rural and Inter-Urban Roads and Highways', code: 'TI' } ], totalamt: 6060000 } 
     ])       
   })
})

test('can do AND with embedded OR search', t => {
  t.plan(1)
  wb.getObjectIds.AND([
    'board_approval_month.October',
    wb.getObjectIds.OR([
      'sectorcode.LR',
      wb.getObjectIds.AND(['sectorcode.BC', 'sectorcode.BM'])
    ])
  ])
   .then(wb.getObjects)
   .then(result => {
     t.looseEqual(result, [
       { _id: '52b213b38594d8a2be17c787', sectorcode: [ 'LR' ], board_approval_month: 'October', impagency: 'NATIONAL ENERGY ADMINISTRATION', majorsector_percent: [ { Name: 'Energy and mining', Percent: 100 } ], mjsector_namecode: [ { name: 'Energy and mining', code: 'LX' } ], sector_namecode: [ { name: 'Other Renewable Energy', code: 'LR' } ], totalamt: 0 },
       { _id: '52b213b38594d8a2be17c789', sectorcode: [ 'BM', 'BC', 'BZ' ], board_approval_month: 'October', impagency: 'MINISTRY OF FINANCE', majorsector_percent: [ { Name: 'Public Administration, Law, and Justice', Percent: 34 }, { Name: 'Public Administration, Law, and Justice', Percent: 33 }, { Name: 'Public Administration, Law, and Justice', Percent: 33 } ], mjsector_namecode: [ { name: 'Public Administration, Law, and Justice', code: 'BX' }, { name: 'Public Administration, Law, and Justice', code: 'BX' }, { name: 'Public Administration, Law, and Justice', code: 'BX' } ], sector_namecode: [ { name: 'General public administration sector', code: 'BZ' }, { name: 'Central government administration', code: 'BC' }, { name: 'Public administration- Information and communications', code: 'BM' } ], totalamt: 200000000 }
     ])
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
  wb.getProperties.DISTINCT('totalamt')
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
  wb.getProperties.DISTINCT('totalamt')
   .then(result => wb.getObjectIds.EACH(result))
   .then(result => {
     t.looseEqual( result, [
       { prop: 'totalamt.0', _id: [ '52b213b38594d8a2be17c781', '52b213b38594d8a2be17c783', '52b213b38594d8a2be17c787' ] },
       { prop: 'totalamt.10000000', _id: [ '52b213b38594d8a2be17c785' ] },
       { prop: 'totalamt.130000000', _id: [ '52b213b38594d8a2be17c780' ] },
       { prop: 'totalamt.13100000', _id: [ '52b213b38594d8a2be17c784' ] },
       { prop: 'totalamt.160000000', _id: [ '52b213b38594d8a2be17c788' ] },
       { prop: 'totalamt.200000000', _id: [ '52b213b38594d8a2be17c789' ] },
       { prop: 'totalamt.500000000', _id: [ '52b213b38594d8a2be17c786' ] },
       { prop: 'totalamt.6060000', _id: [ '52b213b38594d8a2be17c782' ] }
     ])
   })
})


test('can aggregate totalamt (showing ID count)', t => {
  t.plan(1)
  wb.getProperties.DISTINCT('totalamt')
   .then(result => wb.getObjectIds.EACH(result))
   .then(result => {      
     t.looseEqual( result.map(item => {
       return {
         prop: item.prop,
         count: item._id.length
       }
     }), [
       { prop: 'totalamt.0', count: 3 },
       { prop: 'totalamt.10000000', count: 1 },
       { prop: 'totalamt.130000000', count: 1 },
       { prop: 'totalamt.13100000', count: 1 },
       { prop: 'totalamt.160000000', count: 1 },
       { prop: 'totalamt.200000000', count: 1 },
       { prop: 'totalamt.500000000', count: 1 },
       { prop: 'totalamt.6060000', count: 1 }
     ])
   })
})


test('can aggregate totalamt (showing ID count)', t => {
  t.plan(1)
  new Promise ((resolve, reject) => {
    //wb.QUERY ((resolve, reject) => {
    wb.getProperties.DISTINCT('totalamt', {
      gte: 1,
      lte: 4
    }).then(result => wb.getObjectIds.EACH(result))
      .then(result => resolve(
        result.map(item => {
          return {
            prop: item.prop,
            count: item._id.length
          }
        })
      ))
  }).then(result => {
    t.looseEqual(result, [
      { prop: 'totalamt.10000000', count: 1 },
      { prop: 'totalamt.130000000', count: 1 },
      { prop: 'totalamt.13100000', count: 1 },
      { prop: 'totalamt.160000000', count: 1 },
      { prop: 'totalamt.200000000', count: 1 },
    ])
  })
})

test('can get documents with properties in a range', t => {
  t.plan(1)
  wb.getObjectIds.RANGE({
    gte: 'totalamt.1',
    lte: 'totalamt.4'
  }).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c785', prop: [ 'totalamt.10000000' ] },
      { _id: '52b213b38594d8a2be17c780', prop: [ 'totalamt.130000000' ] },
      { _id: '52b213b38594d8a2be17c784', prop: [ 'totalamt.13100000' ] },
      { _id: '52b213b38594d8a2be17c788', prop: [ 'totalamt.160000000' ] },
      { _id: '52b213b38594d8a2be17c789', prop: [ 'totalamt.200000000' ] } ])
  })
})


test('can get documents with properties in a range', t => {
  t.plan(1)
  wb.getObjectIds.RANGE({
    gte: 'sectorcode.A',
    lte: 'sectorcode.G'
  }).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c789', prop: [
        'sectorcode.BC',
        'sectorcode.BM',
        'sectorcode.BZ' ] },
      { _id: '52b213b38594d8a2be17c780', prop: [
        'sectorcode.BS',
        'sectorcode.EP',
        'sectorcode.ES',
        'sectorcode.ET' ] },
      { _id: '52b213b38594d8a2be17c781', prop: [
        'sectorcode.BS',
        'sectorcode.BZ' ] },
      { _id: '52b213b38594d8a2be17c784', prop: [
        'sectorcode.FH' ] }
    ])
  })
})


test('can get documents with properties in a range and the NOT some out', t => {
  t.plan(1)
  wb.getObjectIds.NOT(
    wb.getObjectIds.RANGE({
      gte: 'sectorcode.A',
      lte: 'sectorcode.G'
    }),
    'sectorcode.YZ'
  ).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c789', prop: [
        'sectorcode.BC',
        'sectorcode.BM',
        'sectorcode.BZ' ] },
      { _id: '52b213b38594d8a2be17c780', prop: [
        'sectorcode.BS',
        'sectorcode.EP',
        'sectorcode.ES',
        'sectorcode.ET' ] },
      { _id: '52b213b38594d8a2be17c781', prop: [
        'sectorcode.BS',
        'sectorcode.BZ' ] }
    ])
  })
})

test('can get documents with properties in a range and the NOT some out', t => {
  t.plan(1)
  wb.getObjectIds.NOT(
    'sectorcode.BS',
    'sectorcode.ET',
  ).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c781', prop: [ 'sectorcode.BS' ] }
    ])
  })
})



// XXXXXXXXXX


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

