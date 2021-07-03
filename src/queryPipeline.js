module.exports.queryCaseSensitive = ({ token, ops }) => {
  const setCase = str =>
    ops.caseSensitive || typeof str !== 'string' ? str : str.toLowerCase()
  return {
    token: {
      FIELD: token.FIELD.map(setCase),
      VALUE: {
        GTE: setCase(token.VALUE.GTE),
        LTE: setCase(token.VALUE.LTE)
      }
    },
    ops: ops
  }
}

// If this token is a stopword then return 'undefined'
module.exports.queryStopwords = ({ token, ops }) => ({
  token:
    token.VALUE.GTE === token.VALUE.LTE &&
    ops.stopwords.includes(token.VALUE.GTE)
      ? undefined
      : token,
  ops
})
