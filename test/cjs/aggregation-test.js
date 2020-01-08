'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var level = _interopDefault(require('level'));
var trav = _interopDefault(require('traverse'));
var test = _interopDefault(require('tape'));

function init (db) {
  const isString = s => (typeof s === 'string');

  // key might be object or string like this
  // <fieldname>:<value>. Turn key into json object that is of the
  // format {field: ..., value: {gte: ..., lte ...}}
  
  const parseKey = key => {
    if (isString(key)) key = {
      field: key.split(':')[0],
      value: {
        gte: key.split(':')[1],
        lte: key.split(':')[1]
      }
    };
    
    key.value = {
      gte: key.field + ':' + ((key.value.gte || key.value) || ''),
      lte: key.field + ':' + ((key.value.lte || key.value) || '') + '￮'
    };
    return key
  };
  
  const GET = key => new Promise((resolve, reject) => {
    if (key instanceof Promise) return resolve(key) // MAGIC! Enables nested promises
    // takes objects in the form of
    // {
    //   field: ...,
    //   value: ... (either a string or gte/lte)
    // }
  
    return RANGE(parseKey(key)).then(resolve)
  });

  // OR
  const UNION = (...keys) => Promise.all(
    keys.map(key => GET(key))
  ).then(sets => {
    // flatten
    sets = [].concat.apply([], sets);
    var setObject = sets.reduce((acc, cur) => {
      acc[cur._id] = [...(acc[cur._id] || []), cur._match];
      return acc
    }, {});
    return Object.keys(setObject).map(id => ({
      _id: id,
      _match: setObject[id]
    }))
  });

  // AND
  const INTERSECTION = (...keys) => UNION(...keys).then(
    result => result.filter(
      item => (item._match.length === keys.length)
    )
  );

  // NOT
  const SET_DIFFERENCE = (a, b) => Promise.all([
    isString(a) ? GET(a) : a,
    isString(b) ? GET(b) : b
  ]).then(result => result[0].filter(
    item => result[1].map(item => item._id).indexOf(item._id)
  ));

  // Accepts a range of tokens (gte, lte) and returns an array of
  // document ids together with the tokens that they have matched (a
  // document can match more than one token in a range)
  const RANGE = ops => new Promise(resolve => {

    const rs = {}; // resultset
    db.createReadStream(ops.value)
      .on('data', token => token.value.forEach(docId => {
        rs[docId] = [...(rs[docId] || []), token.key];
        return rs
      }))
      .on('end', () => resolve(
        // convert map into array
        Object.keys(rs).map(id => ({
          _id: id,
          _match: rs[id]
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
    // if (isString(key)) {
    //   key = {
    //     gte: key,
    //     lte: key
    //   }
    // }
    // TODO: some kind of verification of key object
    key = parseKey(key);
    return Object.assign(key, {
      _id: [...result.reduce((acc, cur) => acc.add(cur._id), new Set())].sort(),
      value: {
        gte: key.value.gte.split(':').pop(),
        lte: key.value.lte.split(':').pop().replace(/￮/g, '')
      }
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
        id => db.get('￮DOC￮' + id._id + '￮').catch(reason => null)
      )
    )
  }
}

function init$2 (db) {
  const getRange = ops => new Promise((resolve, reject) => {
    const keys = [];
    db.createKeyStream(ops)
      .on('data', data => { keys.push(data); })
      .on('end', () => resolve(keys));
  });

  const MIN = key => new Promise((resolve, reject) => {
    db.createKeyStream({
      limit: 1,
      gte: key + '!'
    }).on('data', resolve);
  });
  
  const MAX = key => new Promise((resolve, reject) => {
    db.createKeyStream({
      limit: 1,
      lte: key + '￮',
      reverse: true
    }).on('data', resolve);
  });
  
  const DIST = ops => getRange({
    gte: ops.field + ':' + ((ops.value && ops.value.gte) || ''),
    lte: ops.field + ':' + ((ops.value && ops.value.lte) || '') + '￮',
  }).then(items => items.map(item => ({
    field: item.split(/:(.+)/)[0],
    value: item.split(/:(.+)/)[1]
  })));
  
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

const objectIndex = (docs, mode) => docs.map(doc => ({
  key: '￮DOC￮' + doc._id + '￮',
  type: mode,
  value: doc
}));

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

const availableFields = reverseIndex => [
  ...new Set(
    reverseIndex.map(item => item.key.split(':')[0])
  )
].map(f => ({
  type: 'put',
  key: '￮FIELD￮' + f + '￮',
  value: true
}));

const writer = (docs, db, mode) => new Promise((resolve, reject) => {
  // check for _id field, autogenerate if necessary
  docs = docs.map(checkID);
  createMergedReverseIndex(
    createDeltaReverseIndex(docs), db, mode
  ).then(mergedReverseIndex => db.batch(
    mergedReverseIndex
      .concat(objectIndex(docs, mode))
      .concat(availableFields(mergedReverseIndex))
    , e => resolve(docs)
  ));
});

function init$3 (db) {
  // docs needs to be an array of ids (strings)
  // first do an 'objects' call to get all of the documents to be
  // deleted
  const DELETE = _ids => init$1(db).OBJECT(
    _ids.map(_id => ({ _id: _id }))
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

const sandbox = 'test/sandbox/';
const indexName = sandbox + 'cars-aggregation-test';

const data = [
  {
    "_id": 0,
    "make": "BMW",
    "colour": "Blue",
    "year": 2011,
    "price": 83988,
    "model": "3-series",
    "drivetrain": "Hybrid"
  },
  {
    "_id": 1,
    "make": "Volvo",
    "colour": "Black",
    "year": 2016,
    "price": 44274,
    "model": "XC90",
    "drivetrain": "Petrol"
  },
  {
    "_id": 2,
    "make": "Volvo",
    "colour": "Silver",
    "year": 2008,
    "price": 33114,
    "model": "XC90",
    "drivetrain": "Hybrid"
  },
  {
    "_id": 3,
    "make": "Volvo",
    "colour": "Silver",
    "year": 2007,
    "price": 47391,
    "model": "XC60",
    "drivetrain": "Hybrid"
  },
  {
    "_id": 4,
    "make": "BMW",
    "colour": "Black",
    "year": 2000,
    "price": 88652,
    "model": "5-series",
    "drivetrain": "Diesel"
  },
  {
    "_id": 5,
    "make": "Tesla",
    "colour": "Red",
    "year": 2014,
    "price": 75397,
    "model": "X",
    "drivetrain": "Electric"
  },
  {
    "_id": 6,
    "make": "Tesla",
    "colour": "Blue",
    "year": 2017,
    "price": 79540,
    "model": "S",
    "drivetrain": "Electric"
  },
  {
    "_id": 7,
    "make": "BMW",
    "colour": "Black",
    "year": 2019,
    "price": 57280,
    "model": "3-series",
    "drivetrain": "Petrol"
  },
  {
    "_id": 8,
    "make": "BMW",
    "colour": "Silver",
    "year": 2015,
    "price": 81177,
    "model": "3-series",
    "drivetrain": "Petrol"
  },
  {
    "_id": 9,
    "make": "Volvo",
    "colour": "White",
    "year": 2004,
    "price": 37512,
    "model": "XC90",
    "drivetrain": "Hybrid"
  }
];

test('create a little world bank index', t => {
  t.plan(1);
  fii({ name: indexName }, (err, idx) => {
    global[indexName] = idx;
    t.error(err);
  });
});

test('can add some worldbank data', t => {
  t.plan(1);
  global[indexName].PUT(data).then(t.pass);
});

test('can GET a single bucket', t => {
  t.plan(1);
  global[indexName].BUCKET({
    field: 'make',
    value: 'Volvo'
  }).then(result => {
      t.looseEqual(result, {
        field: 'make',
        value: {
          gte: 'Volvo',
          lte: 'Volvo'
        },
        _id: [ '1', '2', '3', '9' ]
      });
    });
});

test('can GET a single bucket with gte lte', t => {
  t.plan(1);
  global[indexName].BUCKET({
    field: 'make',
    value: {
      gte: 'Volvo',
      lte: 'Volvo'
    }
  }).then(result => {
      t.looseEqual(result, {
        field: 'make',
        value: {
          gte: 'Volvo',
          lte: 'Volvo'
        },
        _id: [ '1', '2', '3', '9' ]
      });
    });
});

test('can get DISTINCT values', t => {
  t.plan(1);
  global[indexName].DISTINCT({
    field:'make'
  }).then(result => t.looseEquals(result, [
    { field: 'make', value: 'BMW' },
    { field: 'make', value: 'Tesla' },
    { field: 'make', value: 'Volvo' }
  ]));
});

test('can get DISTINCT values with gte', t => {
  t.plan(1);
  global[indexName].DISTINCT({
    field: 'make',
    value: {
      gte: 'C'
    }
  }).then(result => t.looseEquals(result, [
    { field: 'make', value: 'Tesla' },
    { field: 'make', value: 'Volvo' }
  ]));
});

test('can get DISTINCT values with gte and lte', t => {
  t.plan(1);
  global[indexName].DISTINCT({
    field: 'make',
    value: {
      gte: 'C',
      lte: 'U'
    }
  }).then(result => t.looseEquals(result, [
    { field: 'make', value: 'Tesla' }
  ]));
});



// TODO

// Can specifiy a "field" param
// Nice error message if field doesnt exist
