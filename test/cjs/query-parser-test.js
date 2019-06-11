'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var level = _interopDefault(require('level'));
var trav = _interopDefault(require('traverse'));
var test = _interopDefault(require('tape'));
var wbd = _interopDefault(require('world-bank-dataset'));

function init (db) {

  const GET = key => new Promise((resolve, reject) => {
    // to allow for nested promises
    // if this is a promise then resolve that
    if (key instanceof Promise) return resolve(key)
    if ((typeof key) === 'string') key = { gte: key, lte: key + '￮' };
    return RANGE(key).then(resolve)
  });

  // OR
  const UNION = (...keys) => Promise.all(
    keys.map(key => GET(key))
  ).then(sets => {
    // flatten
    sets = [].concat.apply([], sets);
    var setObject = sets.reduce((acc, cur) => {
      acc[cur._id] = acc[cur._id] || [];
      acc[cur._id].push(cur.match);
      return acc
    }, {});
    return Object.keys(setObject).map(id => {
      return {
        _id: id,
        match: setObject[id]
      }
    })
  });

  // AND
  const INTERSECTION = (...keys) => {
    return UNION(...keys).then(result => {
      // returns an intersection
      return result.filter(item => (item.match.length === keys.length))
    })
  };

  // NOT
  const SET_DIFFERENCE = (a, b) => {
    if (typeof a === 'string') a = GET(a);
    if (typeof b === 'string') b = GET(b);
    return Promise.all([a, b]).then(result => {
      var [ a, b ] = result;
      b = b.map(item => item._id);
      return a.filter(item => b.indexOf(item._id))
    })
  };

  const RANGE = ops => new Promise((resolve, reject) => {
    const s = {};
    db.createReadStream(ops)
      .on('data', data => data.value.forEach(objectId => {
        s[objectId] = s[objectId] || [];
        s[objectId].push(data.key);
      }))
      .on('end', () => resolve(
        Object.keys(s).map(id => {
          return {
            _id: id,
            match: s[id]
          }
        })
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


    if ((typeof key) === 'string') key = {
      gte: key,
      lte: key
    };
    // console.log('key ->')
    // console.log(key)
    // console.log(result)
    
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

const sandbox = 'test/sandbox/';
const indexName = sandbox + 'wb2';

test('create a little world bank index', t => {
  t.plan(1);
  fii({ name: indexName }, (err, idx) => {
    global[indexName] = idx;
    t.error(err);
  });
});

test('can add some worldbank data', t => {
  var dataSize = 10;
  const data = wbd.slice(0, dataSize).map(item => {
    return {
      _id: item._id.$oid,
      sectorcode: item.sectorcode.split(','),
      board_approval_month: item.board_approval_month,
      impagency: item.impagency,
      majorsector_percent: item.majorsector_percent,
      mjsector_namecode: item.mjsector_namecode,
      sector_namecode: item.sector_namecode,
      totalamt: item.totalamt
    }
  });
  console.log(JSON.stringify(data.map(item => {
    return {
      _id: item._id,
      board_approval_month: item.board_approval_month,
      sectorcode: item.sectorcode
    }
  }), null, 2));
  t.plan(1);
  global[indexName].PUT(data).then(t.pass);
});

test('can GET with string', t => {
  t.plan(1);
  global[indexName].GET('board_approval_month:November')
    .then(result => {
      t.looseEqual(result, [
        { _id: '52b213b38594d8a2be17c780', match: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c781', match: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c782', match: [ 'board_approval_month:November' ] }
      ]);
    });
});

test('can GET with object', t => {
  t.plan(1);
  global[indexName].GET({
    gte: 'board_approval_month:November',
    lte: 'board_approval_month:November'
  })
    .then(result => {
      t.looseEqual(result, [
        { _id: '52b213b38594d8a2be17c780', match: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c781', match: [ 'board_approval_month:November' ] },
        { _id: '52b213b38594d8a2be17c782', match: [ 'board_approval_month:November' ] }
      ]);
    });
});

test('can do some AND searches', t => {
  t.plan(1);
  global[indexName].AND(
    'sectorcode:BS',
    'sectorcode:BZ',
    'board_approval_month:November'
  )
    .then(result => {
      t.looseEqual(result, [
        {
          _id: '52b213b38594d8a2be17c781',
          match: [ [ 'sectorcode:BS' ], [ 'sectorcode:BZ' ], [ 'board_approval_month:November' ] ]
        }
      ]);
    });
});

test('can do some OR searches', t => {
  t.plan(1);
  global[indexName].OR(
    'sectorcode:BS',
    'sectorcode:BZ',
    'board_approval_month:November'
  ).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c780', match: [ [ 'sectorcode:BS' ], [ 'board_approval_month:November' ] ] },
      { _id: '52b213b38594d8a2be17c781', match: [ [ 'sectorcode:BS' ], [ 'sectorcode:BZ' ], [ 'board_approval_month:November' ] ] },
      { _id: '52b213b38594d8a2be17c789', match: [ [ 'sectorcode:BZ' ] ] },
      { _id: '52b213b38594d8a2be17c782', match: [ [ 'board_approval_month:November' ] ] }
    ]);
  });
});

test('can do some OR searches', t => {
  t.plan(1);
  global[indexName].OR(
    'sectorcode:BZ',
    'sectorcode:TI'
  ).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c781', match: [ [ 'sectorcode:BZ' ] ] },
      { _id: '52b213b38594d8a2be17c789', match: [ [ 'sectorcode:BZ' ] ] },
      { _id: '52b213b38594d8a2be17c782', match: [ [ 'sectorcode:TI' ] ] },
      { _id: '52b213b38594d8a2be17c786', match: [ [ 'sectorcode:TI' ] ] },
      { _id: '52b213b38594d8a2be17c788', match: [ [ 'sectorcode:TI' ] ] }
    ]);
  });
});

test('can do AND with nested OR', t => {
  t.plan(1);
  global[indexName].AND(
    'board_approval_month:November',
    global[indexName].OR('sectorcode:BZ', 'sectorcode:TI')
  ).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c781',
        match: [ [ 'board_approval_month:November' ], [ [ 'sectorcode:BZ' ] ] ] },
      { _id: '52b213b38594d8a2be17c782',
        match: [ [ 'board_approval_month:November' ], [ [ 'sectorcode:TI' ] ] ] }
    ]);
  });
});

test('can do AND with embedded AND', t => {
  t.plan(1);
  global[indexName].AND(
    'board_approval_month:October',
    global[indexName].OR(
      global[indexName].AND('sectorcode:BZ', 'sectorcode:BC'),
      'sectorcode:TI'
    )
  ).then(result => {
    t.looseEqual(result, [
      {
        _id: '52b213b38594d8a2be17c786',
        match: [ [ 'board_approval_month:October' ], [ [ 'sectorcode:TI' ] ] ]
      },
      {
        _id: '52b213b38594d8a2be17c788',
        match: [ [ 'board_approval_month:October' ], [ [ 'sectorcode:TI' ] ] ]
      },
      {
        _id: '52b213b38594d8a2be17c789',
        match: [ [ 'board_approval_month:October' ], [ [ [ 'sectorcode:BZ' ], [ 'sectorcode:BC' ] ] ] ]
      }
    ]);
  });
});

test('can do AND', t => {
  t.plan(1);
  global[indexName].AND(
    'board_approval_month:November',
    global[indexName].OR('sectorcode:BZ', 'sectorcode:TI')
  ).then(global[indexName].OBJECT)
    .then(result => {
      t.looseEqual(result, [
        { _id: '52b213b38594d8a2be17c781', sectorcode: [ 'BZ', 'BS' ], board_approval_month: 'November', impagency: 'MINISTRY OF FINANCE', majorsector_percent: [ { Name: 'Public Administration, Law, and Justice', Percent: 70 }, { Name: 'Public Administration, Law, and Justice', Percent: 30 } ], mjsector_namecode: [ { name: 'Public Administration, Law, and Justice', code: 'BX' }, { name: 'Public Administration, Law, and Justice', code: 'BX' } ], sector_namecode: [ { name: 'Public administration- Other social services', code: 'BS' }, { name: 'General public administration sector', code: 'BZ' } ], totalamt: 0 }, { _id: '52b213b38594d8a2be17c782', sectorcode: [ 'TI' ], board_approval_month: 'November', impagency: 'MINISTRY OF TRANSPORT AND COMMUNICATIONS', majorsector_percent: [ { Name: 'Transportation', Percent: 100 } ], mjsector_namecode: [ { name: 'Transportation', code: 'TX' } ], sector_namecode: [ { name: 'Rural and Inter-Urban Roads and Highways', code: 'TI' } ], totalamt: 6060000 }
      ]);
    });
});

test('can do AND with embedded OR search', t => {
  t.plan(1);
  global[indexName].AND(
    'board_approval_month:October',
    global[indexName].OR(
      'sectorcode:LR',
      global[indexName].AND('sectorcode:BC', 'sectorcode:BM')
    )
  ).then(global[indexName].OBJECT)
    .then(result => {
      t.looseEqual(result, [
        { _id: '52b213b38594d8a2be17c787', sectorcode: [ 'LR' ], board_approval_month: 'October', impagency: 'NATIONAL ENERGY ADMINISTRATION', majorsector_percent: [ { Name: 'Energy and mining', Percent: 100 } ], mjsector_namecode: [ { name: 'Energy and mining', code: 'LX' } ], sector_namecode: [ { name: 'Other Renewable Energy', code: 'LR' } ], totalamt: 0 },
        { _id: '52b213b38594d8a2be17c789', sectorcode: [ 'BM', 'BC', 'BZ' ], board_approval_month: 'October', impagency: 'MINISTRY OF FINANCE', majorsector_percent: [ { Name: 'Public Administration, Law, and Justice', Percent: 34 }, { Name: 'Public Administration, Law, and Justice', Percent: 33 }, { Name: 'Public Administration, Law, and Justice', Percent: 33 } ], mjsector_namecode: [ { name: 'Public Administration, Law, and Justice', code: 'BX' }, { name: 'Public Administration, Law, and Justice', code: 'BX' }, { name: 'Public Administration, Law, and Justice', code: 'BX' } ], sector_namecode: [ { name: 'General public administration sector', code: 'BZ' }, { name: 'Central government administration', code: 'BC' }, { name: 'Public administration- Information and communications', code: 'BM' } ], totalamt: 200000000 }
      ]);
    });
});

test('can get highest value of totalamt (MAX)', t => {
  t.plan(1);
  global[indexName].MAX('totalamt')
    .then(result => {
      t.equal(result, 'totalamt:6060000');
    });
});

test('can get lowest value of totalamt (MIN)', t => {
  t.plan(1);
  global[indexName].MIN('totalamt')
    .then(result => {
      t.equal(result, 'totalamt:0');
    });
});

test('can get all values of totalamt (DIST)', t => {
  t.plan(1);
  global[indexName].DISTINCT('totalamt')
    .then(result => {
      t.looseEqual(result, [ 'totalamt:0',
        'totalamt:10000000',
        'totalamt:130000000',
        'totalamt:13100000',
        'totalamt:160000000',
        'totalamt:200000000',
        'totalamt:500000000',
        'totalamt:6060000' ]);
    });
});

test('can aggregate totalamt', t => {
  t.plan(1);
  global[indexName].DISTINCT({
    gte: 'totalamt:',
    lte: 'totalamt:~'
  })
    .then(result => Promise.all(result.map(global[indexName].BUCKET)))
    .then(result => {
      t.looseEqual(result, [
        { gte: 'totalamt:0', lte: 'totalamt:0', _id: [ '52b213b38594d8a2be17c781', '52b213b38594d8a2be17c783', '52b213b38594d8a2be17c787' ] },
        { gte: 'totalamt:10000000', lte: 'totalamt:10000000', _id: [ '52b213b38594d8a2be17c785' ] },
        { gte: 'totalamt:130000000', lte: 'totalamt:130000000', _id: [ '52b213b38594d8a2be17c780' ] },
        { gte: 'totalamt:13100000', lte: 'totalamt:13100000', _id: [ '52b213b38594d8a2be17c784' ] },
        { gte: 'totalamt:160000000', lte: 'totalamt:160000000', _id: [ '52b213b38594d8a2be17c788' ] },
        { gte: 'totalamt:200000000', lte: 'totalamt:200000000', _id: [ '52b213b38594d8a2be17c789' ] },
        { gte: 'totalamt:500000000', lte: 'totalamt:500000000', _id: [ '52b213b38594d8a2be17c786' ] },
        { gte: 'totalamt:6060000', lte: 'totalamt:6060000', _id: [ '52b213b38594d8a2be17c782' ] }
      ]);
    });
});

test('can aggregate totalamt (showing ID count)', t => {
  t.plan(1);
  global[indexName].DISTINCT({
    gte: 'totalamt:',
    lte: 'totalamt:~'
  })
    .then(result => Promise.all(result.map(global[indexName].BUCKET)))
    .then(result => {
      t.looseEqual(result.map(item => {
        return {
          gte: item.gte,
          lte: item.lte,
          count: item._id.length
        }
      }), [
        { gte: 'totalamt:0', lte: 'totalamt:0', count: 3 },
        { gte: 'totalamt:10000000', lte: 'totalamt:10000000', count: 1 },
        { gte: 'totalamt:130000000', lte: 'totalamt:130000000', count: 1 },
        { gte: 'totalamt:13100000', lte: 'totalamt:13100000', count: 1 },
        { gte: 'totalamt:160000000', lte: 'totalamt:160000000', count: 1 },
        { gte: 'totalamt:200000000', lte: 'totalamt:200000000', count: 1 },
        { gte: 'totalamt:500000000', lte: 'totalamt:500000000', count: 1 },
        { gte: 'totalamt:6060000', lte: 'totalamt:6060000', count: 1 }
      ]);
    });
});

test('can aggregate totalamt (showing ID count)', t => {
  t.plan(1);
  global[indexName].DISTINCT({
    gte: 'totalamt:1',
    lte: 'totalamt:4'
  })
    .then(result => Promise.all(result.map(global[indexName].BUCKET)))
    .then(result =>
      t.looseEqual(
        result.map(item => {
          return {
            gte: item.gte,
            lte: item.lte,
            count: item._id.length
          }
        }), [
          { gte: 'totalamt:10000000', lte: 'totalamt:10000000', count: 1 },
          { gte: 'totalamt:130000000', lte: 'totalamt:130000000', count: 1 },
          { gte: 'totalamt:13100000', lte: 'totalamt:13100000', count: 1 },
          { gte: 'totalamt:160000000', lte: 'totalamt:160000000', count: 1 },
          { gte: 'totalamt:200000000', lte: 'totalamt:200000000', count: 1 }
        ]
      ));
});

test('can get documents with properties in a range', t => {
  t.plan(1);
  global[indexName].GET({
    gte: 'totalamt:1',
    lte: 'totalamt:4'
  }).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c785', match: [ 'totalamt:10000000' ] },
      { _id: '52b213b38594d8a2be17c780', match: [ 'totalamt:130000000' ] },
      { _id: '52b213b38594d8a2be17c784', match: [ 'totalamt:13100000' ] },
      { _id: '52b213b38594d8a2be17c788', match: [ 'totalamt:160000000' ] },
      { _id: '52b213b38594d8a2be17c789', match: [ 'totalamt:200000000' ] } ]);
  });
});

test('can get documents with properties in a range', t => {
  t.plan(1);
  global[indexName].GET({
    gte: 'sectorcode:A',
    lte: 'sectorcode:G'
  }).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c789',
        match: [
          'sectorcode:BC',
          'sectorcode:BM',
          'sectorcode:BZ' ] },
      { _id: '52b213b38594d8a2be17c780',
        match: [
          'sectorcode:BS',
          'sectorcode:EP',
          'sectorcode:ES',
          'sectorcode:ET' ] },
      { _id: '52b213b38594d8a2be17c781',
        match: [
          'sectorcode:BS',
          'sectorcode:BZ' ] },
      { _id: '52b213b38594d8a2be17c784',
        match: [
          'sectorcode:FH' ] }
    ]);
  });
});

test('can get documents with properties in a range and the NOT some out', t => {
  t.plan(1);
  global[indexName].NOT(
    global[indexName].GET({
      gte: 'sectorcode:A',
      lte: 'sectorcode:G'
    }),
    'sectorcode:YZ'
  ).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c789',
        match: [
          'sectorcode:BC',
          'sectorcode:BM',
          'sectorcode:BZ' ] },
      { _id: '52b213b38594d8a2be17c780',
        match: [
          'sectorcode:BS',
          'sectorcode:EP',
          'sectorcode:ES',
          'sectorcode:ET' ] },
      { _id: '52b213b38594d8a2be17c781',
        match: [
          'sectorcode:BS',
          'sectorcode:BZ' ] }
    ]);
  });
});

test('can get documents with properties in a range and the NOT some out', t => {
  t.plan(1);
  global[indexName].NOT(
    'sectorcode:BS',
    'sectorcode:ET'
  ).then(result => {
    t.looseEqual(result, [
      { _id: '52b213b38594d8a2be17c781', match: [ 'sectorcode:BS' ] }
    ]);
  });
});

test('can do OR with gte/lte', t => {
  t.plan(1);
  global[indexName].OR(
    { gte: 'sectorcode:B', lte: 'sectorcode:C' },
    { gte: 'sectorcode:K', lte: 'sectorcode:M' }
  ).then(result => {
    t.looseEqual(result, [
      {
        '_id': '52b213b38594d8a2be17c789',
        'match': [
          [
            'sectorcode:BC',
            'sectorcode:BM',
            'sectorcode:BZ'
          ]
        ]
      },
      {
        '_id': '52b213b38594d8a2be17c780',
        'match': [
          [
            'sectorcode:BS'
          ]
        ]
      },
      {
        '_id': '52b213b38594d8a2be17c781',
        'match': [
          [
            'sectorcode:BS',
            'sectorcode:BZ'
          ]
        ]
      },
      {
        '_id': '52b213b38594d8a2be17c787',
        'match': [
          [
            'sectorcode:LR'
          ]
        ]
      }
    ]);
  });
});

test('can do AND with gte/lte', t => {
  t.plan(1);
  global[indexName].AND(
    { gte: 'sectorcode:E', lte: 'sectorcode:G' },
    { gte: 'sectorcode:Y', lte: 'sectorcode:Z' }
  ).then(result => {
    t.looseEqual(result, [
      {
        '_id': '52b213b38594d8a2be17c784',
        'match': [
          [
            'sectorcode:FH'
          ],
          [
            'sectorcode:YW',
            'sectorcode:YZ'
          ]
        ]
      }
    ]);
  });
});

test('can aggregate totalamt', t => {
  t.plan(1);
  global[indexName].BUCKETFILTER(
    global[indexName].DISTINCT({
      gte: 'totalamt:',
      lte: 'totalamt:~'
    }).then(result => Promise.all(result.map(global[indexName].BUCKET))),
    global[indexName].GET('board_approval_month:November')
  ).then(result => {
    t.looseEqual(result, [
      { gte: 'totalamt:0', lte: 'totalamt:0', _id: [ '52b213b38594d8a2be17c781' ] },
      { gte: 'totalamt:130000000', lte: 'totalamt:130000000', _id: [ '52b213b38594d8a2be17c780' ] },
      { gte: 'totalamt:6060000', lte: 'totalamt:6060000', _id: [ '52b213b38594d8a2be17c782' ] }
    ]);
  });
});

test('can aggregate totalamt', t => {
  t.plan(1);
  global[indexName].BUCKETFILTER(
    global[indexName].DISTINCT({
      gte: 'totalamt:',
      lte: 'totalamt:~'
    }).then(result => Promise.all(result.map(global[indexName].BUCKET))),
    global[indexName].GET('board_approval_month:October')
  ).then(result => {
    t.looseEqual(result, [
      { gte: 'totalamt:0', lte: 'totalamt:0', _id: [ '52b213b38594d8a2be17c783', '52b213b38594d8a2be17c787' ] },
      { gte: 'totalamt:10000000', lte: 'totalamt:10000000', _id: [ '52b213b38594d8a2be17c785' ] },
      { gte: 'totalamt:13100000', lte: 'totalamt:13100000', _id: [ '52b213b38594d8a2be17c784' ] },
      { gte: 'totalamt:160000000', lte: 'totalamt:160000000', _id: [ '52b213b38594d8a2be17c788' ] },
      { gte: 'totalamt:200000000', lte: 'totalamt:200000000', _id: [ '52b213b38594d8a2be17c789' ] },
      { gte: 'totalamt:500000000', lte: 'totalamt:500000000', _id: [ '52b213b38594d8a2be17c786' ] }
    ]);
  });
});

test('can do bucket', t => {
  t.plan(1);
  global[indexName].BUCKET('totalamt:1').then(result => {
    t.looseEqual(result, {
      gte: 'totalamt:1',
      lte: 'totalamt:1',
      _id: [
        '52b213b38594d8a2be17c780',
        '52b213b38594d8a2be17c784',
        '52b213b38594d8a2be17c785',
        '52b213b38594d8a2be17c788'
      ]
    });
  });
});

test('can do custom buckets', t => {
  t.plan(1);
  Promise.all(
    [1, 2, 3, 4, 5].map(item => global[indexName].BUCKET('totalamt:' + item))
  ).then(result => t.looseEqual(result, [
    { gte: 'totalamt:1', lte: 'totalamt:1', _id: [ '52b213b38594d8a2be17c780',
                                                   '52b213b38594d8a2be17c784',
                                                   '52b213b38594d8a2be17c785',
                                                   '52b213b38594d8a2be17c788' ] },
    { gte: 'totalamt:2', lte: 'totalamt:2', _id: [ '52b213b38594d8a2be17c789' ] },
    { gte: 'totalamt:3', lte: 'totalamt:3', _id: [] },
    { gte: 'totalamt:4', lte: 'totalamt:4', _id: [] },
    { gte: 'totalamt:5', lte: 'totalamt:5', _id: [ '52b213b38594d8a2be17c786' ] } ]));
});

test('can do custom buckets and agreggate', t => {
  t.plan(1);
  global[indexName].BUCKETFILTER(
    Promise.all(
      [1, 2, 3, 4, 5].map(item => global[indexName].BUCKET('totalamt:' + item))
    ),
    global[indexName].GET('board_approval_month:October')
  ).then(result => t.looseEqual(result, [
    { gte: 'totalamt:1', lte: 'totalamt:1',
      _id: [ '52b213b38594d8a2be17c784', '52b213b38594d8a2be17c785', '52b213b38594d8a2be17c788' ] },
    { gte: 'totalamt:2', lte: 'totalamt:2', _id: [ '52b213b38594d8a2be17c789' ] },
    { gte: 'totalamt:5', lte: 'totalamt:5', _id: [ '52b213b38594d8a2be17c786' ] } 
  ]));
});
