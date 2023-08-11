import test from 'tape'
import wbd from 'world-bank-dataset'
import { InvertedIndex } from 'fergies-inverted-index'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'stress-test'

const global = {}

test('create index', t => {
  t.plan(1)
  t.ok((global[indexName] = new InvertedIndex({ name: indexName })), !undefined)
})

test('can add some worldbank data in a reasonable amount of time', t => {
  t.plan(2)
  const start = Date.now()
  const timeLimit = 100000 // this has to be set high to work with electron/travis
  global[indexName].PUT(wbd).then(result => {
    const elapsedTime = Date.now() - start
    t.equal(result.length, 500)
    t.ok(
      elapsedTime < timeLimit,
      'created index in ' + elapsedTime + 'ms (time limit: ' + timeLimit + 'ms)'
    )
  })
})
