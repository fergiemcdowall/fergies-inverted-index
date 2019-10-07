import fii from '../../dist/fergies-inverted-index.esm.js'
import test from 'tape'
import wbd from 'world-bank-dataset'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'wb2'

test('create a little world bank index', t => {
  t.plan(1)
  fii({ name: indexName }, (err, idx) => {
    global[indexName] = idx
    t.error(err)
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
  t.plan(1)
  global[indexName].PUT(data).then(t.pass)
})

test('can GET with string', t => {
  t.plan(1)
  global[indexName].GET('board_approval_month:November')
    .then(result => {
      t.looseEqual(result, [
        { _id: '52b213b38594d8a2be17c780', _match: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c781', _match: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c782', _match: [ 'board_approval_month:November' ] }
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
        { _id: '52b213b38594d8a2be17c780', _match: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c781', _match: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c782', _match: [ 'board_approval_month:November' ] }
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
         _match: [ [ 'sectorcode:BS' ], [ 'sectorcode:BZ' ], [ 'board_approval_month:November' ] ]
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
      { _id: '52b213b38594d8a2be17c780', _match: [ [ 'sectorcode:BS' ], [ 'board_approval_month:November' ] ] },
      { _id: '52b213b38594d8a2be17c781', _match: [ [ 'sectorcode:BS' ], [ 'sectorcode:BZ' ], [ 'board_approval_month:November' ] ] },
      { _id: '52b213b38594d8a2be17c789', _match: [ [ 'sectorcode:BZ' ] ] },
      { _id: '52b213b38594d8a2be17c782', _match: [ [ 'board_approval_month:November' ] ] }
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
      { _id: '52b213b38594d8a2be17c781', _match: [ [ 'sectorcode:BZ' ] ] },
      { _id: '52b213b38594d8a2be17c789', _match: [ [ 'sectorcode:BZ' ] ] },
      { _id: '52b213b38594d8a2be17c782', _match: [ [ 'sectorcode:TI' ] ] },
      { _id: '52b213b38594d8a2be17c786', _match: [ [ 'sectorcode:TI' ] ] },
      { _id: '52b213b38594d8a2be17c788', _match: [ [ 'sectorcode:TI' ] ] }
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
       _match: [ [ 'board_approval_month:November' ], [ [ 'sectorcode:BZ' ] ] ] },
      { _id: '52b213b38594d8a2be17c782',
       _match: [ [ 'board_approval_month:November' ], [ [ 'sectorcode:TI' ] ] ] }
    ])
  })
})

test('can do AND with embedded AND', t => {
  t.plan(1)
  global[indexName].AND(
    'board_approval_month:October',
    global[indexName].OR(
      global[indexName].AND('sectorcode:BZ', 'sectorcode:BC'),
      'sectorcode:TI'
    )
  ).then(result => {
    t.looseEqual(result, [
      {
        _id: '52b213b38594d8a2be17c786',
       _match: [ [ 'board_approval_month:October' ], [ [ 'sectorcode:TI' ] ] ]
      },
      {
        _id: '52b213b38594d8a2be17c788',
       _match: [ [ 'board_approval_month:October' ], [ [ 'sectorcode:TI' ] ] ]
      },
      {
        _id: '52b213b38594d8a2be17c789',
       _match: [ [ 'board_approval_month:October' ], [ [ [ 'sectorcode:BZ' ], [ 'sectorcode:BC' ] ] ] ]
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
        { gte: 'totalamt:0', lte: 'totalamt:0', _id: [ '52b213b38594d8a2be17c781', '52b213b38594d8a2be17c783', '52b213b38594d8a2be17c787' ] },
        { gte: 'totalamt:10000000', lte: 'totalamt:10000000', _id: [ '52b213b38594d8a2be17c785' ] },
        { gte: 'totalamt:130000000', lte: 'totalamt:130000000', _id: [ '52b213b38594d8a2be17c780' ] },
        { gte: 'totalamt:13100000', lte: 'totalamt:13100000', _id: [ '52b213b38594d8a2be17c784' ] },
        { gte: 'totalamt:160000000', lte: 'totalamt:160000000', _id: [ '52b213b38594d8a2be17c788' ] },
        { gte: 'totalamt:200000000', lte: 'totalamt:200000000', _id: [ '52b213b38594d8a2be17c789' ] },
        { gte: 'totalamt:500000000', lte: 'totalamt:500000000', _id: [ '52b213b38594d8a2be17c786' ] },
        { gte: 'totalamt:6060000', lte: 'totalamt:6060000', _id: [ '52b213b38594d8a2be17c782' ] }
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
          gte: item.gte,
          lte: item.lte,
          count: item._id.length
        }
      }), [
        { gte: 'totalamt:0', lte: 'totalamt:0', count: 3 },
        { gte: 'totalamt:10000000', lte: 'totalamt:10000000', count: 1 },
        { gte: 'totalamt:130000000', lte: 'totalamt:130000000', count: 1 },
        { gte: 'totalamt:13100000', lte: 'totalamt:13100000', count: 1 },
        { gte: 'totalamt:160000000', lte: 'totalamt:160000000', count: 1 },
        { gte: 'totalamt:200000000', lte: 'totalamt:200000000', count: 1 },
        { gte: 'totalamt:500000000', lte: 'totalamt:500000000', count: 1 },
        { gte: 'totalamt:6060000', lte: 'totalamt:6060000', count: 1 }
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
            gte: item.gte,
            lte: item.lte,
            count: item._id.length
          }
        }), [
          { gte: 'totalamt:10000000', lte: 'totalamt:10000000', count: 1 },
          { gte: 'totalamt:130000000', lte: 'totalamt:130000000', count: 1 },
          { gte: 'totalamt:13100000', lte: 'totalamt:13100000', count: 1 },
          { gte: 'totalamt:160000000', lte: 'totalamt:160000000', count: 1 },
          { gte: 'totalamt:200000000', lte: 'totalamt:200000000', count: 1 }
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
      { _id: '52b213b38594d8a2be17c785', _match: [ 'totalamt:10000000' ] },
      { _id: '52b213b38594d8a2be17c780', _match: [ 'totalamt:130000000' ] },
      { _id: '52b213b38594d8a2be17c784', _match: [ 'totalamt:13100000' ] },
      { _id: '52b213b38594d8a2be17c788', _match: [ 'totalamt:160000000' ] },
      { _id: '52b213b38594d8a2be17c789', _match: [ 'totalamt:200000000' ] } ])
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
       _match: [
          'sectorcode:BC',
          'sectorcode:BM',
          'sectorcode:BZ' ] },
      { _id: '52b213b38594d8a2be17c780',
       _match: [
          'sectorcode:BS',
          'sectorcode:EP',
          'sectorcode:ES',
          'sectorcode:ET' ] },
      { _id: '52b213b38594d8a2be17c781',
       _match: [
          'sectorcode:BS',
          'sectorcode:BZ' ] },
      { _id: '52b213b38594d8a2be17c784',
       _match: [
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
        _match: [
          'sectorcode:BC',
          'sectorcode:BM',
          'sectorcode:BZ' ] },
      { _id: '52b213b38594d8a2be17c780',
        _match: [
          'sectorcode:BS',
          'sectorcode:EP',
          'sectorcode:ES',
          'sectorcode:ET' ] },
      { _id: '52b213b38594d8a2be17c781',
        _match: [
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
      { _id: '52b213b38594d8a2be17c781', _match: [ 'sectorcode:BS' ] }
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
        '_id': '52b213b38594d8a2be17c789',
        '_match': [
          [
            'sectorcode:BC',
            'sectorcode:BM',
            'sectorcode:BZ'
          ]
        ]
      },
      {
        '_id': '52b213b38594d8a2be17c780',
        '_match': [
          [
            'sectorcode:BS'
          ]
        ]
      },
      {
        '_id': '52b213b38594d8a2be17c781',
        '_match': [
          [
            'sectorcode:BS',
            'sectorcode:BZ'
          ]
        ]
      },
      {
        '_id': '52b213b38594d8a2be17c787',
        '_match': [
          [
            'sectorcode:LR'
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
        '_id': '52b213b38594d8a2be17c784',
        '_match': [
          [
            'sectorcode:FH'
          ],
          [
            'sectorcode:YW',
            'sectorcode:YZ'
          ]
        ]
      }
    ])
  })
})

test('can aggregate totalamt', t => {
  t.plan(1)
  global[indexName].BUCKETFILTER(
    global[indexName].DISTINCT({
      gte: 'totalamt:',
      lte: 'totalamt:~'
    }).then(result => Promise.all(result.map(global[indexName].BUCKET))),
    global[indexName].GET('board_approval_month:November')
  ).then(result => {
    t.looseEqual(result, [
      { gte: 'totalamt:0', lte: 'totalamt:0', _id: [ '52b213b38594d8a2be17c781' ] },
      { gte: 'totalamt:130000000', lte: 'totalamt:130000000', _id: [ '52b213b38594d8a2be17c780' ] },
      { gte: 'totalamt:6060000', lte: 'totalamt:6060000', _id: [ '52b213b38594d8a2be17c782' ] }
    ])
  })
})

test('can aggregate totalamt', t => {
  t.plan(1)
  global[indexName].BUCKETFILTER(
    global[indexName].DISTINCT({
      gte: 'totalamt:',
      lte: 'totalamt:~'
    }).then(result => Promise.all(result.map(global[indexName].BUCKET))),
    global[indexName].GET('board_approval_month:October')
  ).then(result => {
    t.looseEqual(result, [
      { gte: 'totalamt:0', lte: 'totalamt:0', _id: [ '52b213b38594d8a2be17c783', '52b213b38594d8a2be17c787' ] },
      { gte: 'totalamt:10000000', lte: 'totalamt:10000000', _id: [ '52b213b38594d8a2be17c785' ] },
      { gte: 'totalamt:13100000', lte: 'totalamt:13100000', _id: [ '52b213b38594d8a2be17c784' ] },
      { gte: 'totalamt:160000000', lte: 'totalamt:160000000', _id: [ '52b213b38594d8a2be17c788' ] },
      { gte: 'totalamt:200000000', lte: 'totalamt:200000000', _id: [ '52b213b38594d8a2be17c789' ] },
      { gte: 'totalamt:500000000', lte: 'totalamt:500000000', _id: [ '52b213b38594d8a2be17c786' ] }
    ])
  })
})

test('can do bucket', t => {
  t.plan(1)
  global[indexName].BUCKET('totalamt:1').then(result => {
    t.looseEqual(result, {
      gte: 'totalamt:1',
      lte: 'totalamt:1',
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
    { gte: 'totalamt:1', lte: 'totalamt:1', _id: [ '52b213b38594d8a2be17c780',
                                                   '52b213b38594d8a2be17c784',
                                                   '52b213b38594d8a2be17c785',
                                                   '52b213b38594d8a2be17c788' ] },
    { gte: 'totalamt:2', lte: 'totalamt:2', _id: [ '52b213b38594d8a2be17c789' ] },
    { gte: 'totalamt:3', lte: 'totalamt:3', _id: [] },
    { gte: 'totalamt:4', lte: 'totalamt:4', _id: [] },
    { gte: 'totalamt:5', lte: 'totalamt:5', _id: [ '52b213b38594d8a2be17c786' ] } ]))
})

test('can do custom buckets and agreggate', t => {
  t.plan(1)
  global[indexName].BUCKETFILTER(
    Promise.all(
      [1, 2, 3, 4, 5].map(item => global[indexName].BUCKET('totalamt:' + item))
    ),
    global[indexName].GET('board_approval_month:October')
  ).then(result => t.looseEqual(result, [
    { gte: 'totalamt:1', lte: 'totalamt:1',
      _id: [ '52b213b38594d8a2be17c784', '52b213b38594d8a2be17c785', '52b213b38594d8a2be17c788' ] },
    { gte: 'totalamt:2', lte: 'totalamt:2', _id: [ '52b213b38594d8a2be17c789' ] },
    { gte: 'totalamt:5', lte: 'totalamt:5', _id: [ '52b213b38594d8a2be17c786' ] } 
  ]))
})
