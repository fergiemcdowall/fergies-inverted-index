const { InvertedIndex } = await import(
  '../../src/' + process.env.FII_ENTRYPOINT
)
import test from 'tape'

const sandbox = 'test/sandbox/'

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
    colour: 'Black',
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
    make: 'BMW',
    colour: 'Silver',
    year: 2015,
    price: 81177,
    model: '3-series',
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

test('simple OR', async t => {
  const { AND, GET, PUT, OR } = await new InvertedIndex({
    name: sandbox + 'OR'
  })
  t.deepEquals(await PUT(data), [
    { _id: 0, operation: 'PUT', status: 'CREATED' },
    { _id: 1, operation: 'PUT', status: 'CREATED' },
    { _id: 2, operation: 'PUT', status: 'CREATED' },
    { _id: 3, operation: 'PUT', status: 'CREATED' },
    { _id: 4, operation: 'PUT', status: 'CREATED' },
    { _id: 5, operation: 'PUT', status: 'CREATED' },
    { _id: 6, operation: 'PUT', status: 'CREATED' },
    { _id: 7, operation: 'PUT', status: 'CREATED' },
    { _id: 8, operation: 'PUT', status: 'CREATED' },
    { _id: 9, operation: 'PUT', status: 'CREATED' }
  ])

  t.deepEquals(await GET('Volvo'), [
    { _id: 1, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 2, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 3, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 9, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] }
  ])

  t.deepEquals(await OR(['Volvo', 'Red']), [
    { _id: 1, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 2, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 3, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 9, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
    { _id: 5, _match: [{ FIELD: 'colour', VALUE: 'Red' }] }
  ])

  t.deepEquals(await OR(['volvo', 'red']), [])

  t.deepEquals(
    await OR(
      ['volvo', 'red'],
      token =>
        new Promise(resolve => {
          token.VALUE.GTE = token.VALUE.GTE.replace(/^\w/, c => c.toUpperCase())
          token.VALUE.LTE = token.VALUE.LTE.replace(/^\w/, c => c.toUpperCase())
          return resolve(token)
        })
    ),
    [
      { _id: 1, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
      { _id: 2, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
      { _id: 3, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
      { _id: 9, _match: [{ FIELD: 'make', VALUE: 'Volvo' }] },
      { _id: 5, _match: [{ FIELD: 'colour', VALUE: 'Red' }] }
    ]
  )

  // test an advanced replace using query processing
  const queryPipeline = token =>
    new Promise(resolve =>
      resolve(
        token.VALUE.GTE === token.VALUE.LTE && token.VALUE.GTE === 'eurodiesel'
          ? AND(['drivetrain:Diesel', OR(['make:Volvo', 'make:BMW'])])
          : token
      )
    )
  t.deepEquals(await OR(['eurodiesel', 'Red'], queryPipeline), [
    {
      _id: 4,
      _match: [
        { FIELD: 'drivetrain', VALUE: 'Diesel' },
        { FIELD: 'make', VALUE: 'BMW' }
      ]
    },
    { _id: 5, _match: [{ FIELD: 'colour', VALUE: 'Red' }] }
  ])
})
