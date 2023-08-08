import levelOptions from './options.js'
import { Main } from './main.js'
import { ClassicLevel } from 'classic-level'

export class InvertedIndex {
  constructor (ops = {}) {
    return new Main({
      db: new ClassicLevel(ops.name || 'fii', levelOptions),
      ...ops
    })
  }
}
