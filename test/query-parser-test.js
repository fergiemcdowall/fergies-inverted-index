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
  t.plan(1)
  wb.PUT(data).then(t.pass)
})

test('can GET with string', t => {
  t.plan(1)
  wb.GET('board_approval_month:November')
    .then(result => {
      t.looseEqual(result, [
        { _id: '52b213b38594d8a2be17c780', prop: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c781', prop: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c782', prop: [ 'board_approval_month:November' ] }
      ])
    })
})

test('can GET with object', t => {
  t.plan(1)
  wb.GET({
    gte: 'board_approval_month:November',
    lte: 'board_approval_month:November'
  })
    .then(result => {
      t.looseEqual(result, [
        { _id: '52b213b38594d8a2be17c780', prop: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c781', prop: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c782', prop: [ 'board_approval_month:November' ] }
      ])
    })
})

test('can do some AND searches', t => {
  t.plan(1)
  wb.AND(
    'sectorcode:BS',
    'sectorcode:BZ',
    'board_approval_month:November'
  )
    .then(result => {
      t.looseEqual(result, [
        {
          _id: '52b213b38594d8a2be17c781',
          prop: [ [ 'sectorcode:BS' ], [ 'sectorcode:BZ' ], [ 'board_approval_month:November' ] ]
        }
      ])
    })
})

test('can do some OR searches', t => {
  t.plan(1)
  wb.OR(
    'sectorcode:BS',
    'sectorcode:BZ',
    'board_approval_month:November'
  ).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c780', prop: [ [ 'sectorcode:BS' ], [ 'board_approval_month:November' ] ] },
      { _id: '52b213b38594d8a2be17c781', prop: [ [ 'sectorcode:BS' ], [ 'sectorcode:BZ' ], [ 'board_approval_month:November' ] ] },
      { _id: '52b213b38594d8a2be17c789', prop: [ [ 'sectorcode:BZ' ] ] },
      { _id: '52b213b38594d8a2be17c782', prop: [ [ 'board_approval_month:November' ] ] }       
    ])
  })
})

test('can do some OR searches', t => {
  t.plan(1)
  wb.OR(
    'sectorcode:BZ',
    'sectorcode:TI'
  ).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c781', prop: [ [ 'sectorcode:BZ' ] ] },
      { _id: '52b213b38594d8a2be17c789', prop: [ [ 'sectorcode:BZ' ] ] },
      { _id: '52b213b38594d8a2be17c782', prop: [ [ 'sectorcode:TI' ] ] },
      { _id: '52b213b38594d8a2be17c786', prop: [ [ 'sectorcode:TI' ] ] },
      { _id: '52b213b38594d8a2be17c788', prop: [ [ 'sectorcode:TI' ] ] }
    ])
  })
})

test('can do AND with nested OR', t => {
  t.plan(1)
  wb.AND(
    'board_approval_month:November',
    wb.OR('sectorcode:BZ', 'sectorcode:TI')
  ).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c781',
        prop: [ [ 'board_approval_month:November' ], [ [ 'sectorcode:BZ' ] ] ] },
      { _id: '52b213b38594d8a2be17c782',
        prop: [ [ 'board_approval_month:November' ], [ [ 'sectorcode:TI' ] ] ] }
    ])
  })
})

test('can do AND with embedded AND', t => {
  t.plan(1)
  wb.AND(
    'board_approval_month:October',
    wb.OR(
      wb.AND( 'sectorcode:BZ', 'sectorcode:BC' ),
      'sectorcode:TI'
    )
  ).then(result => {
    t.looseEqual(result, [
      {
        _id: '52b213b38594d8a2be17c786',
        prop: [ [ 'board_approval_month:October' ], [ [ 'sectorcode:TI' ] ] ]
      },
      {
        _id: '52b213b38594d8a2be17c788',
        prop: [ [ 'board_approval_month:October' ], [ [ 'sectorcode:TI' ] ] ]
      },
      {
        _id: '52b213b38594d8a2be17c789',
        prop: [ [ 'board_approval_month:October' ], [ [ [ 'sectorcode:BZ' ], [ 'sectorcode:BC' ] ] ] ]
      }
    ])
  })
})

test('can do AND', t => {
  t.plan(1)
  wb.AND(
    'board_approval_month:November',
    wb.OR('sectorcode:BZ', 'sectorcode:TI')
  ).then(wb.OBJECT)
    .then(result => {
      t.looseEqual(result, [
        { _id: '52b213b38594d8a2be17c781', sectorcode: [ 'BZ', 'BS' ], board_approval_month: 'November', impagency: 'MINISTRY OF FINANCE', majorsector_percent: [ { Name: 'Public Administration, Law, and Justice', Percent: 70 }, { Name: 'Public Administration, Law, and Justice', Percent: 30 } ], mjsector_namecode: [ { name: 'Public Administration, Law, and Justice', code: 'BX' }, { name: 'Public Administration, Law, and Justice', code: 'BX' } ], sector_namecode: [ { name: 'Public administration- Other social services', code: 'BS' }, { name: 'General public administration sector', code: 'BZ' } ], totalamt: 0 }, { _id: '52b213b38594d8a2be17c782', sectorcode: [ 'TI' ], board_approval_month: 'November', impagency: 'MINISTRY OF TRANSPORT AND COMMUNICATIONS', majorsector_percent: [ { Name: 'Transportation', Percent: 100 } ], mjsector_namecode: [ { name: 'Transportation', code: 'TX' } ], sector_namecode: [ { name: 'Rural and Inter-Urban Roads and Highways', code: 'TI' } ], totalamt: 6060000 }
      ])
    })
})

test('can do AND with embedded OR search', t => {
  t.plan(1)
  wb.AND(
    'board_approval_month:October',
    wb.OR(
      'sectorcode:LR',
      wb.AND('sectorcode:BC', 'sectorcode:BM')
    )
  ).then(wb.OBJECT)
    .then(result => {
      t.looseEqual(result, [
        { _id: '52b213b38594d8a2be17c787', sectorcode: [ 'LR' ], board_approval_month: 'October', impagency: 'NATIONAL ENERGY ADMINISTRATION', majorsector_percent: [ { Name: 'Energy and mining', Percent: 100 } ], mjsector_namecode: [ { name: 'Energy and mining', code: 'LX' } ], sector_namecode: [ { name: 'Other Renewable Energy', code: 'LR' } ], totalamt: 0 },
        { _id: '52b213b38594d8a2be17c789', sectorcode: [ 'BM', 'BC', 'BZ' ], board_approval_month: 'October', impagency: 'MINISTRY OF FINANCE', majorsector_percent: [ { Name: 'Public Administration, Law, and Justice', Percent: 34 }, { Name: 'Public Administration, Law, and Justice', Percent: 33 }, { Name: 'Public Administration, Law, and Justice', Percent: 33 } ], mjsector_namecode: [ { name: 'Public Administration, Law, and Justice', code: 'BX' }, { name: 'Public Administration, Law, and Justice', code: 'BX' }, { name: 'Public Administration, Law, and Justice', code: 'BX' } ], sector_namecode: [ { name: 'General public administration sector', code: 'BZ' }, { name: 'Central government administration', code: 'BC' }, { name: 'Public administration- Information and communications', code: 'BM' } ], totalamt: 200000000 }
      ])
    })
})

test('can get highest value of totalamt (MAX)', t => {
  t.plan(1)
  wb.MAX('totalamt')
    .then(result => {
      t.equal(result, 'totalamt:6060000')
    })
})

test('can get lowest value of totalamt (MIN)', t => {
  t.plan(1)
  wb.MIN('totalamt')
    .then(result => {
      t.equal(result, 'totalamt:0')
    })
})

test('can get all values of totalamt (DIST)', t => {
  t.plan(1)
  wb.DISTINCT('totalamt')
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
  wb.DISTINCT('totalamt')
    .then(result => wb.EACH(result))
    .then(result => {
      t.looseEqual(result, [
        { prop: 'totalamt:0', _id: [ '52b213b38594d8a2be17c781', '52b213b38594d8a2be17c783', '52b213b38594d8a2be17c787' ] },
        { prop: 'totalamt:10000000', _id: [ '52b213b38594d8a2be17c785' ] },
        { prop: 'totalamt:130000000', _id: [ '52b213b38594d8a2be17c780' ] },
        { prop: 'totalamt:13100000', _id: [ '52b213b38594d8a2be17c784' ] },
        { prop: 'totalamt:160000000', _id: [ '52b213b38594d8a2be17c788' ] },
        { prop: 'totalamt:200000000', _id: [ '52b213b38594d8a2be17c789' ] },
        { prop: 'totalamt:500000000', _id: [ '52b213b38594d8a2be17c786' ] },
        { prop: 'totalamt:6060000', _id: [ '52b213b38594d8a2be17c782' ] }
      ])
    })
})

test('can aggregate totalamt (showing ID count)', t => {
  t.plan(1)
  wb.DISTINCT('totalamt')
    .then(result => wb.EACH(result))
    .then(result => {
      t.looseEqual(result.map(item => {
        return {
          prop: item.prop,
          count: item._id.length
        }
      }), [
        { prop: 'totalamt:0', count: 3 },
        { prop: 'totalamt:10000000', count: 1 },
        { prop: 'totalamt:130000000', count: 1 },
        { prop: 'totalamt:13100000', count: 1 },
        { prop: 'totalamt:160000000', count: 1 },
        { prop: 'totalamt:200000000', count: 1 },
        { prop: 'totalamt:500000000', count: 1 },
        { prop: 'totalamt:6060000', count: 1 }
      ])
    })
})

test('can aggregate totalamt (showing ID count)', t => {
  t.plan(1)
  new Promise((resolve, reject) => {
    wb.DISTINCT('totalamt', {
      gte: 1,
      lte: 4
    }).then(result => wb.EACH(result))
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
      { prop: 'totalamt:10000000', count: 1 },
      { prop: 'totalamt:130000000', count: 1 },
      { prop: 'totalamt:13100000', count: 1 },
      { prop: 'totalamt:160000000', count: 1 },
      { prop: 'totalamt:200000000', count: 1 }
    ])
  })
})

test('can get documents with properties in a range', t => {
  t.plan(1)
  wb.GET({
    gte: 'totalamt:1',
    lte: 'totalamt:4'
  }).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c785', prop: [ 'totalamt:10000000' ] },
      { _id: '52b213b38594d8a2be17c780', prop: [ 'totalamt:130000000' ] },
      { _id: '52b213b38594d8a2be17c784', prop: [ 'totalamt:13100000' ] },
      { _id: '52b213b38594d8a2be17c788', prop: [ 'totalamt:160000000' ] },
      { _id: '52b213b38594d8a2be17c789', prop: [ 'totalamt:200000000' ] } ])
  })
})

test('can get documents with properties in a range', t => {
  t.plan(1)
  wb.GET({
    gte: 'sectorcode:A',
    lte: 'sectorcode:G'
  }).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c789',
        prop: [
          'sectorcode:BC',
          'sectorcode:BM',
          'sectorcode:BZ' ] },
      { _id: '52b213b38594d8a2be17c780',
        prop: [
          'sectorcode:BS',
          'sectorcode:EP',
          'sectorcode:ES',
          'sectorcode:ET' ] },
      { _id: '52b213b38594d8a2be17c781',
        prop: [
          'sectorcode:BS',
          'sectorcode:BZ' ] },
      { _id: '52b213b38594d8a2be17c784',
        prop: [
          'sectorcode:FH' ] }
    ])
  })
})

test('can get documents with properties in a range and the NOT some out', t => {
  t.plan(1)
  wb.NOT(
    wb.GET({
      gte: 'sectorcode:A',
      lte: 'sectorcode:G'
    }),
    'sectorcode:YZ'
  ).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c789',
        prop: [
          'sectorcode:BC',
          'sectorcode:BM',
          'sectorcode:BZ' ] },
      { _id: '52b213b38594d8a2be17c780',
        prop: [
          'sectorcode:BS',
          'sectorcode:EP',
          'sectorcode:ES',
          'sectorcode:ET' ] },
      { _id: '52b213b38594d8a2be17c781',
        prop: [
          'sectorcode:BS',
          'sectorcode:BZ' ] }
    ])
  })
})

test('can get documents with properties in a range and the NOT some out', t => {
  t.plan(1)
  wb.NOT(
    'sectorcode:BS',
    'sectorcode:ET'
  ).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c781', prop: [ 'sectorcode:BS' ] }
    ])
  })
})

