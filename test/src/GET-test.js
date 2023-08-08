const { InvertedIndex } = await import(
  '../../src/' + process.env.FII_ENTRYPOINT
)
import test from 'tape'
import sw from 'stopword'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'GET'

const data = [
  {
    _id: 0,
    make: 'BMW',
    colour: 'Blue',
    year: 2011,
    price: 8398,
    model: '3-series',
    drivetrain: 'Hybrid'
  },
  {
    _id: 1,
    make: 'Volvo',
    colour: 'Black',
    year: 2016,
    price: 442742,
    model: 'XC90',
    drivetrain: 'Petrol'
  },
  {
    _id: 2,
    make: 'Volvo',
    colour: 'Silver',
    year: 2008,
    price: 33114,
    model: 'XC90',
    drivetrain: 'Hybrid'
  },
  {
    _id: 3,
    make: 'Volvo',
    colour: 'Silver',
    year: 2007,
    price: 0,
    model: 'XC60',
    drivetrain: 'Hybrid'
  },
  {
    _id: 4,
    make: 'BMW',
    colour: ['Black', 999],
    year: 2000,
    price: 10,
    model: '5-series',
    drivetrain: 'Diesel'
  },
  {
    _id: 5,
    make: 'Tesla',
    colour: 'Red',
    year: 2014,
    price: 100000000000000000,
    model: 'X',
    drivetrain: 'Electric'
  },
  {
    _id: 6,
    make: 'Tesla',
    colour: 'Blue',
    year: 2017,
    price: 9,
    model: 'S',
    drivetrain: 'Electric'
  },
  {
    _id: 7,
    make: 'BMW',
    colour: 'Black',
    year: 2019,
    price: 57280,
    model: '3-series',
    drivetrain: 'Petrol'
  },
  {
    _id: 8,
    make: 'Opel',
    colour: 'Silver',
    year: 2015,
    price: 81177,
    model: 'Astra',
    drivetrain: 'Petrol'
  },
  {
    _id: 9,
    make: 'Volvo',
    colour: 'White',
    year: 2004,
    price: 3751,
    model: 'XC90',
    drivetrain: 'Hybrid'
  }
]

test('some simple GETs', async function (t) {
  const { GET, PUT } = await new InvertedIndex({
    name: indexName,
    isLeaf: item =>
      typeof item === 'string' ||
      typeof item === 'number' ||
      Array.isArray(item)
  })
  t.pass('db initialized')

  await PUT(data)
  t.pass('data indexed')

  t.deepEqual(await GET('make:Volvo'), [
    { _id: 1, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 2, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 3, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 9, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] }
  ])

  t.deepEqual(await GET('colour:Black'), [
    { _id: 1, _match: [{ FIELD: 'colour', VALUE: 'Black' }] },
    { _id: 7, _match: [{ FIELD: 'colour', VALUE: 'Black' }] },
    { _id: 4, _match: [{ FIELD: 'colour', VALUE: 'Black', SCORE: 999 }] }
  ])
})

test('testing single query replacement', async function (t) {
  const { GET, PUT } = await new InvertedIndex({
    name: indexName + '_1',
    queryReplace: {
      swedemachine: ['Volvo']
    }
  })
  t.pass('db initialized')

  await PUT(data)
  t.pass('data indexed')

  t.deepEqual(await GET('make:Volvo'), [
    { _id: 1, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 2, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 3, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 9, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] }
  ])

  t.deepEqual(await GET('make:swedemachine'), [
    { _id: 1, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 2, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 3, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 9, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] }
  ])
})

test('testing query with multiple replacements', async function (t) {
  const { GET, PUT, OR } = await new InvertedIndex({
    name: indexName + '_2',
    queryReplace: {
      eurocars: ['Volvo', 'BMW', 'Opel']
    }
  })
  t.pass('db initialized')

  await PUT(data)
  t.pass('data indexed')

  t.deepEqual(await OR(['make:Volvo', 'make:BMW', 'make:Opel']), [
    { _id: 1, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 2, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 3, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 9, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 0, _match: [{ FIELD: 'make', VALUE: 'BMW' }] },
    { _id: 4, _match: [{ FIELD: 'make', VALUE: 'BMW' }] },
    { _id: 7, _match: [{ FIELD: 'make', VALUE: 'BMW' }] },
    { _id: 8, _match: [{ FIELD: 'make', VALUE: 'Opel' }] }
  ])

  t.deepEqual(await GET('make:eurocars'), [
    { _id: 1, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 2, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 3, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 9, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 0, _match: [{ FIELD: 'make', VALUE: 'BMW' }] },
    { _id: 4, _match: [{ FIELD: 'make', VALUE: 'BMW' }] },
    { _id: 7, _match: [{ FIELD: 'make', VALUE: 'BMW' }] },
    { _id: 8, _match: [{ FIELD: 'make', VALUE: 'Opel' }] }
  ])
})

test('testing case sensitivity', async function (t) {
  const { GET, PUT } = await new InvertedIndex({
    name: indexName + '_3',
    caseSensitive: true
  })
  t.pass('db initialized')

  await PUT(data)
  t.pass('data indexed')

  t.deepEqual(await GET('make:volvo'), [])
  t.deepEqual(await GET('make:Volvo'), [
    { _id: 1, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 2, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 3, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 9, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] }
  ])
})

test('testing stopwords, empty and non-existant tokens', async function (t) {
  const { GET, PUT } = await new InvertedIndex({
    name: indexName + '_4',
    stopwords: sw.eng
  })
  t.pass('db initialized')

  await PUT(data)
  t.pass('data indexed')

  t.deepEqual(await GET(), undefined)
  t.deepEqual(await GET('thisDoesNotExist'), [])
  t.deepEqual(await GET('this'), undefined)
  try {
    await GET(['this'])
  } catch (e) {
    t.equals(e.toString(), 'Error: token cannot be Array')
  }
})
