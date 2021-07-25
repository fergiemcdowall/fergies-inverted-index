module.exports.setCaseSensitivity = (token, caseSensitive) => {
  const setCase = str =>
    caseSensitive || typeof str !== 'string' ? str : str.toLowerCase()
  return {
    FIELD: token.FIELD.map(setCase),
    VALUE: {
      GTE: setCase(token.VALUE.GTE),
      LTE: setCase(token.VALUE.LTE)
    }
  }
}

// If this token is a stopword then return 'undefined'
module.exports.removeStopwords = (token, stopwords) =>
  token.VALUE.GTE === token.VALUE.LTE && stopwords.includes(token.VALUE.GTE)
    ? undefined
    : token
