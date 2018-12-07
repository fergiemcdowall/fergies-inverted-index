const trav = require('traverse')
const reader = require('./map.obj.js')

// TODO: set reset this to the max value every time the DB is restarted
var incrementalId = 0

// use trav lib to find all leaf nodes with corresponding paths
const invertDoc = function (obj) {
  var keys = []
  trav(obj).forEach(function (node) {
    var searchable = true
    this.path.forEach(item => {
      // make fields beginning with ! non-searchable
      if (item.substring(0, 1) === '!') searchable = false
      // _id field should not be searchable
      if (item === '_id') searchable = false
    })
    if (searchable && this.isLeaf) {
      var key = this.path.join('.') + ':' + this.node
      if (Array.isArray(this.parent.node)) {
        key = this.path.slice(0, this.path.length - 1).join('.') + ':' + this.node
      }
      keys.push(key)
    }
  })
  return {
    _id: obj._id || ++incrementalId, // generate _id if not present
    keys: keys
  }
}

// TODO: merging indexes needs a proper test
const createMergedReverseIndex = (index, db, mode) => {
  // does a wb.get that simply returns "[]" rather than rejecting the
  // promise so that you can do Promise.all without breaking on keys
  // that dont exist in the db
  const gracefullGet = key => new Promise((resolve, reject) => {
    db.get(key).then(resolve).catch(e => resolve([]))
  })
  const indexKeys = Object.keys(index)
  return Promise.all(
    indexKeys.map(gracefullGet)
  ).then(currentValues => currentValues.map((cur, i) => {
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
  }))
}


const objectIndex = (docs, mode) => docs.map(doc => {
  return {
    key: '!DOC￮' + doc._id + '￮',
    type: mode,
    value: doc
  }
})


const reverseIndex = (acc, cur) => {
  cur.keys.forEach(key => {
    acc[key] = acc[key] || []
    acc[key].push(cur._id)
  })
  return acc
}


const createDeltaReverseIndex = docs => docs
  .map(invertDoc)
  .reduce(reverseIndex, {})

const checkID = doc => {
  if (typeof doc._id === 'string') return doc
  if (typeof doc._id === 'number') return doc
  // else
  doc._id = incrementalId++
  return doc
}

const writer = (docs, db, mode) => {
  // check for _id field, autogenerate if necessary
  docs = docs.map(checkID)
  return new Promise((resolve, reject) => {
    createMergedReverseIndex(createDeltaReverseIndex(docs), db, mode)
      .then(mergedReverseIndex => {
        db.batch(mergedReverseIndex.concat(objectIndex(docs, mode)), e => resolve(docs.map(doc => doc._id)))
      })
  })
}

module.exports = db => {
  // docs needs to be an array of ids (strings)
  // first do an 'objects' call to get all of the documents to be
  // deleted
  const DELETE = _ids =>
    reader(db).OBJECT(
      _ids.map(_id => {
        return {
          _id: _id
        }
      })
    ).then(docs => writer(docs, db, 'del'))

  const PUT = docs => writer(docs, db, 'put')

  return {
    DELETE: DELETE,
    PUT: PUT
  }
}
