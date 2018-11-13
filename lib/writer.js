const trav = require('traverse')
const reader = require('./map.obj.js')

// var incrementalId = 0 TODO: implement auto ID

const invertDoc = function (obj) {
  var keys = []
  trav(obj).forEach(function (node) {
    var that = this
    var searchable = true
    this.path.forEach(item => {
      // denotes that a field is indexable
      if (item.substring(0, 1) === '_') searchable = true
    })
    if (searchable && this.isLeaf) {
      var key = that.path.map(item => {
        if (!isNaN(item)) return '_Array'
        return item
      }).join('.') + '.' + that.node
      if (Array.isArray(this.parent.node)) {
        key = that.path.slice(0, this.path.length - 1).join('.') + '.' + that.node
      }
      keys.push(key)
    }
  })
  return {
    _id: obj._id,
    keys: keys
  }
}

const reverseIndex = function (acc, cur) {
  cur.keys.forEach(key => {
    acc[key] = acc[key] || []
    acc[key].push(cur._id)
  })
  return acc
}

const createMergedReverseIndex = function (index, db, mode) {
  const gracefullGet = function (key) {
    // does a wb.get that simply returns "[]" rather than rejecting the
    // promise so that you can do Promise.all without breaking on keys
    // that dont exist in the db
    return new Promise((resolve, reject) => {
      db.get(key).then(resolve).catch(e => resolve([]))
    })
  }
  return new Promise((resolve, reject) => {
    const indexKeys = Object.keys(index)
    Promise.all(indexKeys.map(gracefullGet))
      .then(currentValues => {
        return resolve(currentValues.map((cur, i) => {
          // set of current values in store
          var curSet = new Set(cur)
          // set of keys in delta index that is being merged in
          var deltaSet = new Set(index[indexKeys[i]])
          if (mode === 'put') {
            return {
              key: indexKeys[i],
              type: mode,
              value: [...new Set([...curSet, ...deltaSet])].sort() // union
            }
          } else if (mode === 'del') {
            // difference
            var newSet = [...new Set(
              [...curSet].filter(x => !deltaSet.has(x))
            )]
            return {
              key: indexKeys[i],
              type: (newSet.length === 0) ? 'del' : 'put',
              value: newSet
            }
          }
        }
        ))
      })
  })
}

const objectIndex = function (docs, mode) {
  return docs.map(doc => {
    return {
      key: '!DOC￮' + doc._id + '￮',
      type: mode,
      value: doc
    }
  })
}

const createDeltaReverseIndex = function (docs) {
  return docs
    .map(invertDoc)
    .reduce(reverseIndex, {})
}

const writer = function (docs, db, mode) {
  return new Promise((resolve, reject) => {
    createMergedReverseIndex(createDeltaReverseIndex(docs), db, mode)
      .then(mergedReverseIndex => {
        db.batch(
          mergedReverseIndex.concat(objectIndex(docs, mode))
        ).then(db.write)
          .then(resolve(docs.map(doc => doc._id)))
      })
  })
}

module.exports = function (db) {
  // docs needs to be an array of ids (strings)
  const DELETE = function (_ids) {
    return new Promise((resolve, reject) => {
    // first do an 'objects' call to get all of the documents to be
    // deleted
      reader(db).OBJECT(
        _ids
          .map(_id => {
            return {
              _id: _id
            }
          }))
        .then(docs => {
          return resolve(writer(docs, db, 'del'))
        })
    })
  }

  const PUT = function (docs) {
    return writer(docs, db, 'put')
  }

  return {
    DELETE: DELETE,
    PUT: PUT
  }
}
