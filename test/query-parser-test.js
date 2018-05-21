const ndb = require('../lib/ndb-core.js')
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
    item._id = item._id.$oid
    item.sectorcode = item.sectorcode.split(',')
    return item
  })
  t.plan(dataSize)
  wb.bat(data, progress => {
    t.pass(JSON.stringify(progress))
  }, () => {
    t.pass('done')
  })
})

test('can do some searches', t => {
  t.plan(2)
  var dataSize = 50
  wb.get({
    select: {
      sectorcode: [ 'BS', 'BZ' ],
      board_approval_month: 'November'
    }
  }).then(result => {
    t.equal(result.length, 1)
    t.equal(result[0]._id, '52b213b38594d8a2be17c781')
  })
})

test('can do some searches', t => {
  t.plan(3)
  var dataSize = 50
  wb.get({
    select: {
      impagency: 'MINISTRY OF FINANCE'
    }
  }).then(result => {
    t.equal(result.length, 2)
    t.equal(result[0]._id, '52b213b38594d8a2be17c781')
    t.equal(result[1]._id, '52b213b38594d8a2be17c789')
  })
})


test('can do some searches', t => {
  t.plan(4)
  var dataSize = 50
  //this only works because Transportation is at position 0 in the source docs
  wb.get({
    select: {
      majorsector_percent: [
        {
          Name: 'Transportation'
        }
      ]
    }
  }).then(result => {
    t.equal(result.length, 3)
    t.equal(result[0]._id, '52b213b38594d8a2be17c782')
    t.equal(result[1]._id, '52b213b38594d8a2be17c786')
    t.equal(result[2]._id, '52b213b38594d8a2be17c788')
  })
})


test('can do some searches (nested array)', t => {
  t.plan(2)
  var dataSize = 50
  wb.get({
    select: {
      sector_namecode: [
        {
          name: 'Tertiary education'
        }
      ]
    }
  }).then(result => {
    t.equal(result.length, 1)
    t.equal(result[0]._id, '52b213b38594d8a2be17c780')
  })
})


test('can do some searches (ORing)', t => {
  t.plan(3)
  var dataSize = 50
  wb.get({
    select: {
      mjsector_namecode: [
        {
          name: {
            _OR: ['Finance', 'Education']
          }
        }
      ]
    }
  }).then(result => {
    t.equal(result.length, 2)
    t.equal(result[0]._id, '52b213b38594d8a2be17c784')
    t.equal(result[1]._id, '52b213b38594d8a2be17c780')
  })
})

