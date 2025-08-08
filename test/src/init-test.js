import test from 'tape'
import { InvertedIndex } from 'fergies-inverted-index'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'init'

const global = {}

test('create index', t => {
  t.plan(1)
  const db = new InvertedIndex({ name: indexName })
  global[indexName] = db
  t.ok(db, !undefined)
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
    .then(() => t.pass())
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
