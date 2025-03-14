// polyfill- HI and LO coming in next version of charwise
const charwise = {}
charwise.LO = null
charwise.HI = undefined
// key might be object or string like this
// <fieldname>:<value>. Turn key into json object that is of the
// format {FIELD: ..., VALUE: {GTE: ..., LTE ...}}
export class TokenParser {
  availableFields = []
  #caseSensitive

  constructor (caseSensitive) {
    this.#caseSensitive = caseSensitive
  }

  setAvailableFields = availableFields => {
    this.availableFields = availableFields
  }

  #setCaseSensitivity = token => {
    const setCase = str =>
      this.#caseSensitive || typeof str !== 'string' ? str : str.toLowerCase()
    return {
      FIELD: token.FIELD.map(setCase),
      VALUE: {
        GTE: setCase(token.VALUE.GTE),
        LTE: setCase(token.VALUE.LTE)
      }
    }
  }

  parse (token) {
    // case: <value>
    // case: <FIELD>:<VALUE>
    // case: undefined

    if (token instanceof Promise) return token

    if (Array.isArray(token)) {
      throw new Error('token cannot be Array')
    }

    if (typeof token === 'undefined') token = {}

    if (typeof token === 'string') {
      // Find the first occurrence of ':'. Anything thereafter should be considered
      // a part of the value. This accounts for occasions where the value itself
      // has a ':'.
      if (token.indexOf(':') === -1) {
        return this.#setCaseSensitivity({
          FIELD: this.availableFields,
          VALUE: {
            GTE: token,
            LTE: token
          }
        })
      }

      const [field, ...value] = token.split(':')
      return this.#setCaseSensitivity({
        FIELD: [field],
        VALUE: {
          GTE: value.join(':'),
          LTE: value.join(':')
        }
      })
    }

    if (typeof token === 'number') {
      token = {
        VALUE: {
          GTE: token,
          LTE: token
        }
      }
    }

    // else not string or number so assume Object
    // {
    //   FIELD: [ fields ],
    //   VALUE: {
    //     GTE: gte,
    //     LTE: lte
    //   }
    // }

    // parse VALUE is null
    if (token.VALUE === null) {
      token.VALUE = {
        GTE: null,
        LTE: null
      }
    }

    // parse object string VALUE
    if (typeof token.VALUE === 'string' || typeof token.VALUE === 'number') {
      token.VALUE = {
        GTE: token.VALUE,
        LTE: token.VALUE
      }
    }

    if (
      typeof token.VALUE === 'undefined' || // VALUE is not present
      !Object.keys(token.VALUE).length // VALUE is an empty object- {}
    ) {
      token.VALUE = {
        GTE: charwise.LO,
        LTE: charwise.HI
      }
    }

    if (typeof token.VALUE.GTE === 'undefined') token.VALUE.GTE = charwise.LO
    if (typeof token.VALUE.LTE === 'undefined') token.VALUE.LTE = charwise.HI

    token.VALUE = Object.assign(token.VALUE, {
      GTE: token.VALUE.GTE,
      LTE: token.VALUE.LTE
    })

    // parse object FIELD
    if (typeof token.FIELD === 'undefined') {
      return this.#setCaseSensitivity({
        FIELD: this.availableFields,
        ...token
      })
    }
    // Allow FIELD to be an array or a string
    token.FIELD = [token.FIELD].flat()

    return this.#setCaseSensitivity(token)
  }
}
