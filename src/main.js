import EventEmitter from 'events'
import charwise from 'charwise'
import read from './read.js'
import write from './write.js'
import { TokenParser } from './parseToken.js'

export class Main {
  constructor (ops = {}) {
    ops = {
      caseSensitive: true,
      isLeaf: item => typeof item === 'string' || typeof item === 'number',
      stopwords: [],
      doNotIndexField: [],
      storeVectors: true,
      docExistsSpace: 'DOC', // the field used to verify that doc exists
      // with the new *Levels, this doesn't need to be async
      db: new ops.Level(ops.name, {
        keyEncoding: charwise,
        valueEncoding: 'json'
      }),
      ...ops
    }

    const tokenParser = new TokenParser(ops.caseSensitive)

    const events = new EventEmitter()

    const r = read(ops, tokenParser)
    const w = write(ops, tokenParser, events)

    r.FIELDS()
      .then(fields => tokenParser.setAvailableFields(fields))
      // timestamp with time of creation (if not created already)
      .then(() => w.TIMESTAMP())
      .then(() => events.emit('ready'))

    this.AGGREGATION_FILTER = r.AGGREGATION_FILTER
    this.AND = (tokens, pipeline) =>
      r
        .INTERSECTION(tokens.map(token => this.GET(token, pipeline)))
        .then(this.flattenMatchArrayInResults)
    this.BUCKET = r.BUCKET
    this.BUCKETS = r.BUCKETS
    this.CREATED = r.CREATED
    this.DELETE = w.DELETE
    this.DISTINCT = r.DISTINCT
    this.EVENTS = events
    this.EXIST = r.EXIST
    this.EXPORT = r.EXPORT
    this.FACETS = r.FACETS
    this.FIELDS = r.FIELDS
    this.GET = (tokens, pipeline) =>
      r.GET(tokens, pipeline).then(this.flattenMatchArrayInResults)
    this.IMPORT = w.IMPORT
    this.LAST_UPDATED = r.LAST_UPDATED
    this.MAX = r.MAX
    this.MIN = r.MIN
    this.NOT = (...keys) =>
      r.SET_SUBTRACTION(...keys).then(this.flattenMatchArrayInResults)
    this.OBJECT = r.OBJECT
    this.OR = (tokens, pipeline) =>
      r
        .UNION(tokens.map(token => this.GET(token, pipeline)))
        .then(result => result.union)
        .then(this.flattenMatchArrayInResults)
    this.PUT = w.PUT
    this.SORT = r.SORT
    this.STORE = ops.db
    this.TIMESTAMP_LAST_UPDATED = w.TIMESTAMP_LAST_UPDATED
    this.TOKEN_PARSER = tokenParser
  }

  flattenMatchArrayInResults (results) {
    return typeof results === 'undefined'
      ? undefined
      : results.map(result => {
        // Sort _match consistently (FIELD -> VALUE -> SCORE)
        result._match = result._match
          .flat(Infinity)
          .map(m => (typeof m === 'string' ? JSON.parse(m) : m))
          .sort((a, b) => {
            if (a.FIELD < b.FIELD) return -1
            if (a.FIELD > b.FIELD) return 1
            if (a.VALUE < b.VALUE) return -1
            if (a.VALUE > b.VALUE) return 1
            if (a.SCORE < b.SCORE) return -1
            if (a.SCORE > b.SCORE) return 1
            return 0
          })
        return result
      })
  }
}
