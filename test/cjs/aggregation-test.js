'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var level = _interopDefault(require('level'));
var trav = _interopDefault(require('traverse'));
var test = _interopDefault(require('tape'));

function init(db, ops) {
  const isString = s => typeof s === 'string'; // key might be object or string like this
  // <fieldname>:<value>. Turn key into json object that is of the
  // format {field: ..., value: {gte: ..., lte ...}}


  const parseKey = key => {
    if (isString(key)) {
      if (key.indexOf(':') > -1) {
        // string is expressing a specified field to search in
        key = {
          field: [key.split(':')[0]],
          value: {
            gte: key.split(':')[1],
            lte: key.split(':')[1]
          }
        };
      } else {
        // string is not specifying a field (search in ALL fields)
        key = {
          value: {
            gte: key,
            lte: key
          }
        };
      }
    } else {
      // key is object, but key.value is string
      if (isString(key.value)) {
        key.value = {
          gte: key.value,
          lte: key.value
        };
      }
    } // token append allows in practice token spaces to be split up on
    // a character when being read. Useful when stuffing scores into
    // tokens


    if (key.value.gte.slice(-1) !== ops.tokenAppend) {
      key.value.gte = key.value.gte + ops.tokenAppend;
    }

    if (key.value.lte.slice(-1) !== ops.tokenAppend) {
      key.value.lte = key.value.lte + ops.tokenAppend;
    }

    return key;
  };

  const GET = key => new Promise((resolve, reject) => {
    if (key instanceof Promise) return resolve(key); // MAGIC! Enables nested promises
    // takes objects in the form of
    // {
    //   field: ...,
    //   value: ... (either a string or gte/lte)
    // }

    return RANGE(parseKey(key)).then(resolve);
  }); // OR


  const UNION = (...keys) => Promise.all(keys.map(key => GET(key))).then(sets => {
    // flatten
    sets = [].concat.apply([], sets);
    var setObject = sets.reduce((acc, cur) => {
      acc[cur._id] = [...(acc[cur._id] || []), cur._match];
      return acc;
    }, {});
    return Object.keys(setObject).map(id => ({
      _id: id,
      _match: setObject[id]
    }));
  }); // AND


  const INTERSECTION = (...keys) => UNION(...keys).then(result => result.filter(item => item._match.length === keys.length)); // NOT (set a minus set b)


  const SET_SUBTRACTION = (a, b) => Promise.all([isString(a) ? GET(a) : a, isString(b) ? GET(b) : b]).then(([a, b]) => a.filter(aItem => b.map(bItem => bItem._id).indexOf(aItem._id) === -1)); // Accepts a range of tokens (field, value {gte, lte}) and returns
  // an array of document ids together with the tokens that they have
  // matched (a document can match more than one token in a range)


  const RANGE = ops => new Promise(resolve => {
    const rs = {}; // resultset

    new Promise(resolve => ops.field // is a field specified?
    ? resolve(isString(ops.field) ? [ops.field] : ops.field) // use specified field (if String push to Array)
    : AVAILABLE_FIELDS() // else get ALL available fields from store
    .then(resolve)).then(fields => Promise.all(fields.map(fieldName => new Promise(resolve => db.createReadStream({
      gte: fieldName + ':' + ops.value.gte,
      lte: fieldName + ':' + ops.value.lte + '￮'
    }).on('data', token => token.value.forEach(docId => {
      rs[docId] = [...(rs[docId] || []), token.key];
      return rs;
    })).on('end', resolve))))).then(() => resolve( // convert map into array
    Object.keys(rs).map(id => ({
      _id: id,
      _match: rs[id].sort()
    }))));
  });

  const AVAILABLE_FIELDS = () => new Promise(resolve => {
    const fieldNames = [];
    db.createReadStream({
      gte: '￮FIELD￮',
      lte: '￮FIELD￮￮'
    }).on('data', d => fieldNames.push(d.value)).on('end', () => resolve(fieldNames));
  }); // TODO: put in some validation here
  // arg 1: an array of BUCKETS
  // arg 2: a filter set- return only results of arg 1 that intersect with arg 2


  const BUCKETFILTER = (buckets, filter) => {
    // buckets can be either an Array of BUCKETs or a Promise that returns
    // an array of buckets
    if (Array.isArray(buckets)) buckets = Promise.all(buckets);
    return buckets.then(buckets => Promise.all([...buckets, filter])).then(result => {
      var filterSet = new Set(result.pop().map(item => item._id));
      return result.map(bucket => Object.assign(bucket, {
        _id: [...new Set([...bucket._id].filter(x => filterSet.has(x)))]
      }));
    });
  }; // return a bucket of IDs. Key is an object like this:
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
    key = parseKey(key);
    const re = new RegExp('[￮' + ops.tokenAppend + ']', 'g');
    return Object.assign(key, {
      _id: [...result.reduce((acc, cur) => acc.add(cur._id), new Set())].sort(),
      value: {
        gte: key.value.gte.split(':').pop().replace(re, ''),
        lte: key.value.lte.split(':').pop().replace(re, '')
      }
    });
  });

  return {
    AVAILABLE_FIELDS: AVAILABLE_FIELDS,
    BUCKET: BUCKET,
    BUCKETFILTER: BUCKETFILTER,
    GET: GET,
    INTERSECTION: INTERSECTION,
    //    SET_DIFFERENCE: SET_DIFFERENCE,
    SET_SUBTRACTION: SET_SUBTRACTION,
    UNION: UNION
  };
}

function init$1(db) {
  return {
    OBJECT: _ids => Promise.all(_ids.map(id => db.get('￮DOC￮' + id._id + '￮').catch(reason => null))).then(_objects => _ids.map((_id, i) => {
      _id._object = _objects[i];
      return _id;
    }))
  };
}

function init$2(db) {
  const getRange = ops => new Promise((resolve, reject) => {
    const keys = [];
    db.createKeyStream(ops).on('data', data => {
      keys.push(data);
    }).on('end', () => resolve(keys));
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
    gte: ops.field + ':' + (ops.value && ops.value.gte || ''),
    lte: ops.field + ':' + (ops.value && ops.value.lte || '') + '￮'
  }).then(items => items.map(item => ({
    field: item.split(/:(.+)/)[0],
    value: item.split(/:(.+)/)[1]
  })));

  return {
    DIST: DIST,
    MAX: MAX,
    MIN: MIN
  };
}

var incrementalId = 0; // use trav lib to find all leaf nodes with corresponding paths

const invertDoc = function (obj) {
  var keys = [];
  trav(obj).forEach(function (node) {
    var searchable = true;
    this.path.forEach(item => {
      // make fields beginning with ! non-searchable
      if (item.substring(0, 1) === '!') searchable = false; // _id field should not be searchable

      if (item === '_id') searchable = false;
    });

    if (searchable && this.isLeaf) {
      var key = this.path.join('.') + ':' + this.node;

      if (Array.isArray(this.parent.node)) {
        key = this.path.slice(0, this.path.length - 1).join('.') + ':' + this.node;
      }

      keys.push(key);
    }
  }); // Bump all _ids to strings. Prevents _id='0' causing problems amongst other things

  if (!isNaN(obj._id)) obj._id = obj._id + '';
  return {
    _id: obj._id || incrementalId + '',
    // generate _id if not present
    keys: keys
  };
}; // TODO: merging indexes needs a proper test


const createMergedReverseIndex = (index, db, mode) => {
  // does a wb.get that simply returns "[]" rather than rejecting the
  // promise so that you can do Promise.all without breaking on keys
  // that dont exist in the db
  const gracefullGet = key => new Promise((resolve, reject) => {
    db.get(key).then(resolve).catch(e => resolve([]));
  });

  const indexKeys = Object.keys(index);
  return Promise.all(indexKeys.map(gracefullGet)).then(currentValues => currentValues.map((cur, i) => {
    // set of current values in store
    var curSet = new Set(cur); // set of keys in delta index that is being merged in

    var deltaSet = new Set(index[indexKeys[i]]);

    if (mode === 'put') {
      return {
        key: indexKeys[i],
        type: mode,
        value: [...new Set([...curSet, ...deltaSet])].sort() // union

      };
    } else if (mode === 'del') {
      // difference
      var newSet = [...new Set([...curSet].filter(x => !deltaSet.has(x)))];
      return {
        key: indexKeys[i],
        type: newSet.length === 0 ? 'del' : 'put',
        value: newSet
      };
    }
  }));
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
  return acc;
};

const createDeltaReverseIndex = docs => docs.map(invertDoc).reduce(reverseIndex, {});

const checkID = doc => {
  if (typeof doc._id === 'string') return doc;
  if (typeof doc._id === 'number') return doc; // else

  doc._id = ++incrementalId;
  return doc;
};

const availableFields = reverseIndex => [...new Set(reverseIndex.map(item => item.key.split(':')[0]))].map(f => ({
  type: 'put',
  key: '￮FIELD￮' + f + '￮',
  value: f
}));

const writer = (docs, db, mode) => new Promise((resolve, reject) => {
  // check for _id field, autogenerate if necessary
  docs = docs.map(checkID);
  createMergedReverseIndex(createDeltaReverseIndex(docs), db, mode).then(mergedReverseIndex => db.batch(mergedReverseIndex.concat(objectIndex(docs, mode)).concat(availableFields(mergedReverseIndex)), e => resolve(docs)));
});

function init$3(db) {
  // docs needs to be an array of ids (strings)
  // first do an 'objects' call to get all of the documents to be
  // deleted
  const DELETE = _ids => init$1(db).OBJECT(_ids.map(_id => ({
    _id: _id
  }))).then(docs => writer(docs.map((doc, i) => {
    if (doc._object === null) {
      return {
        _id: _ids[i],
        status: 'NOT FOUND',
        mode: 'DELETE'
      };
    }

    return doc._object;
  }), db, 'del')).then(docs => docs.map(doc => ({
    _id: doc._id,
    status: 'OK',
    operation: 'DELETE'
  })));

  const PUT = docs => writer(docs, db, 'put').then(docs => docs.map(doc => ({
    _id: doc._id,
    status: 'OK',
    operation: 'PUT'
  })));

  return {
    DELETE: DELETE,
    PUT: PUT
  };
} // the bonnet. Flatten array before presenting to consumer


const flattenMatchArrayInResults = results => results.map(result => {
  result._match = result._match.flat(Infinity);
  return result;
});

const makeAFii = (db, ops) => ({
  AVAILABLE_FIELDS: init(db, ops).AVAILABLE_FIELDS,
  AND: (...keys) => init(db, ops).INTERSECTION(...keys).then(flattenMatchArrayInResults),
  BUCKET: init(db, ops).BUCKET,
  BUCKETFILTER: init(db, ops).BUCKETFILTER,
  DELETE: init$3(db).DELETE,
  DISTINCT: init$2(db).DIST,
  GET: init(db, ops).GET,
  MAX: init$2(db).MAX,
  MIN: init$2(db).MIN,
  NOT: (...keys) => init(db, ops).SET_SUBTRACTION(...keys).then(flattenMatchArrayInResults),
  OBJECT: init$1(db).OBJECT,
  OR: (...keys) => init(db, ops).UNION(...keys).then(flattenMatchArrayInResults),
  PUT: init$3(db).PUT,
  SET_SUBTRACTION: init(db, ops).SET_SUBTRACTION,
  STORE: db
});

function fii(ops, callback) {
  ops = Object.assign({}, {
    name: 'fii',
    // tokenAppend can be used to create 'comment' spaces in
    // tokens. For example using '#' allows tokens like boom#1.00 to
    // be retrieved by using "boom". If tokenAppend wasnt used, then
    // {gte: 'boom', lte: 'boom'} would also return stuff like
    // boomness#1.00 etc
    tokenAppend: ''
  }, ops); // if no callback provided, "lazy load"

  if (!callback) {
    return makeAFii(ops.store || level(ops.name, {
      valueEncoding: 'json'
    }), ops);
  } else {
    if (ops.store) return callback(new Error('When initing with a store use "lazy loading"'), null); // use callback to provide a notification that db is opened

    level(ops.name, {
      valueEncoding: 'json'
    }, (err, store) => callback(err, makeAFii(store, ops)));
  }
}

const sandbox = 'test/sandbox/';
const indexName = sandbox + 'cars-aggregation-test';
const data = [{
  "_id": 0,
  "make": "BMW",
  "colour": "Blue",
  "year": 2011,
  "price": 83988,
  "model": "3-series",
  "drivetrain": "Hybrid"
}, {
  "_id": 1,
  "make": "Volvo",
  "colour": "Black",
  "year": 2016,
  "price": 44274,
  "model": "XC90",
  "drivetrain": "Petrol"
}, {
  "_id": 2,
  "make": "Volvo",
  "colour": "Silver",
  "year": 2008,
  "price": 33114,
  "model": "XC90",
  "drivetrain": "Hybrid"
}, {
  "_id": 3,
  "make": "Volvo",
  "colour": "Silver",
  "year": 2007,
  "price": 47391,
  "model": "XC60",
  "drivetrain": "Hybrid"
}, {
  "_id": 4,
  "make": "BMW",
  "colour": "Black",
  "year": 2000,
  "price": 88652,
  "model": "5-series",
  "drivetrain": "Diesel"
}, {
  "_id": 5,
  "make": "Tesla",
  "colour": "Red",
  "year": 2014,
  "price": 75397,
  "model": "X",
  "drivetrain": "Electric"
}, {
  "_id": 6,
  "make": "Tesla",
  "colour": "Blue",
  "year": 2017,
  "price": 79540,
  "model": "S",
  "drivetrain": "Electric"
}, {
  "_id": 7,
  "make": "BMW",
  "colour": "Black",
  "year": 2019,
  "price": 57280,
  "model": "3-series",
  "drivetrain": "Petrol"
}, {
  "_id": 8,
  "make": "BMW",
  "colour": "Silver",
  "year": 2015,
  "price": 81177,
  "model": "3-series",
  "drivetrain": "Petrol"
}, {
  "_id": 9,
  "make": "Volvo",
  "colour": "White",
  "year": 2004,
  "price": 37512,
  "model": "XC90",
  "drivetrain": "Hybrid"
}];
test('create a little world bank index', t => {
  t.plan(1);
  fii({
    name: indexName
  }, (err, idx) => {
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
      _id: ['1', '2', '3', '9']
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
      _id: ['1', '2', '3', '9']
    });
  });
});
test('can get DISTINCT values', t => {
  t.plan(1);
  global[indexName].DISTINCT({
    field: 'make'
  }).then(result => t.looseEquals(result, [{
    field: 'make',
    value: 'BMW'
  }, {
    field: 'make',
    value: 'Tesla'
  }, {
    field: 'make',
    value: 'Volvo'
  }]));
});
test('can get DISTINCT values with gte', t => {
  t.plan(1);
  global[indexName].DISTINCT({
    field: 'make',
    value: {
      gte: 'C'
    }
  }).then(result => t.looseEquals(result, [{
    field: 'make',
    value: 'Tesla'
  }, {
    field: 'make',
    value: 'Volvo'
  }]));
});
test('can get DISTINCT values with gte and lte', t => {
  t.plan(1);
  global[indexName].DISTINCT({
    field: 'make',
    value: {
      gte: 'C',
      lte: 'U'
    }
  }).then(result => t.looseEquals(result, [{
    field: 'make',
    value: 'Tesla'
  }]));
}); // TODO
// Can specifiy a "field" param
// Nice error message if field doesnt exist
