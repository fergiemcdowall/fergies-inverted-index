const trav = require('traverse')
const reader = require('./read.js')

module.exports = ops => {
  // TODO: set reset this to the max value every time the DB is restarted
  var incrementalId = 0

  // use trav lib to find all leaf nodes with corresponding paths
  const invertDoc = (obj, putOptions) => {
    if (obj._object == null) {
      return ({
        _id: obj._id,
        keys: []
      })
    }

    const keys = []
    trav(obj._object).forEach(function (node) {
      let searchable = true
      const fieldName = this.path
      // allowing numbers in path names create ambiguity with arrays
      // so just strip numbers from path names
        .filter(item => !Number.isInteger(+item))
        .join('.')
      if (fieldName === '_id') searchable = false
      // Skip fields that are not to be indexed
      if (putOptions.doNotIndexField.filter(
        item => fieldName.startsWith(item)
      ).length) searchable = false

      // deal with stopwords
      if (this.isLeaf && ops.stopwords.includes(this.node)) {
        searchable = false
      }

      if (searchable && this.isLeaf) {
        const key = fieldName + ':' + this.node
        // bump to lower case if not case sensitive
        keys.push(ops.caseSensitive ? key : key.toLowerCase())
      }
    })

    return {
      _id: obj._id + '', // cast to string
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

  const objectIndex = (docs, mode) => docs.map(doc => ({
    key: '￮DOC￮' + doc._id + '￮',
    type: mode,
    value: doc._object
  }))

  const reverseIndex = (acc, cur) => {
    cur.keys.forEach(key => {
      acc[key] = acc[key] || []
      acc[key].push(cur._id)
    })
    return acc
  }

  const createDeltaReverseIndex = (
    docs, putOptions
  ) => docs
    .map(doc => invertDoc(doc, putOptions))
    .reduce(reverseIndex, {})

  // const checkID = doc => {
  //   if (typeof doc._id === 'string') return doc
  //   if (typeof doc._id === 'number') return doc
  //   // else
  //   doc._id = ++incrementalId
  //   return doc
  // }

  const sanitizeID = id => {
    if (id === undefined) return ++incrementalId
    if (typeof id === 'string') return id
    if (typeof id === 'number') return id + ''
    // else
    return ++incrementalId
  }

  const availableFields = reverseIndex => [
    ...new Set(
      reverseIndex.map(item => item.key.split(':')[0])
    )
  ].map(f => ({
    type: 'put',
    key: '￮FIELD￮' + f + '￮',
    value: f
  }))

  const writer = (docs, db, mode, putOptions) => new Promise(resolve => {
    // check for _id field, autogenerate if necessary
    // TODO: get this back at some point, maybe "sanitize ID" that
    // sanitize doc._ids
    docs = docs.map(doc => {
      doc._id = sanitizeID(doc._id)
      if (doc._object) { doc._object._id = doc._id }
      return doc
    })
    putOptions = Object.assign(ops, putOptions)
    createMergedReverseIndex(
      createDeltaReverseIndex(docs, putOptions), db, mode
    ).then(mergedReverseIndex => db.batch(
      mergedReverseIndex
        .concat(
          putOptions.storeVectors
            ? objectIndex(docs, mode)
            : []
        )
        .concat(availableFields(mergedReverseIndex))
      , e => resolve(docs.map(doc => ({
        _id: doc._id,
        operation: (mode === 'del') ? 'DELETE' : (mode === 'del') ? 'PUT' : 'AMBIGUOUS',
        status: doc._object ? 'OK' : 'NOT FOUND'
      })))
    ))
  })

  // docs needs to be an array of ids (strings)
  // first do an 'objects' call to get all of the documents to be
  // deleted
  const DELETE = _ids => reader(ops).OBJECT(
    _ids.map(_id => ({ _id: _id }))
  ).then(
    docs => writer(docs, ops.db, 'del', {})
  )

  // when importing, index is first cleared. This means that "merges"
  // are not currently supported
  const IMPORT = index => ops.db.clear().then(() =>
    ops.db.batch(index.map(
      entry => Object.assign(entry, { type: 'put' })
    ))
  )

  const PUT = (docs, putOptions = {}) => writer(
    docs.map(doc => ({
      _id: doc._id,
      _object: doc
    })), ops.db, 'put', putOptions
  ).then(
    docs => docs.map(
      doc => ({
        _id: doc._id,
        status: 'OK',
        operation: 'PUT'
      })
    )
  )

  return {
    DELETE: DELETE,
    IMPORT: IMPORT,
    PUT: PUT
  }
}
