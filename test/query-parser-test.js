const fii = require('../')
const sandbox = 'test/sandbox/'
const test = require('tape')
const wbd = require('world-bank-dataset')

const indexName = sandbox + 'wb2'

test('create a little world bank index', t => {
  t.plan(1)
  fii.INIT({ name: indexName }).then(t.pass)
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
  t.plan(1)
  global[indexName].PUT(data).then(t.pass)
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

test('can GET with object', t => {
  t.plan(1)
  global[indexName].GET({
    gte: 'board_approval_month:November',
    lte: 'board_approval_month:November'
  })
    .then(result => {
      t.looseEqual(result, [
        { _id: '52b213b38594d8a2be17c780', match: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c781', match: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c782', match: [ 'board_approval_month:November' ] }
      ])
    })
})

test('can do some AND searches', t => {
  t.plan(1)
  global[indexName].AND(
    'sectorcode:BS',
    'sectorcode:BZ',
    'board_approval_month:November'
  )
    .then(result => {
      t.looseEqual(result, [
        {
          _id: '52b213b38594d8a2be17c781',
          match: [ [ 'sectorcode:BS' ], [ 'sectorcode:BZ' ], [ 'board_approval_month:November' ] ]
        }
      ])
    })
})

test('can do some OR searches', t => {
  t.plan(1)
  global[indexName].OR(
    'sectorcode:BS',
    'sectorcode:BZ',
    'board_approval_month:November'
  ).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c780', match: [ [ 'sectorcode:BS' ], [ 'board_approval_month:November' ] ] },
      { _id: '52b213b38594d8a2be17c781', match: [ [ 'sectorcode:BS' ], [ 'sectorcode:BZ' ], [ 'board_approval_month:November' ] ] },
      { _id: '52b213b38594d8a2be17c789', match: [ [ 'sectorcode:BZ' ] ] },
      { _id: '52b213b38594d8a2be17c782', match: [ [ 'board_approval_month:November' ] ] }       
    ])
  })
})

test('can do some OR searches', t => {
  t.plan(1)
  global[indexName].OR(
    'sectorcode:BZ',
    'sectorcode:TI'
  ).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c781', match: [ [ 'sectorcode:BZ' ] ] },
      { _id: '52b213b38594d8a2be17c789', match: [ [ 'sectorcode:BZ' ] ] },
      { _id: '52b213b38594d8a2be17c782', match: [ [ 'sectorcode:TI' ] ] },
      { _id: '52b213b38594d8a2be17c786', match: [ [ 'sectorcode:TI' ] ] },
      { _id: '52b213b38594d8a2be17c788', match: [ [ 'sectorcode:TI' ] ] }
    ])
  })
})

test('can do AND with nested OR', t => {
  t.plan(1)
  global[indexName].AND(
    'board_approval_month:November',
    global[indexName].OR('sectorcode:BZ', 'sectorcode:TI')
  ).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c781',
        match: [ [ 'board_approval_month:November' ], [ [ 'sectorcode:BZ' ] ] ] },
      { _id: '52b213b38594d8a2be17c782',
        match: [ [ 'board_approval_month:November' ], [ [ 'sectorcode:TI' ] ] ] }
    ])
  })
})

test('can do AND with embedded AND', t => {
  t.plan(1)
  global[indexName].AND(
    'board_approval_month:October',
    global[indexName].OR(
      global[indexName].AND( 'sectorcode:BZ', 'sectorcode:BC' ),
      'sectorcode:TI'
    )
  ).then(result => {
    t.looseEqual(result, [
      {
        _id: '52b213b38594d8a2be17c786',
        match: [ [ 'board_approval_month:October' ], [ [ 'sectorcode:TI' ] ] ]
      },
      {
        _id: '52b213b38594d8a2be17c788',
        match: [ [ 'board_approval_month:October' ], [ [ 'sectorcode:TI' ] ] ]
      },
      {
        _id: '52b213b38594d8a2be17c789',
        match: [ [ 'board_approval_month:October' ], [ [ [ 'sectorcode:BZ' ], [ 'sectorcode:BC' ] ] ] ]
      }
    ])
  })
})

test('can do AND', t => {
  t.plan(1)
  global[indexName].AND(
    'board_approval_month:November',
    global[indexName].OR('sectorcode:BZ', 'sectorcode:TI')
  ).then(global[indexName].OBJECT)
    .then(result => {
      t.looseEqual(result, [
        { _id: '52b213b38594d8a2be17c781', sectorcode: [ 'BZ', 'BS' ], board_approval_month: 'November', impagency: 'MINISTRY OF FINANCE', majorsector_percent: [ { Name: 'Public Administration, Law, and Justice', Percent: 70 }, { Name: 'Public Administration, Law, and Justice', Percent: 30 } ], mjsector_namecode: [ { name: 'Public Administration, Law, and Justice', code: 'BX' }, { name: 'Public Administration, Law, and Justice', code: 'BX' } ], sector_namecode: [ { name: 'Public administration- Other social services', code: 'BS' }, { name: 'General public administration sector', code: 'BZ' } ], totalamt: 0 }, { _id: '52b213b38594d8a2be17c782', sectorcode: [ 'TI' ], board_approval_month: 'November', impagency: 'MINISTRY OF TRANSPORT AND COMMUNICATIONS', majorsector_percent: [ { Name: 'Transportation', Percent: 100 } ], mjsector_namecode: [ { name: 'Transportation', code: 'TX' } ], sector_namecode: [ { name: 'Rural and Inter-Urban Roads and Highways', code: 'TI' } ], totalamt: 6060000 }
      ])
    })
})

test('can do AND with embedded OR search', t => {
  t.plan(1)
  global[indexName].AND(
    'board_approval_month:October',
    global[indexName].OR(
      'sectorcode:LR',
      global[indexName].AND('sectorcode:BC', 'sectorcode:BM')
    )
  ).then(global[indexName].OBJECT)
    .then(result => {
      t.looseEqual(result, [
        { _id: '52b213b38594d8a2be17c787', sectorcode: [ 'LR' ], board_approval_month: 'October', impagency: 'NATIONAL ENERGY ADMINISTRATION', majorsector_percent: [ { Name: 'Energy and mining', Percent: 100 } ], mjsector_namecode: [ { name: 'Energy and mining', code: 'LX' } ], sector_namecode: [ { name: 'Other Renewable Energy', code: 'LR' } ], totalamt: 0 },
        { _id: '52b213b38594d8a2be17c789', sectorcode: [ 'BM', 'BC', 'BZ' ], board_approval_month: 'October', impagency: 'MINISTRY OF FINANCE', majorsector_percent: [ { Name: 'Public Administration, Law, and Justice', Percent: 34 }, { Name: 'Public Administration, Law, and Justice', Percent: 33 }, { Name: 'Public Administration, Law, and Justice', Percent: 33 } ], mjsector_namecode: [ { name: 'Public Administration, Law, and Justice', code: 'BX' }, { name: 'Public Administration, Law, and Justice', code: 'BX' }, { name: 'Public Administration, Law, and Justice', code: 'BX' } ], sector_namecode: [ { name: 'General public administration sector', code: 'BZ' }, { name: 'Central government administration', code: 'BC' }, { name: 'Public administration- Information and communications', code: 'BM' } ], totalamt: 200000000 }
      ])
    })
})

test('can get highest value of totalamt (MAX)', t => {
  t.plan(1)
  global[indexName].MAX('totalamt')
    .then(result => {
      t.equal(result, 'totalamt:6060000')
    })
})

test('can get lowest value of totalamt (MIN)', t => {
  t.plan(1)
  global[indexName].MIN('totalamt')
    .then(result => {
      t.equal(result, 'totalamt:0')
    })
})

test('can get all values of totalamt (DIST)', t => {
  t.plan(1)
  global[indexName].DISTINCT('totalamt')
    .then(result => {
      t.looseEqual(result, [ 'totalamt:0',
                             'totalamt:10000000',
                             'totalamt:130000000',
                             'totalamt:13100000',
                             'totalamt:160000000',
                             'totalamt:200000000',
                             'totalamt:500000000',
                             'totalamt:6060000' ])
    })
})

test('can aggregate totalamt', t => {
  t.plan(1)
  global[indexName].DISTINCT({
    gte: 'totalamt:',
    lte: 'totalamt:~'
  })
   .then(result => Promise.all(result.map(global[indexName].BUCKET)))
   .then(result => {
     t.looseEqual(result, [
       { match: 'totalamt:0', _id: [ '52b213b38594d8a2be17c781', '52b213b38594d8a2be17c783', '52b213b38594d8a2be17c787' ] },
       { match: 'totalamt:10000000', _id: [ '52b213b38594d8a2be17c785' ] },
       { match: 'totalamt:130000000', _id: [ '52b213b38594d8a2be17c780' ] },
       { match: 'totalamt:13100000', _id: [ '52b213b38594d8a2be17c784' ] },
       { match: 'totalamt:160000000', _id: [ '52b213b38594d8a2be17c788' ] },
       { match: 'totalamt:200000000', _id: [ '52b213b38594d8a2be17c789' ] },
       { match: 'totalamt:500000000', _id: [ '52b213b38594d8a2be17c786' ] },
       { match: 'totalamt:6060000', _id: [ '52b213b38594d8a2be17c782' ] }
     ])
   })
})

test('can aggregate totalamt (showing ID count)', t => {
  t.plan(1)
  global[indexName].DISTINCT({
    gte: 'totalamt:',
    lte: 'totalamt:~'
  })
   .then(result => Promise.all(result.map(global[indexName].BUCKET)))
   .then(result => {
     t.looseEqual(result.map(item => {
       return {
         match: item.match,
         count: item._id.length
       }
     }), [
       { match: 'totalamt:0', count: 3 },
       { match: 'totalamt:10000000', count: 1 },
       { match: 'totalamt:130000000', count: 1 },
       { match: 'totalamt:13100000', count: 1 },
       { match: 'totalamt:160000000', count: 1 },
       { match: 'totalamt:200000000', count: 1 },
       { match: 'totalamt:500000000', count: 1 },
       { match: 'totalamt:6060000', count: 1 }
     ])
   })
})

test('can aggregate totalamt (showing ID count)', t => {
  t.plan(1)
  global[indexName].DISTINCT({
    gte: 'totalamt:1',
    lte: 'totalamt:4'
  })
   .then(result => Promise.all(result.map(global[indexName].BUCKET)))
   .then(result =>
     t.looseEqual(
       result.map(item => {
         return {
           match: item.match,
           count: item._id.length
         }
       }), [
         { match: 'totalamt:10000000', count: 1 },
         { match: 'totalamt:130000000', count: 1 },
         { match: 'totalamt:13100000', count: 1 },
         { match: 'totalamt:160000000', count: 1 },
         { match: 'totalamt:200000000', count: 1 }
       ]
     ))
})

test('can get documents with properties in a range', t => {
  t.plan(1)
  global[indexName].GET({
    gte: 'totalamt:1',
    lte: 'totalamt:4'
  }).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c785', match: [ 'totalamt:10000000' ] },
      { _id: '52b213b38594d8a2be17c780', match: [ 'totalamt:130000000' ] },
      { _id: '52b213b38594d8a2be17c784', match: [ 'totalamt:13100000' ] },
      { _id: '52b213b38594d8a2be17c788', match: [ 'totalamt:160000000' ] },
      { _id: '52b213b38594d8a2be17c789', match: [ 'totalamt:200000000' ] } ])
  })
})

test('can get documents with properties in a range', t => {
  t.plan(1)
  global[indexName].GET({
    gte: 'sectorcode:A',
    lte: 'sectorcode:G'
  }).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c789',
        match: [
          'sectorcode:BC',
          'sectorcode:BM',
          'sectorcode:BZ' ] },
      { _id: '52b213b38594d8a2be17c780',
        match: [
          'sectorcode:BS',
          'sectorcode:EP',
          'sectorcode:ES',
          'sectorcode:ET' ] },
      { _id: '52b213b38594d8a2be17c781',
        match: [
          'sectorcode:BS',
          'sectorcode:BZ' ] },
      { _id: '52b213b38594d8a2be17c784',
        match: [
          'sectorcode:FH' ] }
    ])
  })
})

test('can get documents with properties in a range and the NOT some out', t => {
  t.plan(1)
  global[indexName].NOT(
    global[indexName].GET({
      gte: 'sectorcode:A',
      lte: 'sectorcode:G'
    }),
    'sectorcode:YZ'
  ).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c789',
        match: [
          'sectorcode:BC',
          'sectorcode:BM',
          'sectorcode:BZ' ] },
      { _id: '52b213b38594d8a2be17c780',
        match: [
          'sectorcode:BS',
          'sectorcode:EP',
          'sectorcode:ES',
          'sectorcode:ET' ] },
      { _id: '52b213b38594d8a2be17c781',
        match: [
          'sectorcode:BS',
          'sectorcode:BZ' ] }
    ])
  })
})

test('can get documents with properties in a range and the NOT some out', t => {
  t.plan(1)
  global[indexName].NOT(
    'sectorcode:BS',
    'sectorcode:ET'
  ).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c781', match: [ 'sectorcode:BS' ] }
    ])
  })
})

test('can do OR with gte/lte', t => {
  t.plan(1)
  global[indexName].OR(
    { gte: 'sectorcode:B', lte: 'sectorcode:C' },
    { gte: 'sectorcode:K', lte: 'sectorcode:M' }
  ).then(result => {
    t.looseEqual(result, [
      {
        "_id": "52b213b38594d8a2be17c789",
        "match": [
          [
            "sectorcode:BC",
            "sectorcode:BM",
            "sectorcode:BZ"
          ]
        ]
      },
      {
        "_id": "52b213b38594d8a2be17c780",
        "match": [
          [
            "sectorcode:BS"
          ]
        ]
      },
      {
        "_id": "52b213b38594d8a2be17c781",
        "match": [
          [
            "sectorcode:BS",
            "sectorcode:BZ"
          ]
        ]
      },
      {
        "_id": "52b213b38594d8a2be17c787",
        "match": [
          [
            "sectorcode:LR"
          ]
        ]
      }
    ])
  })
})

test('can do AND with gte/lte', t => {
  t.plan(1)
  global[indexName].AND(
    { gte: 'sectorcode:E', lte: 'sectorcode:G' },
    { gte: 'sectorcode:Y', lte: 'sectorcode:Z' }
  ).then(result => {
    t.looseEqual(result, [
      {
        "_id": "52b213b38594d8a2be17c784",
        "match": [
          [
            "sectorcode:FH"
          ],
          [
            "sectorcode:YW",
            "sectorcode:YZ"
          ]
        ]
      }
    ])
  })
})

test('can aggregate totalamt', t => {
  t.plan(1)
  global[indexName].AGGREGATE(
    global[indexName].DISTINCT({
      gte: 'totalamt:',
      lte: 'totalamt:~'
    }).then(result => Promise.all(result.map(global[indexName].BUCKET))),
    global[indexName].GET("board_approval_month:November")
  ).then(result => {
    t.looseEqual(result, [
      { match: 'totalamt:0', _id: [ '52b213b38594d8a2be17c781' ] },
      { match: 'totalamt:130000000', _id: [ '52b213b38594d8a2be17c780' ] },
      { match: 'totalamt:6060000', _id: [ '52b213b38594d8a2be17c782' ] }
    ])
  })
})

test('can aggregate totalamt', t => {
  t.plan(1)
  global[indexName].AGGREGATE(
    global[indexName].DISTINCT({
      gte: 'totalamt:',
      lte: 'totalamt:~'
    }).then(result => Promise.all(result.map(global[indexName].BUCKET))),
    global[indexName].GET("board_approval_month:October")
  ).then(result => {
    t.looseEqual(result, [
      { match: 'totalamt:0', _id: [ '52b213b38594d8a2be17c783', '52b213b38594d8a2be17c787' ] },
      { match: 'totalamt:10000000', _id: [ '52b213b38594d8a2be17c785' ] },
      { match: 'totalamt:13100000', _id: [ '52b213b38594d8a2be17c784' ] },
      { match: 'totalamt:160000000', _id: [ '52b213b38594d8a2be17c788' ] },
      { match: 'totalamt:200000000', _id: [ '52b213b38594d8a2be17c789' ] },
      { match: 'totalamt:500000000', _id: [ '52b213b38594d8a2be17c786' ] }
    ])
  })
})

test('can do bucket', t => {
  t.plan(1)
  global[indexName].BUCKET('totalamt:1').then(result => {
    t.looseEqual(result, {
      match: 'totalamt:1',
      _id: [
        '52b213b38594d8a2be17c780',
        '52b213b38594d8a2be17c784',
        '52b213b38594d8a2be17c785',
        '52b213b38594d8a2be17c788'
      ]
    })
  })
})

test('can do custom buckets', t => {
  t.plan(1)
  Promise.all(
    [1, 2, 3, 4, 5].map(item => global[indexName].BUCKET('totalamt:' + item))
  ).then(result => t.looseEqual(result, [
    { match: 'totalamt:1', _id: [
      '52b213b38594d8a2be17c780',
      '52b213b38594d8a2be17c784',
      '52b213b38594d8a2be17c785',
      '52b213b38594d8a2be17c788' ] },
    { match: 'totalamt:2', _id: [ '52b213b38594d8a2be17c789' ] },
    { match: 'totalamt:3', _id: [] },
    { match: 'totalamt:4', _id: [] },
    { match: 'totalamt:5', _id: [ '52b213b38594d8a2be17c786' ] }
  ]))
})


test('can do custom buckets and agreggate', t => {
  t.plan(1)
  global[indexName].AGGREGATE(
    Promise.all(
      [1, 2, 3, 4, 5].map(item => global[indexName].BUCKET('totalamt:' + item))
    ),
    global[indexName].GET("board_approval_month:October")
  ).then(result => t.looseEqual(result, [
    { match: 'totalamt:1', _id: [
      '52b213b38594d8a2be17c784',
      '52b213b38594d8a2be17c785',
      '52b213b38594d8a2be17c788' ] },
    { match: 'totalamt:2', _id: [ '52b213b38594d8a2be17c789' ] },
    { match: 'totalamt:5', _id: [ '52b213b38594d8a2be17c786' ] }
  ]))
})
