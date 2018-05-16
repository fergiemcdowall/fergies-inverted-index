const trav = require('traverse')

module.exports = function (db) {
  // TODO: Read out the highest incrementalID from the store
  // TODO: Can instantiate DBs in parallell with the same name

  var incrementalId = 0
  var q = []

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
      var searchable = true
      this.path.forEach(item => {
        if (item.substring(0, 1) === '_') // denotes that a field is indexable
          searchable = true
      })
      if (searchable && this.isLeaf) {
        var key = that.path.map(item => {
          if (!isNaN(item)) return '_Array'
          return item
        }).join('.') + '.' + that.node
        if (Array.isArray(this.parent.node)) {
          key = that.path.slice(0, this.path.length - 1).join('.') + '.' + that.node
        }
        keyValues.push({
          key: key,
          //key: that.path.concat([that.node]),
          value: obj._id
        })
      }
    })
    return keyValues
  }

  // ide == inverted doc entry
  const mergeKey = function (ide) {
    return new Promise((resolve, reject) => {
      // get existing Set of docIDs for this token
      // rie == reverse index entries
      db.get(ide.key).then(rie => {
        // NOTE: need to munge Sets into Arrays because of levelup
        // TODO: sorting
        return resolve({
          key: ide.key,
          value: [...new Set(rie).add(ide.value)]
        })
      }).catch(e => {
        return resolve({
          key: ide.key,
          value: [ide.value] 
        })
      })
    })
  }

  const mergeIntoReverseIndex = function (doc) {
    return new Promise((resolve, reject) => {
      Promise.all(invertDoc(doc).map(mergeKey))
             .then(result => {
               resolve(result)
             })
    })
  }

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
              resolve(doc._id) // send notification that indexing is done
            })

          })          
        }
      }, 5);
    })
  }

  const bat = function (batch, progress, done) {
    var finished = 0
    batch.forEach(doc => {
      put(doc).then(docID => {
        if (finished++ === batch.length) return done()
        return progress({
          docID: docID,
          progress: finished / batch.length
        })
      })
    })
  }
  
  return {
    bat: bat,
    put: put
  }
  
}
