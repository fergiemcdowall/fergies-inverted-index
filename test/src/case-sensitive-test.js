const { InvertedIndex } = await import(
  '../../src/' + process.env.FII_ENTRYPOINT
)
import test from 'tape'

const sandbox = 'test/sandbox/'
// TODO: why does 'case-sensitive-test' break everything here?
const caseSensitiveIdx = sandbox + 'case-sensitive-testx'
const caseInsensitiveIdx = sandbox + 'case-insensitive-test'

test('create a case sensitive index', t => {
  t.plan(1)
  new InvertedIndex({
    name: caseSensitiveIdx,
    caseSensitive: true
  }).then(db => {
    global[caseSensitiveIdx] = db
    t.ok(db, !undefined)
  })
})

test('create a case INsensitive index', t => {
  t.plan(1)
  new InvertedIndex({
    name: caseInsensitiveIdx,
    caseSensitive: false
  }).then(db => {
    global[caseInsensitiveIdx] = db
    t.ok(db, !undefined)
  })
})

test('can add some data', t => {
  const data = [
    {
      _id: 0,
      make: 'Tesla',
      manufacturer: 'Volvo',
      brand: 'Volvo'
    },
    {
      _id: 1,
      make: 'BMW',
      manufacturer: 'Volvo',
      brand: 'Volvo'
    },
    {
      _id: 2,
      make: 'tesla',
      manufacturer: 'Tesla',
      brand: 'Volvo'
    },
    {
      _id: 3,
      make: 'Tesla',
      manufacturer: 'Volvo',
      brand: 'BMW'
    },
    {
      _id: 4,
      make: 'Volvo',
      manufacturer: 'Volvo',
      brand: 'Volvo'
    },
    {
      _id: 5,
      make: 'Volvo',
      manufacturer: 'Tesla',
      brand: 'Volvo'
    },
    {
      _id: 6,
      make: 'Tesla',
      manufacturer: 'Tesla',
      brand: 'BMW'
    },
    {
      _id: 7,
      make: 'BMW',
      manufacturer: 'Tesla',
      brand: 'Tesla'
    },
    {
      _id: 8,
      Make: 'Volvo',
      manufacturer: 'BMW',
      brand: 'Tesla'
    },
    {
      _id: 9,
      make: 'BMW',
      manufacturer: 'Tesla',
      brand: 'Volvo'
    }
  ]
  t.plan(1)
  global[caseSensitiveIdx]
    .PUT(data)
    .then(() => global[caseInsensitiveIdx].PUT(data))
    .then(t.pass)
})

test('Case means that no results are returned', t => {
  t.plan(1)
  global[caseSensitiveIdx].GET('teSLA').then(result => {
    t.deepEqual(result, [])
  })
})

test('Match case and return results -> make:Tesla', t => {
  t.plan(1)
  global[caseSensitiveIdx].GET('make:Tesla').then(result => {
    t.deepEqual(result, [
      { _id: 0, _match: [{ FIELD: 'make', VALUE: 'Tesla' }] },
      { _id: 3, _match: [{ FIELD: 'make', VALUE: 'Tesla' }] },
      { _id: 6, _match: [{ FIELD: 'make', VALUE: 'Tesla' }] }
    ])
  })
})

test('Match case and return results -> make:tesla', t => {
  t.plan(1)
  global[caseSensitiveIdx].GET('make:tesla').then(result => {
    t.deepEqual(result, [
      { _id: 2, _match: [{ FIELD: 'make', VALUE: 'tesla' }] }
    ])
  })
})

test('Match case and return results -> make:Volvo', t => {
  t.plan(1)
  global[caseSensitiveIdx].GET('make:Volvo').then(result => {
    t.deepEqual(result, [
      { _id: 4, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
      { _id: 5, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] }
    ])
  })
})

test('Match case and return results -> Make:volvo', t => {
  t.plan(1)
  global[caseSensitiveIdx].GET('Make:Volvo').then(result => {
    t.deepEqual(result, [
      { _id: 8, _match: [{ FIELD: 'Make', VALUE: 'Volvo' }] }
    ])
  })
})

test('Match even with weird case', t => {
  const { GET, SORT } = global[caseInsensitiveIdx]
  t.plan(1)
  console.log('TODO -> possible race condition here')
  GET('teSLA')
    .then(SORT)
    .then(result => {
      t.deepEqual(result, [
        { _id: 0, _match: [{ FIELD: 'make', VALUE: 'tesla' }] },
        {
          _id: 2,
          _match: [
            { FIELD: 'make', VALUE: 'tesla' },
            { FIELD: 'manufacturer', VALUE: 'tesla' }
          ]
        },
        { _id: 3, _match: [{ FIELD: 'make', VALUE: 'tesla' }] },
        { _id: 5, _match: [{ FIELD: 'manufacturer', VALUE: 'tesla' }] },
        {
          _id: 6,
          _match: [
            { FIELD: 'make', VALUE: 'tesla' },
            { FIELD: 'manufacturer', VALUE: 'tesla' }
          ]
        },
        {
          _id: 7,
          _match: [
            { FIELD: 'brand', VALUE: 'tesla' },
            { FIELD: 'manufacturer', VALUE: 'tesla' }
          ]
        },
        { _id: 8, _match: [{ FIELD: 'brand', VALUE: 'tesla' }] },
        { _id: 9, _match: [{ FIELD: 'manufacturer', VALUE: 'tesla' }] }
      ])
    })
})

test('Match case and return results -> make:Tesla', t => {
  t.plan(1)
  global[caseInsensitiveIdx].GET('make:Tesla').then(result => {
    t.deepEqual(result, [
      { _id: 0, _match: [{ FIELD: 'make', VALUE: 'tesla' }] },
      { _id: 2, _match: [{ FIELD: 'make', VALUE: 'tesla' }] },
      { _id: 3, _match: [{ FIELD: 'make', VALUE: 'tesla' }] },
      { _id: 6, _match: [{ FIELD: 'make', VALUE: 'tesla' }] }
    ])
  })
})

test('Match case and return results -> make:tesla', t => {
  t.plan(1)
  global[caseInsensitiveIdx].GET('make:tesla').then(result => {
    t.deepEqual(result, [
      { _id: 0, _match: [{ FIELD: 'make', VALUE: 'tesla' }] },
      { _id: 2, _match: [{ FIELD: 'make', VALUE: 'tesla' }] },
      { _id: 3, _match: [{ FIELD: 'make', VALUE: 'tesla' }] },
      { _id: 6, _match: [{ FIELD: 'make', VALUE: 'tesla' }] }
    ])
  })
})

test('Match case and return results -> make:volvo', t => {
  t.plan(1)
  global[caseInsensitiveIdx].GET('make:Volvo').then(result => {
    t.deepEqual(result, [
      { _id: 4, _match: [{ FIELD: 'make', VALUE: 'volvo' }] },
      { _id: 5, _match: [{ FIELD: 'make', VALUE: 'volvo' }] },
      { _id: 8, _match: [{ FIELD: 'make', VALUE: 'volvo' }] }
    ])
  })
})

test('Match case and return results -> MAKE:VOLVO', t => {
  t.plan(1)
  global[caseInsensitiveIdx].GET('MAKE:VOLVO').then(result => {
    t.deepEqual(result, [
      { _id: 4, _match: [{ FIELD: 'make', VALUE: 'volvo' }] },
      { _id: 5, _match: [{ FIELD: 'make', VALUE: 'volvo' }] },
      { _id: 8, _match: [{ FIELD: 'make', VALUE: 'volvo' }] }
    ])
  })
})
