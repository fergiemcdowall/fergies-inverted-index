const fii = require('../../')
const test = require('tape')

const sandbox = 'test/sandbox/'
const indexName = sandbox + 'stemmer'

test('init fii and index data', async t => {
  const { stemmer } = await import('stemmer')

  const { DELETE, GET, PUT, QUERY_PIPELINE_STAGES } = await fii({
    name: indexName
  })

  const data = [
    'I walk to school',
    'I am walking to school',
    'I walked to the shops',
    'I am running away',
    'I ran up the stairs'
  ].map(s => s.split(' '))
  //    .map(line => line.map(stemmer))

  t.deepEquals(await PUT(data), [
    { _id: 1, operation: 'PUT', status: 'CREATED' },
    { _id: 2, operation: 'PUT', status: 'CREATED' },
    { _id: 3, operation: 'PUT', status: 'CREATED' },
    { _id: 4, operation: 'PUT', status: 'CREATED' },
    { _id: 5, operation: 'PUT', status: 'CREATED' }
  ])

  t.deepEquals(await GET('walk'), [
    { _id: 1, _match: [{ FIELD: '', VALUE: 'walk' }] }
  ])

  t.deepEquals(await DELETE([1, 2, 3, 4, 5]), [
    { _id: 1, operation: 'DELETE', status: 'DELETED' },
    { _id: 2, operation: 'DELETE', status: 'DELETED' },
    { _id: 3, operation: 'DELETE', status: 'DELETED' },
    { _id: 4, operation: 'DELETE', status: 'DELETED' },
    { _id: 5, operation: 'DELETE', status: 'DELETED' }
  ])

  t.deepEquals(
    data.map(line => line.map(stemmer)),
    [
      ['i', 'walk', 'to', 'school'],
      ['i', 'am', 'walk', 'to', 'school'],
      ['i', 'walk', 'to', 'the', 'shop'],
      ['i', 'am', 'run', 'awai'],
      ['i', 'ran', 'up', 'the', 'stair']
    ]
  )

  t.deepEquals(
    await PUT(
      data.map(line => line.map(stemmer)),
      {
        queryPipeline: [
          ({ token, ops }) => {
            token.VALUE.GTE = stemmer(token.VALUE.GTE)
            token.VALUE.LTE = stemmer(token.VALUE.LTE)
            return {
              token,
              ops
            }
          }
        ]
      }
    ),
    [
      { _id: 6, operation: 'PUT', status: 'CREATED' },
      { _id: 7, operation: 'PUT', status: 'CREATED' },
      { _id: 8, operation: 'PUT', status: 'CREATED' },
      { _id: 9, operation: 'PUT', status: 'CREATED' },
      { _id: 10, operation: 'PUT', status: 'CREATED' }
    ]
  )

  t.deepEquals(await GET('walked'), [
    { _id: 6, _match: [{ FIELD: '', VALUE: 'walk' }] },
    { _id: 7, _match: [{ FIELD: '', VALUE: 'walk' }] },
    { _id: 8, _match: [{ FIELD: '', VALUE: 'walk' }] }
  ])
})
