import { ClassicLevel } from 'classic-level'
import { Main } from '../main.js'

export class InvertedIndex {
  constructor (ops = {}) {
    return new Main({
      Level: ClassicLevel,
      ...ops
    })
  }
}
