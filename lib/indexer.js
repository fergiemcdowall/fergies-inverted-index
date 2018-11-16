const inputChunks = []
const rl = require('readline')
const fin = require('../lib/index.js')
const JSONStream = require('JSONStream')

const reader = rl.createInterface({ input: process.stdin })

reader.on('line', line => { inputChunks.push(line) })
reader.on('close', () => {
  try {
    // can JSONify?
    var JSONifiedInput = JSON.parse(inputChunks.join(''))
    // is array?
    if (!Array.isArray(JSONifiedInput)) throw new Error ('Input should be a JSON Array')
  } catch (e) {
    console.error('Err: ' + e)
  }
  fin({
    name: 'tmp'
  }).then(fin => {
    fin.PUT(JSONifiedInput)
       .then(result => {
         fin.STORE.createReadStream()
            .pipe(JSONStream.stringify('[\n', ',\n', '\n]\n'))
            .pipe(process.stdout)
       })
  })

  
})
