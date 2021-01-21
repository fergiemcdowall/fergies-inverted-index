const fii = require('../../')
const test = require('tape')
const wbd = require('world-bank-dataset')

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'wb2'

test('create index', t => {
  t.plan(1)
  fii({ name: indexName }).then(db => {
    global[indexName] = db
    t.ok(db, !undefined)
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
      t.deepEqual(result, [
        { _id: '52b213b38594d8a2be17c780', _match: ['board_approval_month:November'] },
        { _id: '52b213b38594d8a2be17c781', _match: ['board_approval_month:November'] },
        { _id: '52b213b38594d8a2be17c782', _match: ['board_approval_month:November'] }
      ])
    })
})

test('can GET with object', t => {
  t.plan(1)
  global[indexName].GET({
    FIELD: 'board_approval_month',
    VALUE: 'November'
  })
    .then(result => {
      t.deepEqual(result, [
        { _id: '52b213b38594d8a2be17c780', _match: ['board_approval_month:November'] },
        { _id: '52b213b38594d8a2be17c781', _match: ['board_approval_month:November'] },
        { _id: '52b213b38594d8a2be17c782', _match: ['board_approval_month:November'] }
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
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c781',
          _match: [
            'sectorcode:BS',
            'sectorcode:BZ',
            'board_approval_month:November'
          ]
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
    t.deepEqual(result, [
      { _id: '52b213b38594d8a2be17c780', _match: ['sectorcode:BS', 'board_approval_month:November'] },
      { _id: '52b213b38594d8a2be17c781', _match: ['sectorcode:BS', 'sectorcode:BZ', 'board_approval_month:November'] },
      { _id: '52b213b38594d8a2be17c789', _match: ['sectorcode:BZ'] },
      { _id: '52b213b38594d8a2be17c782', _match: ['board_approval_month:November'] }
    ])
  })
})

test('can do some OR searches', t => {
  t.plan(1)
  global[indexName].OR(
    'sectorcode:BZ',
    'sectorcode:TI'
  ).then(result => {
    t.deepEqual(result, [
      { _id: '52b213b38594d8a2be17c781', _match: ['sectorcode:BZ'] },
      { _id: '52b213b38594d8a2be17c789', _match: ['sectorcode:BZ'] },
      { _id: '52b213b38594d8a2be17c782', _match: ['sectorcode:TI'] },
      { _id: '52b213b38594d8a2be17c786', _match: ['sectorcode:TI'] },
      { _id: '52b213b38594d8a2be17c788', _match: ['sectorcode:TI'] }
    ])
  })
})

test('can do AND with nested OR', t => {
  t.plan(1)
  global[indexName].AND(
    'board_approval_month:November',
    global[indexName].OR('sectorcode:BZ', 'sectorcode:TI')
  ).then(result => {
    t.deepEqual(result, [
      {
        _id: '52b213b38594d8a2be17c781',
        _match: ['board_approval_month:November', 'sectorcode:BZ']
      },
      {
        _id: '52b213b38594d8a2be17c782',
        _match: ['board_approval_month:November', 'sectorcode:TI']
      }
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
    t.deepEqual(result, [
      {
        _id: '52b213b38594d8a2be17c786',
        _match: ['board_approval_month:October', 'sectorcode:TI']
      },
      {
        _id: '52b213b38594d8a2be17c788',
        _match: ['board_approval_month:October', 'sectorcode:TI']
      },
      {
        _id: '52b213b38594d8a2be17c789',
        _match: ['board_approval_month:October', 'sectorcode:BZ', 'sectorcode:BC']
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
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c781',
          _match: ['board_approval_month:November', 'sectorcode:BZ'],
          _object: {
            _id: '52b213b38594d8a2be17c781',
            sectorcode: ['BZ', 'BS'],
            board_approval_month: 'November',
            impagency: 'MINISTRY OF FINANCE',
            majorsector_percent: [
              {
                Name: 'Public Administration, Law, and Justice',
                Percent: 70
              },
              {
                Name: 'Public Administration, Law, and Justice',
                Percent: 30
              }
            ],
            mjsector_namecode: [
              {
                name: 'Public Administration, Law, and Justice',
                code: 'BX'
              }, {
                name: 'Public Administration, Law, and Justice',
                code: 'BX'
              }
            ],
            sector_namecode: [
              {
                name: 'Public administration- Other social services',
                code: 'BS'
              },
              {
                name: 'General public administration sector',
                code: 'BZ'
              }
            ],
            totalamt: 0
          }
        },
        {
          _id: '52b213b38594d8a2be17c782',
          _match: ['board_approval_month:November', 'sectorcode:TI'],
          _object: {
            _id: '52b213b38594d8a2be17c782',
            sectorcode: ['TI'],
            board_approval_month: 'November',
            impagency: 'MINISTRY OF TRANSPORT AND COMMUNICATIONS',
            majorsector_percent: [{
              Name: 'Transportation',
              Percent: 100
            }
            ],
            mjsector_namecode: [
              {
                name: 'Transportation',
                code: 'TX'
              }
            ],
            sector_namecode: [
              {
                name: 'Rural and Inter-Urban Roads and Highways',
                code: 'TI'
              }
            ],
            totalamt: 6060000
          }
        }
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
      t.deepEqual(result, [

        { _id: '52b213b38594d8a2be17c787', _match: ['board_approval_month:October', 'sectorcode:LR'], _object: { _id: '52b213b38594d8a2be17c787', sectorcode: ['LR'], board_approval_month: 'October', impagency: 'NATIONAL ENERGY ADMINISTRATION', majorsector_percent: [{ Name: 'Energy and mining', Percent: 100 }], mjsector_namecode: [{ name: 'Energy and mining', code: 'LX' }], sector_namecode: [{ name: 'Other Renewable Energy', code: 'LR' }], totalamt: 0 } },
        { _id: '52b213b38594d8a2be17c789', _match: ['board_approval_month:October', 'sectorcode:BC', 'sectorcode:BM'], _object: { _id: '52b213b38594d8a2be17c789', sectorcode: ['BM', 'BC', 'BZ'], board_approval_month: 'October', impagency: 'MINISTRY OF FINANCE', majorsector_percent: [{ Name: 'Public Administration, Law, and Justice', Percent: 34 }, { Name: 'Public Administration, Law, and Justice', Percent: 33 }, { Name: 'Public Administration, Law, and Justice', Percent: 33 }], mjsector_namecode: [{ name: 'Public Administration, Law, and Justice', code: 'BX' }, { name: 'Public Administration, Law, and Justice', code: 'BX' }, { name: 'Public Administration, Law, and Justice', code: 'BX' }], sector_namecode: [{ name: 'General public administration sector', code: 'BZ' }, { name: 'Central government administration', code: 'BC' }, { name: 'Public administration- Information and communications', code: 'BM' }], totalamt: 200000000 } }

      ])
    })
})

test('can get highest VALUE of totalamt (MAX)', t => {
  t.plan(1)
  global[indexName].MAX({ FIELD: 'totalamt' })
    .then(result => {
      t.equal(result, '6060000')
    })
})

test('can get lowest VALUE of totalamt (MIN)', t => {
  t.plan(1)
  global[indexName].MIN({ FIELD: 'totalamt' })
    .then(result => {
      t.equal(result, '0')
    })
})

test('can get all VALUEs of totalamt (DIST)', t => {
  t.plan(1)
  global[indexName].DISTINCT({
    FIELD: 'totalamt'
  })
    .then(result => {
      t.deepEqual(result, [
        { FIELD: 'totalamt', VALUE: '0' },
        { FIELD: 'totalamt', VALUE: '10000000' },
        { FIELD: 'totalamt', VALUE: '130000000' },
        { FIELD: 'totalamt', VALUE: '13100000' },
        { FIELD: 'totalamt', VALUE: '160000000' },
        { FIELD: 'totalamt', VALUE: '200000000' },
        { FIELD: 'totalamt', VALUE: '500000000' },
        { FIELD: 'totalamt', VALUE: '6060000' }
      ])
    })
})

// TODO: make DISTINCT accept the structure {FIELD: ..., VALUE {GTE: ..., LTE: ...}}
test('can aggregate totalamt', t => {
  t.plan(1)
  global[indexName].DISTINCT({
    FIELD: 'totalamt',
    VALUE: {
      GTE: '',
      LTE: '~'
    }
  })
    .then(result => Promise.all(result.map(global[indexName].BUCKET)))
    .then(result => {
      t.deepEqual(result, [
        { FIELD: ['totalamt'], VALUE: { GTE: '0', LTE: '0' }, _id: ['52b213b38594d8a2be17c781', '52b213b38594d8a2be17c783', '52b213b38594d8a2be17c787'] },
        { FIELD: ['totalamt'], VALUE: { GTE: '10000000', LTE: '10000000' }, _id: ['52b213b38594d8a2be17c785'] },
        { FIELD: ['totalamt'], VALUE: { GTE: '130000000', LTE: '130000000' }, _id: ['52b213b38594d8a2be17c780'] },
        { FIELD: ['totalamt'], VALUE: { GTE: '13100000', LTE: '13100000' }, _id: ['52b213b38594d8a2be17c784'] },
        { FIELD: ['totalamt'], VALUE: { GTE: '160000000', LTE: '160000000' }, _id: ['52b213b38594d8a2be17c788'] },
        { FIELD: ['totalamt'], VALUE: { GTE: '200000000', LTE: '200000000' }, _id: ['52b213b38594d8a2be17c789'] },
        { FIELD: ['totalamt'], VALUE: { GTE: '500000000', LTE: '500000000' }, _id: ['52b213b38594d8a2be17c786'] },
        { FIELD: ['totalamt'], VALUE: { GTE: '6060000', LTE: '6060000' }, _id: ['52b213b38594d8a2be17c782'] }
      ])
    })
})

test('can aggregate totalamt (showing ID count)', t => {
  t.plan(1)
  global[indexName].DISTINCT({
    FIELD: 'totalamt'
  })
    .then(result => Promise.all(result.map(global[indexName].BUCKET)))
    .then(result => t.deepEqual(result.map(item => ({
      FIELD: item.FIELD,
      VALUE: item.VALUE,
      count: item._id.length
    })), [
      { FIELD: ['totalamt'], VALUE: { GTE: '0', LTE: '0' }, count: 3 },
      { FIELD: ['totalamt'], VALUE: { GTE: '10000000', LTE: '10000000' }, count: 1 },
      { FIELD: ['totalamt'], VALUE: { GTE: '130000000', LTE: '130000000' }, count: 1 },
      { FIELD: ['totalamt'], VALUE: { GTE: '13100000', LTE: '13100000' }, count: 1 },
      { FIELD: ['totalamt'], VALUE: { GTE: '160000000', LTE: '160000000' }, count: 1 },
      { FIELD: ['totalamt'], VALUE: { GTE: '200000000', LTE: '200000000' }, count: 1 },
      { FIELD: ['totalamt'], VALUE: { GTE: '500000000', LTE: '500000000' }, count: 1 },
      { FIELD: ['totalamt'], VALUE: { GTE: '6060000', LTE: '6060000' }, count: 1 }
    ]))
})

test('can aggregate totalamt in a given range (showing ID count)', t => {
  t.plan(1)
  global[indexName].DISTINCT({
    FIELD: 'totalamt',
    VALUE: {
      GTE: '1',
      LTE: '4'
    }
  })
    .then(result => Promise.all(result.map(global[indexName].BUCKET)))
    .then(result => t.deepEqual(result.map(item => ({
      FIELD: item.FIELD,
      VALUE: item.VALUE,
      count: item._id.length
    })), [
      { FIELD: ['totalamt'], VALUE: { GTE: '10000000', LTE: '10000000' }, count: 1 },
      { FIELD: ['totalamt'], VALUE: { GTE: '130000000', LTE: '130000000' }, count: 1 },
      { FIELD: ['totalamt'], VALUE: { GTE: '13100000', LTE: '13100000' }, count: 1 },
      { FIELD: ['totalamt'], VALUE: { GTE: '160000000', LTE: '160000000' }, count: 1 },
      { FIELD: ['totalamt'], VALUE: { GTE: '200000000', LTE: '200000000' }, count: 1 }
    ]))
})

test('can get documents with properties in a range', t => {
  t.plan(1)
  global[indexName].GET({
    FIELD: 'totalamt',
    VALUE: {
      GTE: '1',
      LTE: '4'
    }
  }).then(result => {
    t.deepEqual(result, [
      { _id: '52b213b38594d8a2be17c785', _match: ['totalamt:10000000'] },
      { _id: '52b213b38594d8a2be17c780', _match: ['totalamt:130000000'] },
      { _id: '52b213b38594d8a2be17c784', _match: ['totalamt:13100000'] },
      { _id: '52b213b38594d8a2be17c788', _match: ['totalamt:160000000'] },
      { _id: '52b213b38594d8a2be17c789', _match: ['totalamt:200000000'] }])
  })
})

test('can get documents with properties in a range', t => {
  t.plan(1)
  global[indexName].GET({
    FIELD: 'sectorcode',
    VALUE: {
      GTE: 'A',
      LTE: 'G'
    }
  }).then(result => {
    t.deepEqual(result, [
      {
        _id: '52b213b38594d8a2be17c789',
        _match: [
          'sectorcode:BC',
          'sectorcode:BM',
          'sectorcode:BZ']
      },
      {
        _id: '52b213b38594d8a2be17c780',
        _match: [
          'sectorcode:BS',
          'sectorcode:EP',
          'sectorcode:ES',
          'sectorcode:ET']
      },
      {
        _id: '52b213b38594d8a2be17c781',
        _match: [
          'sectorcode:BS',
          'sectorcode:BZ']
      },
      {
        _id: '52b213b38594d8a2be17c784',
        _match: [
          'sectorcode:FH']
      }
    ])
  })
})

test('can get documents with properties in a range and the NOT some out', t => {
  t.plan(1)
  global[indexName].NOT(
    global[indexName].GET({
      FIELD: 'sectorcode',
      VALUE: {
        GTE: 'A',
        LTE: 'G'
      }
    }),
    'sectorcode:YZ'
  ).then(result => {
    t.deepEqual(result, [
      {
        _id: '52b213b38594d8a2be17c789',
        _match: [
          'sectorcode:BC',
          'sectorcode:BM',
          'sectorcode:BZ']
      },
      {
        _id: '52b213b38594d8a2be17c780',
        _match: [
          'sectorcode:BS',
          'sectorcode:EP',
          'sectorcode:ES',
          'sectorcode:ET']
      },
      {
        _id: '52b213b38594d8a2be17c781',
        _match: [
          'sectorcode:BS',
          'sectorcode:BZ']
      }
    ])
  })
})

test('can get documents with properties in a range and the NOT some out', t => {
  t.plan(1)
  global[indexName].NOT(
    'sectorcode:BS',
    'sectorcode:ET'
  ).then(result => {
    t.deepEqual(result, [
      { _id: '52b213b38594d8a2be17c781', _match: ['sectorcode:BS'] }
    ])
  })
})

test('can do OR with GTE/LTE', t => {
  t.plan(1)
  global[indexName].OR(
    {
      FIELD: 'sectorcode',
      VALUE: {
        GTE: 'B',
        LTE: 'C'
      }
    },
    {
      FIELD: 'sectorcode',
      VALUE: {
        GTE: 'K',
        LTE: 'M'
      }
    }
  ).then(result => {
    t.deepEqual(result, [
      {
        _id: '52b213b38594d8a2be17c789',
        _match: [
          'sectorcode:BC',
          'sectorcode:BM',
          'sectorcode:BZ'
        ]
      },
      {
        _id: '52b213b38594d8a2be17c780',
        _match: [
          'sectorcode:BS'
        ]
      },
      {
        _id: '52b213b38594d8a2be17c781',
        _match: [
          'sectorcode:BS',
          'sectorcode:BZ'
        ]
      },
      {
        _id: '52b213b38594d8a2be17c787',
        _match: [
          'sectorcode:LR'
        ]
      }
    ])
  })
})

test('can do AND with GTE/LTE', t => {
  t.plan(1)
  global[indexName].AND(
    {
      FIELD: 'sectorcode',
      VALUE: {
        GTE: 'E',
        LTE: 'G'
      }
    },
    {
      FIELD: 'sectorcode',
      VALUE: {
        GTE: 'Y',
        LTE: 'Z'
      }
    }
  ).then(result => {
    t.deepEqual(result, [
      {
        _id: '52b213b38594d8a2be17c784',
        _match: [
          'sectorcode:FH',
          'sectorcode:YW',
          'sectorcode:YZ'
        ]
      }
    ])
  })
})

test('can aggregate totalamt', t => {
  t.plan(1)
  global[indexName].AGGREGATE({
    // global[indexName].DISTINCT({
    //   FIELD: 'totalamt'
    // }).then(result => result.map(global[indexName].BUCKET)),
    FACETS: global[indexName].FACETS({
      FIELD: 'totalamt'
    }),
    QUERY: global[indexName].GET('board_approval_month:November')
  }).then(result => {
    t.deepEqual(result, {
      BUCKETS: [],
      FACETS: [
        { FIELD: 'totalamt', VALUE: '0', _id: ['52b213b38594d8a2be17c781'] },
        { FIELD: 'totalamt', VALUE: '10000000', _id: [] },
        { FIELD: 'totalamt', VALUE: '130000000', _id: ['52b213b38594d8a2be17c780'] },
        { FIELD: 'totalamt', VALUE: '13100000', _id: [] },
        { FIELD: 'totalamt', VALUE: '160000000', _id: [] },
        { FIELD: 'totalamt', VALUE: '200000000', _id: [] },
        { FIELD: 'totalamt', VALUE: '500000000', _id: [] },
        { FIELD: 'totalamt', VALUE: '6060000', _id: ['52b213b38594d8a2be17c782'] }
      ],
      RESULT: [
        { _id: '52b213b38594d8a2be17c780', _match: ['board_approval_month:November'] },
        { _id: '52b213b38594d8a2be17c781', _match: ['board_approval_month:November'] },
        { _id: '52b213b38594d8a2be17c782', _match: ['board_approval_month:November'] }
      ]
    })
  })
})

test('can aggregate totalamt, on docs with "board_approval_month:October"', t => {
  t.plan(1)
  global[indexName].AGGREGATE({
    FACETS: global[indexName].FACETS({
      FIELD: 'totalamt'
    }),
    QUERY: global[indexName].GET('board_approval_month:October')
  }).then(result => {
    t.deepEqual(result, {
      BUCKETS: [],
      FACETS: [
        { FIELD: 'totalamt', VALUE: '0', _id: ['52b213b38594d8a2be17c783', '52b213b38594d8a2be17c787'] },
        { FIELD: 'totalamt', VALUE: '10000000', _id: ['52b213b38594d8a2be17c785'] },
        { FIELD: 'totalamt', VALUE: '130000000', _id: [] },
        { FIELD: 'totalamt', VALUE: '13100000', _id: ['52b213b38594d8a2be17c784'] },
        { FIELD: 'totalamt', VALUE: '160000000', _id: ['52b213b38594d8a2be17c788'] },
        { FIELD: 'totalamt', VALUE: '200000000', _id: ['52b213b38594d8a2be17c789'] },
        { FIELD: 'totalamt', VALUE: '500000000', _id: ['52b213b38594d8a2be17c786'] },
        { FIELD: 'totalamt', VALUE: '6060000', _id: [] }],
      RESULT: [
        { _id: '52b213b38594d8a2be17c783', _match: ['board_approval_month:October'] },
        { _id: '52b213b38594d8a2be17c784', _match: ['board_approval_month:October'] },
        { _id: '52b213b38594d8a2be17c785', _match: ['board_approval_month:October'] },
        { _id: '52b213b38594d8a2be17c786', _match: ['board_approval_month:October'] },
        { _id: '52b213b38594d8a2be17c787', _match: ['board_approval_month:October'] },
        { _id: '52b213b38594d8a2be17c788', _match: ['board_approval_month:October'] },
        { _id: '52b213b38594d8a2be17c789', _match: ['board_approval_month:October'] }
      ]
    })
  })
})

test('can do bucket', t => {
  t.plan(1)
  global[indexName].BUCKET('totalamt:1').then(result => {
    t.deepEqual(result, {
      FIELD: ['totalamt'],
      VALUE: { GTE: '1', LTE: '1' },
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
  ).then(result => t.deepEqual(result, [
    {
      FIELD: ['totalamt'],
      VALUE: { GTE: '1', LTE: '1' },
      _id: [
        '52b213b38594d8a2be17c780',
        '52b213b38594d8a2be17c784',
        '52b213b38594d8a2be17c785',
        '52b213b38594d8a2be17c788'
      ]
    },
    { FIELD: ['totalamt'], VALUE: { GTE: '2', LTE: '2' }, _id: ['52b213b38594d8a2be17c789'] },
    { FIELD: ['totalamt'], VALUE: { GTE: '3', LTE: '3' }, _id: [] },
    { FIELD: ['totalamt'], VALUE: { GTE: '4', LTE: '4' }, _id: [] },
    { FIELD: ['totalamt'], VALUE: { GTE: '5', LTE: '5' }, _id: ['52b213b38594d8a2be17c786'] }
  ]))
})

test('can do custom buckets and agreggate, only count docs with "board_approval_month:October"', t => {
  t.plan(1)
  global[indexName].AGGREGATE({
    BUCKETS: global[indexName].BUCKETS(
      ...[1, 2, 3, 4, 5].map(
        //        item => global[indexName].BUCKET('totalamt:' + item)
        item => ({
          FIELD: 'totalamt',
          VALUE: item + ''
        })
      )
    ),
    QUERY: global[indexName].GET('board_approval_month:October')
  }).then(result => t.deepEqual(result, {
    BUCKETS: [
      { FIELD: ['totalamt'], VALUE: { GTE: '1', LTE: '1' }, _id: ['52b213b38594d8a2be17c784', '52b213b38594d8a2be17c785', '52b213b38594d8a2be17c788'] },
      { FIELD: ['totalamt'], VALUE: { GTE: '2', LTE: '2' }, _id: ['52b213b38594d8a2be17c789'] },
      { FIELD: ['totalamt'], VALUE: { GTE: '3', LTE: '3' }, _id: [] },
      { FIELD: ['totalamt'], VALUE: { GTE: '4', LTE: '4' }, _id: [] },
      { FIELD: ['totalamt'], VALUE: { GTE: '5', LTE: '5' }, _id: ['52b213b38594d8a2be17c786'] }
    ],
    FACETS: [],
    RESULT: [
      { _id: '52b213b38594d8a2be17c783', _match: ['board_approval_month:October'] },
      { _id: '52b213b38594d8a2be17c784', _match: ['board_approval_month:October'] },
      { _id: '52b213b38594d8a2be17c785', _match: ['board_approval_month:October'] },
      { _id: '52b213b38594d8a2be17c786', _match: ['board_approval_month:October'] },
      { _id: '52b213b38594d8a2be17c787', _match: ['board_approval_month:October'] },
      { _id: '52b213b38594d8a2be17c788', _match: ['board_approval_month:October'] },
      { _id: '52b213b38594d8a2be17c789', _match: ['board_approval_month:October'] }
    ]
  }))
})
