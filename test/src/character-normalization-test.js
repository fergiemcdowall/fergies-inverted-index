import diacritic from 'diacritic'
import test from 'tape'
import { InvertedIndex } from 'fergies-inverted-index'

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'charnorm'

test('some simple GETs', async function (t) {
  const { GET, OR, PUT } = await new InvertedIndex({ name: indexName })
  t.pass('db initialized')

  await PUT(
    ['jeg bor her', 'jeg bør det', 'jeg er ikke'].map(str => str.split(' '))
  )
  t.pass('data indexed')

  t.deepEqual(await GET('bor'), [
    { _id: 1, _match: [{ FIELD: '', VALUE: 'bor' }] }
  ])

  t.deepEqual(await GET('bør'), [
    { _id: 2, _match: [{ FIELD: '', VALUE: 'bør' }] }
  ])

  t.equals(diacritic.clean('ø'), 'o')

  // can add a query processing pipeline that bumps 'bør' to 'bor'
  t.deepEqual(
    await GET(
      'bør',
      token =>
        new Promise(resolve => {
          token.VALUE.GTE = diacritic.clean(token.VALUE.GTE)
          token.VALUE.LTE = diacritic.clean(token.VALUE.LTE)
          return resolve(token)
        })
    ),
    [{ _id: 1, _match: [{ FIELD: '', VALUE: 'bor' }] }]
  )

  // can add a query processing pipeline that bumps 'bør' to OR('bor', 'bør')
  t.deepEqual(
    await GET(
      'bør',
      token =>
        new Promise(resolve => {
          return resolve(
            OR([token.VALUE.GTE, diacritic.clean(token.VALUE.GTE)])
          )
        })
    ),
    [
      { _id: 2, _match: [{ FIELD: '', VALUE: 'bør' }] },
      { _id: 1, _match: [{ FIELD: '', VALUE: 'bor' }] }
    ]
  )
})
