const ndb = require('../lib/index.js')
const sandbox = 'test/sandbox/'
const test = require('tape')
const wbd = require('world-bank-dataset')

var wb

test('create a little world bank index', t => {
  t.plan(1)
  ndb({
    name: sandbox + 'stress-test'
  }).then(db => {
    wb = db
    t.pass('db created')
  })
})

test('can add some worldbank data in a reasonable amount of time', t => {
  t.plan(2)
  const start = Date.now()
  const timeLimit = 2000
  wb.PUT(wbd).then(result => {
    const elapsedTime = Date.now() - start
    t.equal(result.length, 500)
    t.ok(
      elapsedTime < timeLimit,
      'created index in ' + elapsedTime + 'ms (time limit: ' + timeLimit + 'ms)'
    )
  })
})
