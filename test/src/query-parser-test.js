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
  // console.log(
  //   JSON.stringify(
  //     data
  //       .map(item => ({
  //         board_approval_month: item.board_approval_month,
  //         id: item._id,
  //         totalamt: item.totalamt
  //       }))
  //       .sort(),
  //     null,
  //     2
  //   )
  // )
  t.plan(1)
  global[indexName].PUT(data).then(t.pass)
})

test('can GET with string', t => {
  t.plan(1)
  global[indexName].GET('board_approval_month:November').then(result => {
    t.deepEqual(result, [
      {
        _id: '52b213b38594d8a2be17c780',
        _match: [
          {
            FIELD: 'board_approval_month',
            VALUE: 'November'
          }
        ]
      },
      {
        _id: '52b213b38594d8a2be17c781',
        _match: [
          {
            FIELD: 'board_approval_month',
            VALUE: 'November'
          }
        ]
      },
      {
        _id: '52b213b38594d8a2be17c782',
        _match: [
          {
            FIELD: 'board_approval_month',
            VALUE: 'November'
          }
        ]
      }
    ])
  })
})

test('can GET with object', t => {
  t.plan(1)
  global[indexName]
    .GET({
      FIELD: 'board_approval_month',
      VALUE: 'November'
    })
    .then(result => {
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

test('can do some AND searches', t => {
  t.plan(1)
  global[indexName]
    .AND('sectorcode:BS', 'sectorcode:BZ', 'board_approval_month:November')
    .then(result => {
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c781',
          _match: [
            { FIELD: 'sectorcode', VALUE: 'BS' },
            { FIELD: 'sectorcode', VALUE: 'BZ' },
            { FIELD: 'board_approval_month', VALUE: 'November' }
          ]
        }
      ])
    })
})

test('can do some OR searches', t => {
  t.plan(1)
  global[indexName]
    .OR('sectorcode:BS', 'sectorcode:BZ', 'board_approval_month:November')
    .then(result => {
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c780',
          _match: [
            { FIELD: 'sectorcode', VALUE: 'BS' },
            { FIELD: 'board_approval_month', VALUE: 'November' }
          ]
        },
        {
          _id: '52b213b38594d8a2be17c781',
          _match: [
            { FIELD: 'sectorcode', VALUE: 'BS' },
            { FIELD: 'sectorcode', VALUE: 'BZ' },
            { FIELD: 'board_approval_month', VALUE: 'November' }
          ]
        },
        {
          _id: '52b213b38594d8a2be17c789',
          _match: [{ FIELD: 'sectorcode', VALUE: 'BZ' }]
        },
        {
          _id: '52b213b38594d8a2be17c782',
          _match: [{ FIELD: 'board_approval_month', VALUE: 'November' }]
        }
      ])
    })
})

test('can do some OR searches', t => {
  t.plan(1)
  global[indexName].OR('sectorcode:BZ', 'sectorcode:TI').then(result => {
    t.deepEqual(result, [
      {
        _id: '52b213b38594d8a2be17c781',
        _match: [{ FIELD: 'sectorcode', VALUE: 'BZ' }]
      },
      {
        _id: '52b213b38594d8a2be17c789',
        _match: [{ FIELD: 'sectorcode', VALUE: 'BZ' }]
      },
      {
        _id: '52b213b38594d8a2be17c782',
        _match: [{ FIELD: 'sectorcode', VALUE: 'TI' }]
      },
      {
        _id: '52b213b38594d8a2be17c786',
        _match: [{ FIELD: 'sectorcode', VALUE: 'TI' }]
      },
      {
        _id: '52b213b38594d8a2be17c788',
        _match: [{ FIELD: 'sectorcode', VALUE: 'TI' }]
      }
    ])
  })
})

test('can do AND with nested OR', t => {
  t.plan(1)
  global[indexName]
    .AND(
      'board_approval_month:November',
      global[indexName].OR('sectorcode:BZ', 'sectorcode:TI')
    )
    .then(result => {
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c781',
          _match: [
            { FIELD: 'board_approval_month', VALUE: 'November' },
            { FIELD: 'sectorcode', VALUE: 'BZ' }
          ]
        },
        {
          _id: '52b213b38594d8a2be17c782',
          _match: [
            { FIELD: 'board_approval_month', VALUE: 'November' },
            { FIELD: 'sectorcode', VALUE: 'TI' }
          ]
        }
      ])
    })
})

test('can do AND with embedded AND', t => {
  t.plan(1)
  global[indexName]
    .AND(
      'board_approval_month:October',
      global[indexName].OR(
        global[indexName].AND('sectorcode:BZ', 'sectorcode:BC'),
        'sectorcode:TI'
      )
    )
    .then(result => {
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c786',
          _match: [
            {
              FIELD: 'board_approval_month',
              VALUE: 'October'
            },
            { FIELD: 'sectorcode', VALUE: 'TI' }
          ]
        },
        {
          _id: '52b213b38594d8a2be17c788',
          _match: [
            {
              FIELD: 'board_approval_month',
              VALUE: 'October'
            },
            { FIELD: 'sectorcode', VALUE: 'TI' }
          ]
        },
        {
          _id: '52b213b38594d8a2be17c789',
          _match: [
            {
              FIELD: 'board_approval_month',
              VALUE: 'October'
            },
            { FIELD: 'sectorcode', VALUE: 'BZ' },
            { FIELD: 'sectorcode', VALUE: 'BC' }
          ]
        }
      ])
    })
})

test('can do AND', t => {
  t.plan(1)
  global[indexName]
    .AND(
      'board_approval_month:November',
      global[indexName].OR('sectorcode:BZ', 'sectorcode:TI')
    )
    .then(global[indexName].OBJECT)
    .then(result => {
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c781',
          _match: [
            { FIELD: 'board_approval_month', VALUE: 'November' },
            { FIELD: 'sectorcode', VALUE: 'BZ' }
          ],
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
              },
              {
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
          _match: [
            { FIELD: 'board_approval_month', VALUE: 'November' },
            { FIELD: 'sectorcode', VALUE: 'TI' }
          ],
          _object: {
            _id: '52b213b38594d8a2be17c782',
            sectorcode: ['TI'],
            board_approval_month: 'November',
            impagency: 'MINISTRY OF TRANSPORT AND COMMUNICATIONS',
            majorsector_percent: [
              {
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
  global[indexName]
    .AND(
      'board_approval_month:October',
      global[indexName].OR(
        'sectorcode:LR',
        global[indexName].AND('sectorcode:BC', 'sectorcode:BM')
      )
    )
    .then(global[indexName].OBJECT)
    .then(result => {
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c787',
          _match: [
            { FIELD: 'board_approval_month', VALUE: 'October' },
            { FIELD: 'sectorcode', VALUE: 'LR' }
          ],
          _object: {
            _id: '52b213b38594d8a2be17c787',
            sectorcode: ['LR'],
            board_approval_month: 'October',
            impagency: 'NATIONAL ENERGY ADMINISTRATION',
            majorsector_percent: [{ Name: 'Energy and mining', Percent: 100 }],
            mjsector_namecode: [{ name: 'Energy and mining', code: 'LX' }],
            sector_namecode: [{ name: 'Other Renewable Energy', code: 'LR' }],
            totalamt: 0
          }
        },
        {
          _id: '52b213b38594d8a2be17c789',
          _match: [
            { FIELD: 'board_approval_month', VALUE: 'October' },
            { FIELD: 'sectorcode', VALUE: 'BC' },
            { FIELD: 'sectorcode', VALUE: 'BM' }
          ],
          _object: {
            _id: '52b213b38594d8a2be17c789',
            sectorcode: ['BM', 'BC', 'BZ'],
            board_approval_month: 'October',
            impagency: 'MINISTRY OF FINANCE',
            majorsector_percent: [
              { Name: 'Public Administration, Law, and Justice', Percent: 34 },
              { Name: 'Public Administration, Law, and Justice', Percent: 33 },
              { Name: 'Public Administration, Law, and Justice', Percent: 33 }
            ],
            mjsector_namecode: [
              { name: 'Public Administration, Law, and Justice', code: 'BX' },
              { name: 'Public Administration, Law, and Justice', code: 'BX' },
              { name: 'Public Administration, Law, and Justice', code: 'BX' }
            ],
            sector_namecode: [
              { name: 'General public administration sector', code: 'BZ' },
              { name: 'Central government administration', code: 'BC' },
              {
                name: 'Public administration- Information and communications',
                code: 'BM'
              }
            ],
            totalamt: 200000000
          }
        }
      ])
    })
})

test('can get highest VALUE of totalamt (MAX)', t => {
  t.plan(1)
  global[indexName].MAX({ FIELD: 'totalamt' }).then(result => {
    t.equal(result, 500000000)
  })
})

test('can get lowest VALUE of totalamt (MIN)', t => {
  t.plan(1)
  global[indexName].MIN({ FIELD: 'totalamt' }).then(result => {
    t.equal(result, 0)
  })
})

test('can get all VALUEs of totalamt (DIST)', t => {
  t.plan(1)
  global[indexName]
    .DISTINCT({
      FIELD: 'totalamt'
    })
    .then(result => {
      t.deepEqual(result, [
        { FIELD: 'totalamt', VALUE: 0 },
        { FIELD: 'totalamt', VALUE: 6060000 },
        { FIELD: 'totalamt', VALUE: 10000000 },
        { FIELD: 'totalamt', VALUE: 13100000 },
        { FIELD: 'totalamt', VALUE: 130000000 },
        { FIELD: 'totalamt', VALUE: 160000000 },
        { FIELD: 'totalamt', VALUE: 200000000 },
        { FIELD: 'totalamt', VALUE: 500000000 }
      ])
    })
})

// TODO: make DISTINCT accept the structure {FIELD: ..., VALUE {GTE: ..., LTE: ...}}
test('can aggregate totalamt', t => {
  t.plan(1)
  global[indexName]
    .DISTINCT({
      FIELD: 'totalamt',
      VALUE: {}
    })
    .then(result => {
      return Promise.all(result.map(global[indexName].BUCKET))
    })
    .then(result => {
      t.deepEqual(result, [
        {
          FIELD: ['totalamt'],
          VALUE: { GTE: 0, LTE: 0 },
          _id: [
            '52b213b38594d8a2be17c781',
            '52b213b38594d8a2be17c783',
            '52b213b38594d8a2be17c787'
          ]
        },
        {
          FIELD: ['totalamt'],
          VALUE: { GTE: 6060000, LTE: 6060000 },
          _id: ['52b213b38594d8a2be17c782']
        },
        {
          FIELD: ['totalamt'],
          VALUE: { GTE: 10000000, LTE: 10000000 },
          _id: ['52b213b38594d8a2be17c785']
        },
        {
          FIELD: ['totalamt'],
          VALUE: { GTE: 13100000, LTE: 13100000 },
          _id: ['52b213b38594d8a2be17c784']
        },
        {
          FIELD: ['totalamt'],
          VALUE: { GTE: 130000000, LTE: 130000000 },
          _id: ['52b213b38594d8a2be17c780']
        },
        {
          FIELD: ['totalamt'],
          VALUE: { GTE: 160000000, LTE: 160000000 },
          _id: ['52b213b38594d8a2be17c788']
        },
        {
          FIELD: ['totalamt'],
          VALUE: { GTE: 200000000, LTE: 200000000 },
          _id: ['52b213b38594d8a2be17c789']
        },
        {
          FIELD: ['totalamt'],
          VALUE: { GTE: 500000000, LTE: 500000000 },
          _id: ['52b213b38594d8a2be17c786']
        }
      ])
    })
})

test('can aggregate totalamt (showing ID count)', t => {
  t.plan(1)
  global[indexName]
    .DISTINCT({
      FIELD: 'totalamt'
    })
    .then(result => Promise.all(result.map(global[indexName].BUCKET)))
    .then(result =>
      t.deepEqual(
        result.map(item => ({
          FIELD: item.FIELD,
          VALUE: item.VALUE,
          count: item._id.length
        })),
        [
          { FIELD: ['totalamt'], VALUE: { GTE: 0, LTE: 0 }, count: 3 },
          {
            FIELD: ['totalamt'],
            VALUE: { GTE: 6060000, LTE: 6060000 },
            count: 1
          },
          {
            FIELD: ['totalamt'],
            VALUE: { GTE: 10000000, LTE: 10000000 },
            count: 1
          },
          {
            FIELD: ['totalamt'],
            VALUE: { GTE: 13100000, LTE: 13100000 },
            count: 1
          },
          {
            FIELD: ['totalamt'],
            VALUE: { GTE: 130000000, LTE: 130000000 },
            count: 1
          },
          {
            FIELD: ['totalamt'],
            VALUE: { GTE: 160000000, LTE: 160000000 },
            count: 1
          },
          {
            FIELD: ['totalamt'],
            VALUE: { GTE: 200000000, LTE: 200000000 },
            count: 1
          },
          {
            FIELD: ['totalamt'],
            VALUE: { GTE: 500000000, LTE: 500000000 },
            count: 1
          }
        ]
      )
    )
})

test('can aggregate totalamt in a given range (showing ID count)', t => {
  t.plan(1)
  global[indexName]
    .DISTINCT({
      FIELD: 'totalamt',
      VALUE: {
        GTE: 1,
        LTE: 190000000
      }
    })
    .then(result => Promise.all(result.map(global[indexName].BUCKET)))
    .then(result =>
      t.deepEqual(
        result.map(item => ({
          FIELD: item.FIELD,
          VALUE: item.VALUE,
          count: item._id.length
        })),
        [
          {
            FIELD: ['totalamt'],
            VALUE: { GTE: 6060000, LTE: 6060000 },
            count: 1
          },
          {
            FIELD: ['totalamt'],
            VALUE: { GTE: 10000000, LTE: 10000000 },
            count: 1
          },
          {
            FIELD: ['totalamt'],
            VALUE: { GTE: 13100000, LTE: 13100000 },
            count: 1
          },
          {
            FIELD: ['totalamt'],
            VALUE: { GTE: 130000000, LTE: 130000000 },
            count: 1
          },
          {
            FIELD: ['totalamt'],
            VALUE: { GTE: 160000000, LTE: 160000000 },
            count: 1
          }
        ]
      )
    )
})

test('can get documents with properties in a range', t => {
  t.plan(1)
  global[indexName]
    .GET({
      FIELD: 'totalamt',
      VALUE: {
        GTE: 1,
        LTE: 190000000
      }
    })
    .then(result => {
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c782',
          _match: [{ FIELD: 'totalamt', VALUE: 6060000 }]
        },
        {
          _id: '52b213b38594d8a2be17c785',
          _match: [{ FIELD: 'totalamt', VALUE: 10000000 }]
        },
        {
          _id: '52b213b38594d8a2be17c784',
          _match: [{ FIELD: 'totalamt', VALUE: 13100000 }]
        },
        {
          _id: '52b213b38594d8a2be17c780',
          _match: [{ FIELD: 'totalamt', VALUE: 130000000 }]
        },
        {
          _id: '52b213b38594d8a2be17c788',
          _match: [{ FIELD: 'totalamt', VALUE: 160000000 }]
        }
      ])
    })
})

test('can get documents with properties in a range', t => {
  t.plan(1)
  global[indexName]
    .GET({
      FIELD: 'sectorcode',
      VALUE: {
        GTE: 'A',
        LTE: 'G'
      }
    })
    .then(result => {
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c789',
          _match: [
            { FIELD: 'sectorcode', VALUE: 'BC' },
            { FIELD: 'sectorcode', VALUE: 'BM' },
            { FIELD: 'sectorcode', VALUE: 'BZ' }
          ]
        },
        {
          _id: '52b213b38594d8a2be17c780',
          _match: [
            { FIELD: 'sectorcode', VALUE: 'BS' },
            { FIELD: 'sectorcode', VALUE: 'EP' },
            { FIELD: 'sectorcode', VALUE: 'ES' },
            { FIELD: 'sectorcode', VALUE: 'ET' }
          ]
        },
        {
          _id: '52b213b38594d8a2be17c781',
          _match: [
            { FIELD: 'sectorcode', VALUE: 'BS' },
            { FIELD: 'sectorcode', VALUE: 'BZ' }
          ]
        },
        {
          _id: '52b213b38594d8a2be17c784',
          _match: [{ FIELD: 'sectorcode', VALUE: 'FH' }]
        }
      ])
    })
})

test('can get documents with properties in a range and the NOT some out', t => {
  t.plan(1)
  global[indexName]
    .NOT(
      global[indexName].GET({
        FIELD: 'sectorcode',
        VALUE: {
          GTE: 'A',
          LTE: 'G'
        }
      }),
      'sectorcode:YZ'
    )
    .then(result => {
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c789',
          _match: [
            { FIELD: 'sectorcode', VALUE: 'BC' },
            { FIELD: 'sectorcode', VALUE: 'BM' },
            { FIELD: 'sectorcode', VALUE: 'BZ' }
          ]
        },
        {
          _id: '52b213b38594d8a2be17c780',
          _match: [
            { FIELD: 'sectorcode', VALUE: 'BS' },
            { FIELD: 'sectorcode', VALUE: 'EP' },
            { FIELD: 'sectorcode', VALUE: 'ES' },
            { FIELD: 'sectorcode', VALUE: 'ET' }
          ]
        },
        {
          _id: '52b213b38594d8a2be17c781',
          _match: [
            { FIELD: 'sectorcode', VALUE: 'BS' },
            { FIELD: 'sectorcode', VALUE: 'BZ' }
          ]
        }
      ])
    })
})

test('can get documents with properties in a range and the NOT some out', t => {
  t.plan(1)
  global[indexName].NOT('sectorcode:BS', 'sectorcode:ET').then(result => {
    t.deepEqual(result, [
      {
        _id: '52b213b38594d8a2be17c781',
        _match: [{ FIELD: 'sectorcode', VALUE: 'BS' }]
      }
    ])
  })
})

test('can do OR with GTE/LTE', t => {
  t.plan(1)
  global[indexName]
    .OR(
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
    )
    .then(result => {
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c789',
          _match: [
            { FIELD: 'sectorcode', VALUE: 'BC' },
            { FIELD: 'sectorcode', VALUE: 'BM' },
            { FIELD: 'sectorcode', VALUE: 'BZ' }
          ]
        },
        {
          _id: '52b213b38594d8a2be17c780',
          _match: [{ FIELD: 'sectorcode', VALUE: 'BS' }]
        },
        {
          _id: '52b213b38594d8a2be17c781',
          _match: [
            { FIELD: 'sectorcode', VALUE: 'BS' },
            { FIELD: 'sectorcode', VALUE: 'BZ' }
          ]
        },
        {
          _id: '52b213b38594d8a2be17c787',
          _match: [{ FIELD: 'sectorcode', VALUE: 'LR' }]
        }
      ])
    })
})

test('can do AND with GTE/LTE', t => {
  t.plan(1)
  global[indexName]
    .AND(
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
    )
    .then(result => {
      t.deepEqual(result, [
        {
          _id: '52b213b38594d8a2be17c784',
          _match: [
            { FIELD: 'sectorcode', VALUE: 'FH' },
            { FIELD: 'sectorcode', VALUE: 'YW' },
            { FIELD: 'sectorcode', VALUE: 'YZ' }
          ]
        }
      ])
    })
})

test('can aggregate totalamt', t => {
  t.plan(1)
  global[indexName]
    .AGGREGATE({
      // global[indexName].DISTINCT({
      //   FIELD: 'totalamt'
      // }).then(result => result.map(global[indexName].BUCKET)),
      FACETS: global[indexName].FACETS({
        FIELD: 'totalamt'
      }),
      QUERY: global[indexName].GET('board_approval_month:November')
    })
    .then(result => {
      t.deepEqual(result, {
        BUCKETS: [],
        FACETS: [
          { FIELD: 'totalamt', VALUE: 0, _id: ['52b213b38594d8a2be17c781'] },
          {
            FIELD: 'totalamt',
            VALUE: 6060000,
            _id: ['52b213b38594d8a2be17c782']
          },
          { FIELD: 'totalamt', VALUE: 10000000, _id: [] },
          { FIELD: 'totalamt', VALUE: 13100000, _id: [] },
          {
            FIELD: 'totalamt',
            VALUE: 130000000,
            _id: ['52b213b38594d8a2be17c780']
          },
          { FIELD: 'totalamt', VALUE: 160000000, _id: [] },
          { FIELD: 'totalamt', VALUE: 200000000, _id: [] },
          { FIELD: 'totalamt', VALUE: 500000000, _id: [] }
        ],
        RESULT: [
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
        ]
      })
    })
})

test('can aggregate totalamt, on docs with "board_approval_month:October"', t => {
  t.plan(1)
  global[indexName]
    .AGGREGATE({
      FACETS: global[indexName].FACETS({
        FIELD: 'totalamt'
      }),
      QUERY: global[indexName].GET('board_approval_month:October')
    })
    .then(result => {
      t.deepEqual(result, {
        BUCKETS: [],
        FACETS: [
          {
            FIELD: 'totalamt',
            VALUE: 0,
            _id: ['52b213b38594d8a2be17c783', '52b213b38594d8a2be17c787']
          },
          { FIELD: 'totalamt', VALUE: 6060000, _id: [] },
          {
            FIELD: 'totalamt',
            VALUE: 10000000,
            _id: ['52b213b38594d8a2be17c785']
          },
          {
            FIELD: 'totalamt',
            VALUE: 13100000,
            _id: ['52b213b38594d8a2be17c784']
          },
          { FIELD: 'totalamt', VALUE: 130000000, _id: [] },
          {
            FIELD: 'totalamt',
            VALUE: 160000000,
            _id: ['52b213b38594d8a2be17c788']
          },
          {
            FIELD: 'totalamt',
            VALUE: 200000000,
            _id: ['52b213b38594d8a2be17c789']
          },
          {
            FIELD: 'totalamt',
            VALUE: 500000000,
            _id: ['52b213b38594d8a2be17c786']
          }
        ],
        RESULT: [
          {
            _id: '52b213b38594d8a2be17c783',
            _match: [{ FIELD: 'board_approval_month', VALUE: 'October' }]
          },
          {
            _id: '52b213b38594d8a2be17c784',
            _match: [{ FIELD: 'board_approval_month', VALUE: 'October' }]
          },
          {
            _id: '52b213b38594d8a2be17c785',
            _match: [{ FIELD: 'board_approval_month', VALUE: 'October' }]
          },
          {
            _id: '52b213b38594d8a2be17c786',
            _match: [{ FIELD: 'board_approval_month', VALUE: 'October' }]
          },
          {
            _id: '52b213b38594d8a2be17c787',
            _match: [{ FIELD: 'board_approval_month', VALUE: 'October' }]
          },
          {
            _id: '52b213b38594d8a2be17c788',
            _match: [{ FIELD: 'board_approval_month', VALUE: 'October' }]
          },
          {
            _id: '52b213b38594d8a2be17c789',
            _match: [{ FIELD: 'board_approval_month', VALUE: 'October' }]
          }
        ]
      })
    })
})

test('can do bucket', t => {
  t.plan(1)
  global[indexName]
    .BUCKET({
      FIELD: 'board_approval_month',
      VALUE: 'November'
    })
    .then(result => {
      t.deepEqual(result, {
        FIELD: ['board_approval_month'],
        VALUE: { GTE: 'November', LTE: 'November' },
        _id: [
          '52b213b38594d8a2be17c780',
          '52b213b38594d8a2be17c781',
          '52b213b38594d8a2be17c782'
        ]
      })
    })
})

test('can do custom buckets', t => {
  t.plan(1)
  Promise.all(
    [
      {
        FIELD: 'totalamt',
        VALUE: {
          LTE: 13100000
        }
      },
      {
        FIELD: 'totalamt',
        VALUE: {
          GTE: 13200000
        }
      }
    ].map(global[indexName].BUCKET)
  ).then(result =>
    t.deepEqual(result, [
      {
        FIELD: ['totalamt'],
        VALUE: { LTE: 13100000, GTE: undefined },
        _id: [
          '52b213b38594d8a2be17c781',
          '52b213b38594d8a2be17c782',
          '52b213b38594d8a2be17c783',
          '52b213b38594d8a2be17c784',
          '52b213b38594d8a2be17c785',
          '52b213b38594d8a2be17c787'
        ]
      },
      {
        FIELD: ['totalamt'],
        VALUE: { GTE: 13200000, LTE: '￮' },
        _id: [
          '52b213b38594d8a2be17c780',
          '52b213b38594d8a2be17c786',
          '52b213b38594d8a2be17c788',
          '52b213b38594d8a2be17c789'
        ]
      }
    ])
  )
})

test('can do custom buckets', t => {
  t.plan(1)
  global[indexName]
    .BUCKETS(
      ...[100000000, 200000000, 300000000, 400000000, 500000000].map(item => ({
        FIELD: ['totalamt'],
        VALUE: {
          GTE: item - 100000000,
          LTE: item
        }
      }))
    )
    .then(result =>
      t.deepEqual(result, [
        {
          FIELD: ['totalamt'],
          VALUE: { GTE: 0, LTE: 100000000 },
          _id: [
            '52b213b38594d8a2be17c781',
            '52b213b38594d8a2be17c782',
            '52b213b38594d8a2be17c783',
            '52b213b38594d8a2be17c784',
            '52b213b38594d8a2be17c785',
            '52b213b38594d8a2be17c787'
          ]
        },
        {
          FIELD: ['totalamt'],
          VALUE: { GTE: 100000000, LTE: 200000000 },
          _id: [
            '52b213b38594d8a2be17c780',
            '52b213b38594d8a2be17c788',
            '52b213b38594d8a2be17c789'
          ]
        },
        {
          FIELD: ['totalamt'],
          VALUE: { GTE: 200000000, LTE: 300000000 },
          _id: ['52b213b38594d8a2be17c789']
        },
        {
          FIELD: ['totalamt'],
          VALUE: { GTE: 300000000, LTE: 400000000 },
          _id: []
        },
        {
          FIELD: ['totalamt'],
          VALUE: { GTE: 400000000, LTE: 500000000 },
          _id: ['52b213b38594d8a2be17c786']
        }
      ])
    )
})

test('can do custom buckets and agreggate, only count docs with "board_approval_month:October"', t => {
  t.plan(1)
  global[indexName]
    .AGGREGATE({
      BUCKETS: global[indexName].BUCKETS(
        ...[100000000, 200000000, 300000000, 400000000, 500000000].map(
          item => ({
            FIELD: 'totalamt',
            VALUE: {
              GTE: item - 100000000,
              LTE: item
            }
          })
        )
      ),
      QUERY: global[indexName].GET({
        FIELD: 'board_approval_month',
        VALUE: 'October'
      })
    })
    .then(result =>
      t.deepEqual(result, {
        BUCKETS: [
          {
            FIELD: ['totalamt'],
            VALUE: { GTE: 0, LTE: 100000000 },
            _id: [
              '52b213b38594d8a2be17c783',
              '52b213b38594d8a2be17c784',
              '52b213b38594d8a2be17c785',
              '52b213b38594d8a2be17c787'
            ]
          },
          {
            FIELD: ['totalamt'],
            VALUE: { GTE: 100000000, LTE: 200000000 },
            _id: ['52b213b38594d8a2be17c788', '52b213b38594d8a2be17c789']
          },
          {
            FIELD: ['totalamt'],
            VALUE: { GTE: 200000000, LTE: 300000000 },
            _id: ['52b213b38594d8a2be17c789']
          },
          {
            FIELD: ['totalamt'],
            VALUE: { GTE: 300000000, LTE: 400000000 },
            _id: []
          },
          {
            FIELD: ['totalamt'],
            VALUE: { GTE: 400000000, LTE: 500000000 },
            _id: ['52b213b38594d8a2be17c786']
          }
        ],
        FACETS: [],
        RESULT: [
          {
            _id: '52b213b38594d8a2be17c783',
            _match: [{ FIELD: 'board_approval_month', VALUE: 'October' }]
          },
          {
            _id: '52b213b38594d8a2be17c784',
            _match: [{ FIELD: 'board_approval_month', VALUE: 'October' }]
          },
          {
            _id: '52b213b38594d8a2be17c785',
            _match: [{ FIELD: 'board_approval_month', VALUE: 'October' }]
          },
          {
            _id: '52b213b38594d8a2be17c786',
            _match: [{ FIELD: 'board_approval_month', VALUE: 'October' }]
          },
          {
            _id: '52b213b38594d8a2be17c787',
            _match: [{ FIELD: 'board_approval_month', VALUE: 'October' }]
          },
          {
            _id: '52b213b38594d8a2be17c788',
            _match: [{ FIELD: 'board_approval_month', VALUE: 'October' }]
          },
          {
            _id: '52b213b38594d8a2be17c789',
            _match: [{ FIELD: 'board_approval_month', VALUE: 'October' }]
          }
        ]
      })
    )
})
