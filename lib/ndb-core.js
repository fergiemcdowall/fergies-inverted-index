const encode = require('encoding-down')
const leveldown = require('leveldown')
const levelup = require('levelup')
const trav = require('traverse')


module.exports = function () {
  var db = {}
  var incrementalId = 0
  var q = []

  // TODO: Read out the highest incrementalID from the store

  // TODO: Can instantiate DBs in parallell with the same name

  const put = function (doc) {
    return new Promise((resolve, reject) => {
      // check to see if doc has _id, if not generate one (++counter)
      doc._id = doc._id || ++incrementalId
      // queue doc for indexing
      q.push(doc._id)
      // keep on checking queue to see if it time to index
      var interval = setInterval(function () {
        if (q[0] === doc._id) { // doc is at front of queue
          clearInterval(interval) // stop looking at queue
          mergeIntoReverseIndex(doc).then(reverseIndexEntries => {
            Promise.all(
              reverseIndexEntries
                .map(entry => addEntryToDataStore(entry))
                .concat(addEntryToDataStore({
                  key: '!DOC￮' + doc._id + '￮',
                  value: doc
                }))
              // TODO: put incrementalID back into db
            ).then(results => {
              q.shift() // remove doc from queue
              resolve('done') // send notification that indexing is done
            })

          })          
        }
      }, 100);    
    })
  }


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
      

  const addEntryToDataStore = function (entry) {
    // TODO: truncate long value sets by dividing them in two
    return new Promise((resolve, reject) => {
      db.put(entry.key, entry.value).then(() => resolve('done'))
    })
  }

  
  const invertDoc = function (obj) {
    var keyValues = []
    trav(obj).forEach(function(node) {
      var that = this
      var searchable = false
      this.path.forEach(item => {
        if (item.substring(0, 1) === '_') // denotes that a field is indexable
          searchable = true
      })
      if (searchable && this.isLeaf) keyValues.push({
        key: that.path.join('.') + '.' + that.node,
        value: obj._id
      })
    })
    return keyValues
  }

  const mergeIntoReverseIndex = function (doc) {
    return new Promise((resolve, reject) => {
      Promise.all(
        invertDoc(doc).map(item => {
          return new Promise((res, rej) => {
            db.get(item.key).then(val => {
              val.push(item.value)
              item.value = val.sort() // TODO: sorting
              res(item)
            }).catch(e => {
              item.value = [ item.value ]
              res(item)
            })
          })
        })
      ).then(result => resolve(result))
    })
  }

  return new Promise((resolve, reject) => {
    levelup(encode(leveldown('naturaldb'), {
      valueEncoding: 'json'
    }), (err, store) => {
      if (err) return reject(err)
      db = store
      return resolve ({
        put: put,
        get: get
      })
    })
  })}
      

