import fii from '../../dist/fergies-inverted-index.esm.js'
import test from 'tape'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'stopword-test'

test('create index', t => {
  t.plan(1)
  fii({
    name: indexName,
    stopwords: [ 'this', 'is', 'a', 'that', 'bananas' ]
  }).then(db => {
    global[indexName] = db    
    t.ok(db, !undefined)
  })
})


test('can add some data', t => {
  const data = [
    {
      "_id": 0,
      "text": "this is a sentence".split(' ')
    },
    {
      "_id": 1,
      "text": "a sentence that is interesting".split(' ')
    }    
  ]
  t.plan(1)
  global[indexName].PUT(data).then(t.pass)
})


test('can verify store', t => {
  const entries = [
    { key: 'text:interesting', value: [ '1' ] },
    { key: 'text:sentence', value: [ '0', '1' ] },
    {
      key: '￮DOC￮0￮',
      value: { _id: 0, text: [ 'this', 'is', 'a', 'sentence' ] }
    },
    {
      key: '￮DOC￮1￮',
      value: { _id: 1, text: [ 'a', 'sentence', 'that', 'is', 'interesting'  ] }
    },
    { key: '￮FIELD￮text￮', value: 'text' }
  ]
  t.plan(entries.length + 1)
  global[indexName].STORE.createReadStream()
    .on('data', d => t.deepEquals(d, entries.shift()))
    .on('end', resolve => t.pass('ended'))
})

test('can read data ignoring stopwords', t => {
  t.plan(1)
  global[indexName].AND(
    'this', 'is', 'a', 'sentence', 'bananas'
  )
   .then(result => {
     t.deepEqual(result, [
       { _id: '0', _match: [ 'text:sentence' ] },
       { _id: '1', _match: [ 'text:sentence' ] } 
     ])
   })

})
