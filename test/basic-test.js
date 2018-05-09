const ndb = require('../lib/ndb-core.js')
const test = require('tape')
const wbd = require('world-bank-dataset')
const sandbox = 'test/sandbox/'

test('can index an object and then return a value', t => {
  t.plan(1)
  const data = {
    foo: 'bar',
    _aliens: [1, 2, 3, 4, {
      five: ['six', 'seven'],
      eight: {
        nine: 'ten'
      }
    }]
  }
  ndb().then(
    db => {
      db.put(data)
        .then(res => {
          db.get('_aliens.4.eight.nine.ten').then(got => {
            t.looseEqual(got, [ data ])
          })
        })
    })
})


test('can open another db and index to that', t => {
  var data = wbd.slice(0,1).map(item => {
    newItem = {
      _approvalfy: item.approvalfy
    }
    return newItem
  })[0]
  t.plan(1)
  ndb({
    name: sandbox + 'boomster'
  }).then(
    db => {
      db.put(data)
        .then(res => {
          db.get('_approvalfy.1999').then(got => {
            t.looseEqual(got, [ data ])
          })
        })
    })
})
