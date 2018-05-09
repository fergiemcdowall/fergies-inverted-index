module.exports = function (db) {

  const get = function (key) {
    return new Promise((resolve, reject) => {
      db.get(key).then(docIDs => {
        Promise.all(docIDs.map(id => {
          return getDoc(id)
        })).then(docs => {
          resolve(docs)
        })
      })
    })
  }

  const getDoc = function (id) {
    return new Promise((resolve, reject) => {
      db.get('!DOC￮' + id + '￮').then(doc => {
        resolve(doc)
      })
    })
  }

  return {
    get: get
  }
}
