const ndb = require('../lib/ndb-core.js')
const test = require('tape')
const wbd = require('world-bank-dataset')
const sandbox = 'test/sandbox/'

var wb

/* test('can index an object and then return a value', t => {
 *   t.plan(1)
 *   const data = {
 *     foo: 'bar',
 *     _aliens: [1, 2, 3, 4, {
 *       five: ['six', 'seven'],
 *       eight: {
 *         nine: 'ten'
 *       }
 *     }]
 *   }
 *   ndb().then(
 *     db => {
 *       db.put(data)
 *         .then(res => {
 *           db.get('_aliens.4.eight.nine.ten').then(got => {
 *             t.looseEqual(got, [ data ])
 *           })
 *         })
 *     })
 * })
 * 
 * 
 * test('can open another db and index to that', t => {
 *   var data = wbd.slice(0,1).map(item => {
 *     newItem = {
 *       _approvalfy: item.approvalfy
 *     }
 *     return newItem
 *   })[0]
 *   t.plan(1)
 *   ndb({
 *     name: sandbox + 'boomster'
 *   }).then(
 *     db => {
 *       db.put(data)
 *         .then(res => {
 *           db.get('_approvalfy.1999').then(got => {
 *             t.looseEqual(got, [ data ])
 *           })
 *         })
 *     })
 * })
 * */


test('create a little world bank index', t => {
  t.plan(1)
  ndb({
    name: sandbox + 'wb'
  }).then(db => {
    wb = db
    t.pass('db created')
  })
})


test('can add some worldbank data', t => {
  var dataSize = 50
  const data = wbd.slice(0, dataSize).map(item => {
    delete item._id
    item._countrycode = item.countrycode
    item._totalamt = item.totalamt
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
  var dataSize = 50
  wb.get({
    map: {
      totalcommamt: 5000000
    },
    reduce: results => {
      arr.map(result => {
        return item.id
      })
    }
  }, progress => {
    t.pass(JSON.stringify(progress))
  }, () => {
    t.pass('done')
  })
})
