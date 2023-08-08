import test from 'tape'

const { InvertedIndex } = await import(
  '../../src/' + process.env.FII_ENTRYPOINT
)

// import { InvertedIndex } from '../../src/browser.js'

console.log('boooooom')

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'init'
const global = {}

const data = [
  {
    _id: 'a',
    title: 'quite a cool document',
    body: {
      text: 'this document is really cool cool cool',
      metadata: 'coolness documentness'
    },
    importantNumber: 5000
  },
  {
    _id: 'b',
    title: 'quite a cool document',
    body: {
      text: 'this document is really cool bananas',
      metadata: 'coolness documentness'
    },
    importantNumber: 500
  },
  {
    _id: 'c',
    title: 'something different',
    body: {
      text: 'something totally different',
      metadata: 'coolness documentness'
    },
    importantNumber: 200
  }
]

test('create index', t => {
  t.plan(1)
  new InvertedIndex({ name: indexName }).then(db => {
    global[indexName] = db
    t.ok(db, !undefined)
  })
})

test('can add some data', t => {
  t.plan(1)
  global[indexName]
    .PUT([
      {
        _id: 1,
        colour: 'Black',
        drivetrain: 'Diesel'
      }
    ])
    .then(t.pass)
})

test('get simple AND', t => {
  t.plan(1)

  global[indexName].AND(['drivetrain:Diesel', 'colour:Black']).then(result =>
    t.deepEqual(result, [
      {
        _id: 1,
        _match: [
          { FIELD: 'colour', VALUE: 'Black' },
          { FIELD: 'drivetrain', VALUE: 'Diesel' }
        ]
      }
    ])
  )
})
