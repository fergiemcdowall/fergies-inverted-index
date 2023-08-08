// import levelOptions from './options.js'
import { Main as MainInvertedIndex } from './main.js'
import { BrowserLevel } from 'browser-level'

export class InvertedIndex {
  constructor(ops = {}) {
    return new MainInvertedIndex({
      db: new BrowserLevel(ops.name || 'fii', { valueEncoding: 'json' }),
      ...ops
    })
  }
}
