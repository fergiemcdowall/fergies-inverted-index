const ndb = require('../lib/ndb-core.js')
const test = require('tape')

test('can index an object and then return a value', t => {
  t.plan(1)
  const obj = {
    foo: 'bar',
    _aliens: [1, 2, 3, 4, {
      five: ['six', 'seven'],
      eight: {
        nine: 'ten'
      }
    }]
  }
  ndb({
    name: 'naturaldb'
  }).then(
    db => {
      db.put(obj)
        .then(res => {
          db.get('_aliens.4.eight.nine.ten').then(got => {
            t.looseEqual(got, [ obj ])
          })
        })
    })
})
