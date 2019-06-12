'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var level = _interopDefault(require('level'));
var trav = _interopDefault(require('traverse'));

function init (db) {

  const isString = s => (typeof s === 'string');
  
  const GET = key => new Promise((resolve, reject) => {
    if (key instanceof Promise) return resolve(key) // MAGIC! Enables nested promises
    if (isString(key)) key = { gte: key, lte: key + '￮' };
    return RANGE(key).then(resolve)
  });

  // OR
  const UNION = (...keys) => Promise.all(
    keys.map(key => GET(key))
  ).then(sets => {
    // flatten
    sets = [].concat.apply([], sets);
    var setObject = sets.reduce((acc, cur) => {
      acc[cur._id] = [...(acc[cur._id] || []), cur.match];
      return acc
    }, {});
    return Object.keys(setObject).map(id => ({
      _id: id,
      match: setObject[id]
    }))
  });

  // AND
  const INTERSECTION = (...keys) => UNION(...keys).then(
    result => result.filter(
      item => (item.match.length === keys.length)
    )
  );

  // NOT
  const SET_DIFFERENCE = (a, b) => Promise.all([
    isString(a) ? GET(a): a,
    isString(b) ? GET(b): b
  ]).then(result => result[0].filter(
    item => result[1].map(item => item._id).indexOf(item._id)
  ));

  // Accepts a range of tokens (gte, lte) and returns an array of
  // document ids together with the tokens that they have matched (a
  // document can match more than one token in a range)
  const RANGE = ops => new Promise(resolve => {
    const rs = {};  // resultset
    db.createReadStream(ops)
      .on('data', token => token.value.forEach(docId => rs[docId] = [
        ...(rs[docId] || []), token.key
      ]))
      .on('end', () => resolve(
        // convert map into array
        Object.keys(rs).map(id => ({
          _id: id,
          match: rs[id]
        }))        
      ));
  });

  // TODO: put in some validation here
  // arg 1: an aggregration
  // arg 2: a filter set- return only results of arg 1 that intersect with arg 2
  // TODO: should this use spread syntax? Maybe 2 args instead?
  const AGGREGATE = (...args) => Promise.all(args).then(result => {
    var aggregation = new Set(result[1].map(item => item._id));
    return result[0].map(
      item => Object.assign(item, {
        _id: [...new Set([...item._id].filter(x => aggregation.has(x)))]
      })
    ).filter(item => item._id.length)
  });

  // return a bucket of IDs. Key is an object like this:
  // {gte:..., lte:...} (gte/lte == greater/less than or equal)
  const BUCKET = key => GET(key).then(result => {
    // if gte == lte (in other words get a bucket on one specific
    // value) a single string can be used as shorthand
    if (isString(key)) key = {
      gte: key,
      lte: key
    };
    // TODO: some kind of verification of key object
    return Object.assign(key, {
      _id: [...result.reduce((acc, cur) => acc.add(cur._id), new Set())].sort()
    })
  });

  return {
    AGGREGATE: AGGREGATE,
    BUCKET: BUCKET,
    GET: GET,
    INTERSECTION: INTERSECTION,
    SET_DIFFERENCE: SET_DIFFERENCE,
    UNION: UNION
  }
}

function init$1 (db) {
  return {
    OBJECT: _ids => Promise.all(
      _ids.map(
        id => db.get('￮DOC￮' + id._id + '￮')
      )
    )
  }
}

function init$2 (db) {
  const MIN = key => {
    var ops = {
      limit: 1,
      gte: key + '!'
    };
    return new Promise((resolve, reject) => {
      db.createKeyStream(ops)
        .on('data', resolve);
    })
  };

  const MAX = key => {
    var ops = {
      limit: 1,
      lte: key + '￮',
      reverse: true
    };
    return new Promise((resolve, reject) => {
      db.createKeyStream(ops)
        .on('data', resolve);
    })
  };

  const DIST = ops => {
    if (typeof ops === 'string') {
      ops = {
        gte: ops,
        lte: ops + '￮'
      };
    }
    const keys = [];
    return new Promise((resolve, reject) => {
      db.createKeyStream(ops)
        .on('data', data => { keys.push(data); })
        .on('end', () => resolve(keys));
    })
  };

  return {
    DIST: DIST,
    MAX: MAX,
    MIN: MIN
  }
}

// TODO: set reset this to the max value every time the DB is restarted
var incrementalId = 0;

// use trav lib to find all leaf nodes with corresponding paths
const invertDoc = function (obj) {
  var keys = [];
  trav(obj).forEach(function (node) {
    var searchable = true;
    this.path.forEach(item => {
      // make fields beginning with ! non-searchable
      if (item.substring(0, 1) === '!') searchable = false;
      // _id field should not be searchable
      if (item === '_id') searchable = false;
    });
    if (searchable && this.isLeaf) {
      var key = this.path.join('.') + ':' + this.node;
      if (Array.isArray(this.parent.node)) {
        key = this.path.slice(0, this.path.length - 1).join('.') + ':' + this.node;
      }
      keys.push(key);
    }
  });
  return {
    _id: obj._id || ++incrementalId, // generate _id if not present
    keys: keys
  }
};

// TODO: merging indexes needs a proper test
const createMergedReverseIndex = (index, db, mode) => {
  // does a wb.get that simply returns "[]" rather than rejecting the
  // promise so that you can do Promise.all without breaking on keys
  // that dont exist in the db
  const gracefullGet = key => new Promise((resolve, reject) => {
    db.get(key).then(resolve).catch(e => resolve([]));
  });
  const indexKeys = Object.keys(index);
  return Promise.all(
    indexKeys.map(gracefullGet)
  ).then(currentValues => currentValues.map((cur, i) => {
    // set of current values in store
    var curSet = new Set(cur);
    // set of keys in delta index that is being merged in
    var deltaSet = new Set(index[indexKeys[i]]);
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
      )];
      return {
        key: indexKeys[i],
        type: (newSet.length === 0) ? 'del' : 'put',
        value: newSet
      }
    }
  }))
};

const objectIndex = (docs, mode) => docs.map(doc => {
  return {
    key: '￮DOC￮' + doc._id + '￮',
    type: mode,
    value: doc
  }
});

const reverseIndex = (acc, cur) => {
  cur.keys.forEach(key => {
    acc[key] = acc[key] || [];
    acc[key].push(cur._id);
  });
  return acc
};

const createDeltaReverseIndex = docs => docs
  .map(invertDoc)
  .reduce(reverseIndex, {});

const checkID = doc => {
  if (typeof doc._id === 'string') return doc
  if (typeof doc._id === 'number') return doc
  // else
  doc._id = incrementalId++;
  return doc
};

const writer = (docs, db, mode) => {
  // check for _id field, autogenerate if necessary
  docs = docs.map(checkID);
  return new Promise((resolve, reject) => {
    createMergedReverseIndex(createDeltaReverseIndex(docs), db, mode)
      .then(mergedReverseIndex => {
        db.batch(mergedReverseIndex.concat(objectIndex(docs, mode)), e => resolve(docs));
      });
  })
};

function init$3 (db) {
  // docs needs to be an array of ids (strings)
  // first do an 'objects' call to get all of the documents to be
  // deleted
  const DELETE = _ids =>
    init$1(db).OBJECT(
      _ids.map(_id => {
        return {
          _id: _id
        }
      })
    ).then(docs => writer(docs, db, 'del'));

  const PUT = docs => writer(docs, db, 'put');

  return {
    DELETE: DELETE,
    PUT: PUT
  }
}

const makeAFii = db => {
  return {
    AGGREGATE: init(db).AGGREGATE,
    AND: init(db).INTERSECTION,
    BUCKET: init(db).BUCKET,
    BUCKETFILTER: init(db).AGGREGATE,
    DELETE: init$3(db).DELETE,
    DISTINCT: init$2(db).DIST,
    GET: init(db).GET,
    MAX: init$2(db).MAX,
    MIN: init$2(db).MIN,
    NOT: init(db).SET_DIFFERENCE,
    OBJECT: init$1(db).OBJECT,
    OR: init(db).UNION,
    PUT: init$3(db).PUT,
    STORE: db
  }
};

function fii (ops, callback) {
  ops = Object.assign({}, {
    name: 'fii'
  }, ops);
  // if no callback provided, "lazy load"
  if (!callback) {
    return makeAFii(ops.store || level(ops.name, { valueEncoding: 'json' }))
  } else {
    if (ops.store) return callback(new Error('When initing with a store use "lazy loading"'), null)
    // use callback to provide a notification that db is opened
    level(ops.name, { valueEncoding: 'json' }, (err, store) => callback(err, makeAFii(store)));
  }
}

module.exports = fii;
