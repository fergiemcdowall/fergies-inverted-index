const levelup = require('levelup')
const leveldown = require('leveldown')

const db = levelup('./testdb', { db: leveldown })

