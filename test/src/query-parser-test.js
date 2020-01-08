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
    field: 'board_approval_month',
    value: 'November'
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
  global[indexName].DISTINCT({
    field: 'totalamt'
  })
    .then(result => {
      t.looseEqual(result, [
        { field: 'totalamt', value: '0' },
        { field: 'totalamt', value: '10000000' },
        { field: 'totalamt', value: '130000000' },
        { field: 'totalamt', value: '13100000' },
        { field: 'totalamt', value: '160000000' },
        { field: 'totalamt', value: '200000000' },
        { field: 'totalamt', value: '500000000' },
        { field: 'totalamt', value: '6060000' }
      ])
    })
})

// TODO: make DISTINCT accept the structure {field: ..., value {gte: ..., lte: ...}}
test('can aggregate totalamt', t => {
  t.plan(1)
  global[indexName].DISTINCT({
    field: 'totalamt',
    gte: '',
    lte: '~'
  })
    .then(result => Promise.all(result.map(global[indexName].BUCKET)))
    .then(result => {
      t.looseEqual(result, [
        { field: 'totalamt', value: { gte: '0', lte: '0' }, _id: [ '52b213b38594d8a2be17c781', '52b213b38594d8a2be17c783', '52b213b38594d8a2be17c787' ] },
        { field: 'totalamt', value: { gte: '10000000', lte: '10000000' }, _id: [ '52b213b38594d8a2be17c785' ] },
        { field: 'totalamt', value: { gte: '130000000', lte: '130000000' }, _id: [ '52b213b38594d8a2be17c780' ] },
        { field: 'totalamt', value: { gte: '13100000', lte: '13100000' }, _id: [ '52b213b38594d8a2be17c784' ] },
        { field: 'totalamt', value: { gte: '160000000', lte: '160000000' }, _id: [ '52b213b38594d8a2be17c788' ] },
        { field: 'totalamt', value: { gte: '200000000', lte: '200000000' }, _id: [ '52b213b38594d8a2be17c789' ] },
        { field: 'totalamt', value: { gte: '500000000', lte: '500000000' }, _id: [ '52b213b38594d8a2be17c786' ] },
        { field: 'totalamt', value: { gte: '6060000', lte: '6060000' }, _id: [ '52b213b38594d8a2be17c782' ] }
      ])
    })
})

test('can aggregate totalamt (showing ID count)', t => {
  t.plan(1)
  global[indexName].DISTINCT({
    field: 'totalamt'
  })
    .then(result => Promise.all(result.map(global[indexName].BUCKET)))
    .then(result => t.looseEqual(result.map(item => ({
      field: item.field,
      value: item.value,
      count: item._id.length
    })), [
      { field: 'totalamt', value: { gte: '0', lte: '0' }, count: 3 },
      { field: 'totalamt', value: { gte: '10000000', lte: '10000000' }, count: 1 },
      { field: 'totalamt', value: { gte: '130000000', lte: '130000000' }, count: 1 },
      { field: 'totalamt', value: { gte: '13100000', lte: '13100000' }, count: 1 },
      { field: 'totalamt', value: { gte: '160000000', lte: '160000000' }, count: 1 },
      { field: 'totalamt', value: { gte: '200000000', lte: '200000000' }, count: 1 },
      { field: 'totalamt', value: { gte: '500000000', lte: '500000000' }, count: 1 },
      { field: 'totalamt', value: { gte: '6060000', lte: '6060000' }, count: 1 } 
    ]))
})

test('can aggregate totalamt in a given range (showing ID count)', t => {
  t.plan(1)
  global[indexName].DISTINCT({
    field: 'totalamt',
    value: {
      gte: '1',
      lte: '4'
    }
  })
    .then(result => Promise.all(result.map(global[indexName].BUCKET)))
    .then(result => t.looseEqual(result.map(item => ({
      field: item.field,
      value: item.value,
      count: item._id.length
    })), [
      { field: 'totalamt', value: { gte: '10000000', lte: '10000000' }, count: 1 },
      { field: 'totalamt', value: { gte: '130000000', lte: '130000000' }, count: 1 },
      { field: 'totalamt', value: { gte: '13100000', lte: '13100000' }, count: 1 },
      { field: 'totalamt', value: { gte: '160000000', lte: '160000000' }, count: 1 },
      { field: 'totalamt', value: { gte: '200000000', lte: '200000000' }, count: 1 }
    ]))          
})

test('can get documents with properties in a range', t => {
  t.plan(1)
  global[indexName].GET({
    field: 'totalamt',
    value: {
      gte: '1',
      lte: '4'
    }
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
    field: 'sectorcode',
    value: {
      gte: 'A',
      lte: 'G'
    }
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
    field: 'sectorcode',
      value: {
        gte: 'A',
        lte: 'G'
      }
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
    {
      field: 'sectorcode',
      value: {
        gte: 'B',
        lte: 'C'
      }
    },
    {
      field: 'sectorcode',
      value: {
        gte: 'K',
        lte: 'M'
      }
    }
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
    {
      field: 'sectorcode',
      value: {
        gte: 'E',
        lte: 'G'
      }
    },
    {
      field: 'sectorcode',
      value: {
        gte: 'Y',
        lte: 'Z'
      }
    }
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
      field: 'totalamt'
    }).then(result => Promise.all(result.map(global[indexName].BUCKET))),
    global[indexName].GET('board_approval_month:November')
  ).then(result => {
    t.looseEqual(result, [
      { field: 'totalamt', value: { gte: '0', lte: '0' }, _id: [ '52b213b38594d8a2be17c781' ] },
      { field: 'totalamt', value: { gte: '130000000', lte: '130000000' }, _id: [ '52b213b38594d8a2be17c780' ] },
      { field: 'totalamt', value: { gte: '6060000', lte: '6060000' }, _id: [ '52b213b38594d8a2be17c782' ] }
    ])
  })
})

test('can aggregate totalamt, on docs with "board_approval_month:October"', t => {
  t.plan(1)
  global[indexName].BUCKETFILTER(
    global[indexName].DISTINCT({
      field: 'totalamt'
    }).then(result => Promise.all(result.map(global[indexName].BUCKET))),
    global[indexName].GET('board_approval_month:October')
  ).then(result => {
    t.looseEqual(result, [
      { field: 'totalamt', value: { gte: '0', lte: '0' }, _id: [ '52b213b38594d8a2be17c783', '52b213b38594d8a2be17c787' ] },
      { field: 'totalamt', value: { gte: '10000000', lte: '10000000' }, _id: [ '52b213b38594d8a2be17c785' ] },
      { field: 'totalamt', value: { gte: '13100000', lte: '13100000' }, _id: [ '52b213b38594d8a2be17c784' ] },
      { field: 'totalamt', value: { gte: '160000000', lte: '160000000' }, _id: [ '52b213b38594d8a2be17c788' ] },
      { field: 'totalamt', value: { gte: '200000000', lte: '200000000' }, _id: [ '52b213b38594d8a2be17c789' ] },
      { field: 'totalamt', value: { gte: '500000000', lte: '500000000' }, _id: [ '52b213b38594d8a2be17c786' ] }
    ])
  })
})

test('can do bucket', t => {
  t.plan(1)
  global[indexName].BUCKET('totalamt:1').then(result => {
    t.looseEqual(result, {
      field: 'totalamt',
      value: { gte: '1', lte: '1' },
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
    { field: 'totalamt', value: { gte: '1', lte: '1' }, _id: [
      '52b213b38594d8a2be17c780',
      '52b213b38594d8a2be17c784',
      '52b213b38594d8a2be17c785',
      '52b213b38594d8a2be17c788'
    ] },
    { field: 'totalamt', value: { gte: '2', lte: '2' }, _id: [ '52b213b38594d8a2be17c789' ] },
    { field: 'totalamt', value: { gte: '3', lte: '3' }, _id: [] },
    { field: 'totalamt', value: { gte: '4', lte: '4' }, _id: [] },
    { field: 'totalamt', value: { gte: '5', lte: '5' }, _id: [ '52b213b38594d8a2be17c786' ] }
  ]))
})

test('can do custom buckets and agreggate, only count docs with "board_approval_month:October"', t => {
  t.plan(1)
  global[indexName].BUCKETFILTER(
    Promise.all(
      [1, 2, 3, 4, 5].map(item => global[indexName].BUCKET('totalamt:' + item))
    ),
    global[indexName].GET('board_approval_month:October')
  ).then(result => t.looseEqual(result, [
    { field: 'totalamt', value: { gte: '1', lte: '1' }, _id: [ '52b213b38594d8a2be17c784', '52b213b38594d8a2be17c785', '52b213b38594d8a2be17c788' ] },
    { field: 'totalamt', value: { gte: '2', lte: '2' }, _id: [ '52b213b38594d8a2be17c789' ] },
    { field: 'totalamt', value: { gte: '5', lte: '5' }, _id: [ '52b213b38594d8a2be17c786' ] }
  ]))
})
