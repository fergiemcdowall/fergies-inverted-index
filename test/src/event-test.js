import test from 'tape'
import { InvertedIndex } from 'fergies-inverted-index'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'EVENTS'
const global = {}

test('create index', t => {
  t.plan(2)
  t.ok((global[indexName] = new InvertedIndex({ name: indexName })), !undefined)
  global[indexName].EVENTS.on('ready', () => t.pass('ready event emitted'))
})
