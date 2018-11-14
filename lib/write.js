"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

var trav = require('traverse');

var reader = require('./map.obj.js'); // var incrementalId = 0 TODO: implement auto ID


var invertDoc = function invertDoc(obj) {
  var keys = [];
  trav(obj).forEach(function (node) {
    var that = this;
    var searchable = true;
    this.path.forEach(function (item) {
      // denotes that a field is indexable
      //      if (item.substring(0, 1) === '_') searchable = true    // is this needed?
      if (item.substring(0, 1) === '!') searchable = false;
    });

    if (searchable && this.isLeaf) {
      var key = that.path.map(function (item) {
        if (!isNaN(item)) return '_Array';
        return item;
      }).join('.') + '.' + that.node;

      if (Array.isArray(this.parent.node)) {
        key = that.path.slice(0, this.path.length - 1).join('.') + '.' + that.node;
      }

      keys.push(key);
    }
  });
  return {
    _id: obj._id,
    keys: keys
  };
};

var reverseIndex = function reverseIndex(acc, cur) {
  cur.keys.forEach(function (key) {
    acc[key] = acc[key] || [];
    acc[key].push(cur._id);
  });
  return acc;
};

var createMergedReverseIndex = function createMergedReverseIndex(index, db, mode) {
  var gracefullGet = function gracefullGet(key) {
    // does a wb.get that simply returns "[]" rather than rejecting the
    // promise so that you can do Promise.all without breaking on keys
    // that dont exist in the db
    return new Promise(function (resolve, reject) {
      db.get(key).then(resolve).catch(function (e) {
        return resolve([]);
      });
    });
  };

  return new Promise(function (resolve, reject) {
    var indexKeys = Object.keys(index);
    Promise.all(indexKeys.map(gracefullGet)).then(function (currentValues) {
      return resolve(currentValues.map(function (cur, i) {
        // set of current values in store
        var curSet = new Set(cur); // set of keys in delta index that is being merged in

        var deltaSet = new Set(index[indexKeys[i]]);

        if (mode === 'put') {
          return {
            key: indexKeys[i],
            type: mode,
            value: _toConsumableArray(new Set(_toConsumableArray(curSet).concat(_toConsumableArray(deltaSet)))).sort() // union

          };
        } else if (mode === 'del') {
          // difference
          var newSet = _toConsumableArray(new Set(_toConsumableArray(curSet).filter(function (x) {
            return !deltaSet.has(x);
          })));

          return {
            key: indexKeys[i],
            type: newSet.length === 0 ? 'del' : 'put',
            value: newSet
          };
        }
      }));
    });
  });
};

var objectIndex = function objectIndex(docs, mode) {
  return docs.map(function (doc) {
    return {
      key: '!DOC￮' + doc._id + '￮',
      type: mode,
      value: doc
    };
  });
};

var createDeltaReverseIndex = function createDeltaReverseIndex(docs) {
  return docs.map(invertDoc).reduce(reverseIndex, {});
};

var writer = function writer(docs, db, mode) {
  return new Promise(function (resolve, reject) {
    createMergedReverseIndex(createDeltaReverseIndex(docs), db, mode).then(function (mergedReverseIndex) {
      db.batch(mergedReverseIndex.concat(objectIndex(docs, mode))).then(db.write).then(resolve(docs.map(function (doc) {
        return doc._id;
      })));
    });
  });
};

module.exports = function (db) {
  // docs needs to be an array of ids (strings)
  var DELETE = function DELETE(_ids) {
    return new Promise(function (resolve, reject) {
      // first do an 'objects' call to get all of the documents to be
      // deleted
      reader(db).OBJECT(_ids.map(function (_id) {
        return {
          _id: _id
        };
      })).then(function (docs) {
        return resolve(writer(docs, db, 'del'));
      });
    });
  };

  var PUT = function PUT(docs) {
    return writer(docs, db, 'put');
  };

  return {
    DELETE: DELETE,
    PUT: PUT
  };
};