import fii from '../../dist/fergies-inverted-index.esm.js'
import test from 'tape'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'search-in-all-fields'

test('create a tiny test index', t => {
  t.plan(1)
  fii({ name: indexName }, (err, idx) => {
    global[indexName] = idx
    t.error(err)
  })
})

test('can add some worldbank data', t => {
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
      "make": "Tesla",
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
      "make": "Volvo",
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
  global[indexName].PUT(data).then(t.pass)
})


test('get AVAILABLE_FIELDS', t => {
  t.plan(1)
  global[indexName].AVAILABLE_FIELDS()
    .then(result => {
      t.looseEqual(result, [
        'brand', 'make', 'manufacturer'
      ])
    })

})

// test('can dump store', t => {
//   t.plan(1)
//   global[indexName].STORE.createReadStream()
//     .on('data', console.log)
//     .on('end', resolve => t.pass('ended'))
// })

test('can GET with string specifying a field', t => {
  t.plan(1)
  global[indexName].GET('make:Tesla')
    .then(result => {
      t.looseEqual(result, [
        { _id: '0', _match: [ 'make:Tesla' ] },
        { _id: '2', _match: [ 'make:Tesla' ] },
        { _id: '3', _match: [ 'make:Tesla' ] },
        { _id: '6', _match: [ 'make:Tesla' ] },
      ])
    })
})

test('can GET with string without specifying field (GET from all fields)', t => {
  t.plan(1)
  global[indexName].GET('Tesla')
    .then(result => {
      t.looseEqual(result, [
        { _id: '0', _match: [ 'make:Tesla' ] },
        { _id: '2', _match: [ 'make:Tesla', 'manufacturer:Tesla' ] },
        { _id: '3', _match: [ 'make:Tesla' ] },
        { _id: '5', _match: [ 'manufacturer:Tesla' ] },
        { _id: '6', _match: [ 'make:Tesla', 'manufacturer:Tesla' ] },
        { _id: '7', _match: [ 'brand:Tesla', 'manufacturer:Tesla' ] },
        { _id: '8', _match: [ 'brand:Tesla' ] },
        { _id: '9', _match: [ 'manufacturer:Tesla' ] } 
      ])
    })
})

test('can GET without specifying field (GET from all fields)', t => {
  t.plan(1)
  global[indexName].GET({
    value: {
      gte: 'Tesla',
      lte: 'Tesla'
    }
  })
    .then(result => {
      t.looseEqual(result, [
        { _id: '0', _match: [ 'make:Tesla' ] },
        { _id: '2', _match: [ 'make:Tesla', 'manufacturer:Tesla' ] },
        { _id: '3', _match: [ 'make:Tesla' ] },
        { _id: '5', _match: [ 'manufacturer:Tesla' ] },
        { _id: '6', _match: [ 'make:Tesla', 'manufacturer:Tesla' ] },
        { _id: '7', _match: [ 'brand:Tesla', 'manufacturer:Tesla' ] },
        { _id: '8', _match: [ 'brand:Tesla' ] },
        { _id: '9', _match: [ 'manufacturer:Tesla' ] } 
      ])
    })
})


test('can GET specifying 2 fields (GET from all fields)', t => {
  t.plan(1)
  global[indexName].GET({
    field: ['brand', 'manufacturer'],
    value: {
      gte: 'Tesla',
      lte: 'Tesla'
    }
  })
    .then(result => {
      t.looseEqual(result, [
        { _id: '2', _match: [ 'manufacturer:Tesla' ] },
        { _id: '5', _match: [ 'manufacturer:Tesla' ] },
        { _id: '6', _match: [ 'manufacturer:Tesla' ] },
        { _id: '7', _match: [ 'brand:Tesla', 'manufacturer:Tesla' ] },
        { _id: '8', _match: [ 'brand:Tesla' ] },
        { _id: '9', _match: [ 'manufacturer:Tesla' ] } 
      ])
    })
})

test('can GET specifying 2 fields (GET from all fields)', t => {
  t.plan(1)
  global[indexName].GET({
    field: 'brand',
    value: {
      gte: 'Tesla',
      lte: 'Tesla'
    }
  })
    .then(result => {
      t.looseEqual(result, [
        { _id: '7', _match: [ 'brand:Tesla' ] },
        { _id: '8', _match: [ 'brand:Tesla' ] },
      ])
    })
})


test('can GET specifying 2 fields (GET from all fields)', t => {
  t.plan(1)
  global[indexName].GET({
    field: 'brand',
    value: 'Tesla'
  })
    .then(result => {
      t.looseEqual(result, [
        { _id: '7', _match: [ 'brand:Tesla' ] },
        { _id: '8', _match: [ 'brand:Tesla' ] },
      ])
    })
})
