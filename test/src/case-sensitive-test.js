import fii from '../../dist/fergies-inverted-index.esm.js'
import test from 'tape'

const sandbox = 'test/sandbox/'
// TODO: why does 'case-sensitive-test' break everything here?
const caseSensitiveIdx = sandbox + 'case-sensitive-testx'
const caseInsensitiveIdx = sandbox + 'case-insensitive-test'

test('create a case sensitive index', t => {
  t.plan(1)
  fii({
    name: caseSensitiveIdx,
    caseSensitive: true
  }, (err, idx) => {
    global[caseSensitiveIdx] = idx
    t.error(err)
  })
})

test('create a case INsensitive index', t => {
  t.plan(1)
  fii({
    name: caseInsensitiveIdx,
    caseSensitive: false
  }, (err, idx) => {
    global[caseInsensitiveIdx] = idx
    t.error(err)
  })
})


test('can add some data', t => {
  const data = [
    
    {
      "_id": 0,
      "make": "Tesla",
      "manufacturer": "Volvo",
      "brand": "Volvo"
    },
    {
      "_id": 1,
      "make": "BMW",
      "manufacturer": "Volvo",
      "brand": "Volvo"
    },
    {
      "_id": 2,
      "make": "tesla",
      "manufacturer": "Tesla",
      "brand": "Volvo"
    },
    {
      "_id": 3,
      "make": "Tesla",
      "manufacturer": "Volvo",
      "brand": "BMW"
    },
    {
      "_id": 4,
      "make": "Volvo",
      "manufacturer": "Volvo",
      "brand": "Volvo"
    },
    {
      "_id": 5,
      "make": "Volvo",
      "manufacturer": "Tesla",
      "brand": "Volvo"
    },
    {
      "_id": 6,
      "make": "Tesla",
      "manufacturer": "Tesla",
      "brand": "BMW"
    },
    {
      "_id": 7,
      "make": "BMW",
      "manufacturer": "Tesla",
      "brand": "Tesla"
    },
    {
      "_id": 8,
      "Make": "Volvo",
      "manufacturer": "BMW",
      "brand": "Tesla"
    },
    {
      "_id": 9,
      "make": "BMW",
      "manufacturer": "Tesla",
      "brand": "Volvo"
    }
    
  ]
  t.plan(1)
  global[caseSensitiveIdx].PUT(data).then(
    () => global[caseInsensitiveIdx].PUT(data)
  ).then(t.pass)
})


test('Case means that no results are returned', t => {
  t.plan(1)
  global[caseSensitiveIdx].GET('teSLA')
   .then(result => {
     t.deepEqual(result, [])
   })
})

test('Match case and return results -> make:Tesla', t => {
  t.plan(1)
  global[caseSensitiveIdx].GET('make:Tesla')
   .then(result => {
     t.deepEqual(result, [
       { _id: '0', _match: [ 'make:Tesla' ] },
       { _id: '3', _match: [ 'make:Tesla' ] },
       { _id: '6', _match: [ 'make:Tesla' ] }
     ])
   })
})

test('Match case and return results -> make:tesla', t => {
  t.plan(1)
  global[caseSensitiveIdx].GET('make:tesla')
   .then(result => {
     t.deepEqual(result, [
       { _id: '2', _match: [ 'make:tesla' ] },
     ])
   })
})

test('Match case and return results -> make:volvo', t => {
  t.plan(1)
  global[caseSensitiveIdx].GET('make:Volvo')
   .then(result => {
     t.deepEqual(result, [
       { _id: '4', _match: [ 'make:Volvo' ] },
       { _id: '5', _match: [ 'make:Volvo' ] } 
     ])
   })
})

test('Match case and return results -> Make:volvo', t => {
  t.plan(1)
  global[caseSensitiveIdx].GET('Make:Volvo')
   .then(result => {
     t.deepEqual(result, [
       { _id: '8', _match: [ 'Make:Volvo' ] }
     ])
   })
})


test('Match even with weird case', t => {
  t.plan(1)
  global[caseInsensitiveIdx].GET('teSLA')
   .then(result => {
     t.deepEqual(result, [
       { _id: '0', _match: [ 'make:tesla' ] },
       { _id: '2', _match: [ 'make:tesla', 'manufacturer:tesla' ] },
       { _id: '3', _match: [ 'make:tesla' ] },
       { _id: '5', _match: [ 'manufacturer:tesla' ] },
       { _id: '6', _match: [ 'make:tesla', 'manufacturer:tesla' ] },
       { _id: '7', _match: [ 'brand:tesla', 'manufacturer:tesla' ] },
       { _id: '8', _match: [ 'brand:tesla' ] },
       { _id: '9', _match: [ 'manufacturer:tesla' ] } 
     ])
   })
})

test('Match case and return results -> make:Tesla', t => {
  t.plan(1)
  global[caseInsensitiveIdx].GET('make:Tesla')
   .then(result => {
     t.deepEqual(result, [
       { _id: '0', _match: [ 'make:tesla' ] },
       { _id: '2', _match: [ 'make:tesla' ] },
       { _id: '3', _match: [ 'make:tesla' ] },
       { _id: '6', _match: [ 'make:tesla' ] }
     ])
   })
})

test('Match case and return results -> make:tesla', t => {
  t.plan(1)
  global[caseInsensitiveIdx].GET('make:tesla')
   .then(result => {
     t.deepEqual(result, [
       { _id: '0', _match: [ 'make:tesla' ] },
       { _id: '2', _match: [ 'make:tesla' ] },
       { _id: '3', _match: [ 'make:tesla' ] },
       { _id: '6', _match: [ 'make:tesla' ] } 
     ])
   })
})

test('Match case and return results -> make:volvo', t => {
  t.plan(1)
  global[caseInsensitiveIdx].GET('make:Volvo')
   .then(result => {
     t.deepEqual(result, [
       { _id: '4', _match: [ 'make:volvo' ] },
       { _id: '5', _match: [ 'make:volvo' ] },
       { _id: '8', _match: [ 'make:volvo' ] }
     ])
   })
})

test('Match case and return results -> Make:volvo', t => {
  t.plan(1)
  global[caseInsensitiveIdx].GET('MAKE:VOLVO')
   .then(result => {
     t.deepEqual(result, [
       { _id: '4', _match: [ 'make:volvo' ] },
       { _id: '5', _match: [ 'make:volvo' ] },
       { _id: '8', _match: [ 'make:volvo' ] }
     ])
   })
})
