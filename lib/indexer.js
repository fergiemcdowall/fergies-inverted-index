const JSONStream = require('JSONStream')
const fin = require('../lib/index.js')
const rl = require('readline')

const inputChunks = []
const reader = rl.createInterface({ input: process.stdin })

reader.on('line', line => { inputChunks.push(line) })
reader.on('close', () => {
  try {
    // can JSONify?
    var JSONifiedInput = JSON.parse(inputChunks.join(''))
    // is array?
    if (!Array.isArray(JSONifiedInput)) throw new Error('Input should be a JSON Array')
  } catch (e) {
    console.error('Err: ' + e)
  }

  // TODO: this should probably be inited with memdown so as to not
  // leave an orphan leveldb after running the script

  fin({
    name: 'tmp'
  }).then(fin => {
    fin
      .PUT(JSONifiedInput)
      .then(result => {
        fin.STORE.createReadStream()
          .pipe(JSONStream.stringify('[\n', ',\n', '\n]\n'))
          .pipe(process.stdout)
      })
  })
})
