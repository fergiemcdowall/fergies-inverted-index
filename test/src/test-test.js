import test from 'tape'

// import { InvertedIndex } from '../../src/browser.js'

const { InvertedIndex } = await import('../../src/browser.js')

test('simple test', t => {
  t.plan(1)
  t.ok('this test passes')
})
