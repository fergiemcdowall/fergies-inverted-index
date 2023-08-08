import levelOptions from './options.js'
import { BrowserLevel } from 'browser-level'
import { Main as MainInvertedIndex } from './main.js'

export class InvertedIndex {
  constructor (ops = {}) {
    return new MainInvertedIndex({
      db: new BrowserLevel(ops.name || 'fii', levelOptions),
      ...ops
    })
  }
}
