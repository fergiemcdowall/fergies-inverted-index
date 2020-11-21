const fii = require('../../')
const test = require('tape')

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'store-vector-test'

test('create index', t => {
  t.plan(1)
  fii({
    name: indexName
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
  global[indexName].PUT(data, {
    storeVectors: false
  }).then(t.pass)
})


test('can verify store', t => {
  const entries = [
    { key: 'text:a', value: [ '0', '1' ] },
    { key: 'text:interesting', value: [ '1' ] },
    { key: 'text:is', value: [ '0', '1' ] },
    { key: 'text:sentence', value: [ '0', '1' ] },
    { key: 'text:that', value: [ '1' ] },
    { key: 'text:this', value: [ '0' ] },
    { key: '￮FIELD￮text￮', value: 'text' }
  ]
  t.plan(entries.length + 1)
  global[indexName].STORE.createReadStream()
    .on('data', d => t.deepEquals(d, entries.shift()))
    .on('end', resolve => t.pass('ended'))
})

test('can read data ignoring stopwords', t => {
  t.plan(1)
  global[indexName].GET('interesting')
    .then(result => {
      t.deepEqual(result, [
        { _id: '1', _match: [ 'text:interesting' ] } 
      ])
    })  
})

test('gracefully fails when attempting to delete', t => {
  t.plan(1)
  global[indexName].DELETE([ '1' ])
    .then(result => {
      t.deepEqual(result, [
        { _id: '1', status: 'NOT FOUND', operation: 'DELETE' }
      ])
    })  
})
