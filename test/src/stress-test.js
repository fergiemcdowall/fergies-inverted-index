import fii from '../../dist/fergies-inverted-index.esm.js'
import test from 'tape'
import wbd from 'world-bank-dataset'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'stress-test'

test('create a little world bank index', t => {
  t.plan(1)
  fii({ name: indexName }, (err, idx) => {
    global[indexName] = idx
    t.error(err)
  })
})

test('can add some worldbank data in a reasonable amount of time', t => {
  t.plan(2)
  const start = Date.now()
  const timeLimit = 10000
  global[indexName].PUT(wbd).then(result => {
    const elapsedTime = Date.now() - start
    t.equal(result.length, 500)
    t.ok(
      elapsedTime < timeLimit,
      'created index in ' + elapsedTime + 'ms (time limit: ' + timeLimit + 'ms)'
    )
  })
})
