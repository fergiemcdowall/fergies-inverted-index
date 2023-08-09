import { BrowserLevel } from 'browser-level'
import { Main } from '../main.js'

export class InvertedIndex {
  constructor (ops = {}) {
    return new Main({
      Level: BrowserLevel,
      ...ops
    })
  }
}
