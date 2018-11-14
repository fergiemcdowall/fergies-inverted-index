"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

module.exports = function (db) {
  var GET = function GET(key) {
    return new Promise(function (resolve, reject) {
      // to allow for nested promises
      // if this is a promise then resolve that
      if (key instanceof Promise) return resolve(key);
      if (typeof key === 'string') key = {
        gte: key,
        lte: key
      };
      return RANGE(key).then(resolve);
    });
  }; // OR


  var UNION = function UNION(keys) {
    return new Promise(function (resolve, reject) {
      Promise.all(keys.map(function (key) {
        return GET(key);
      })).then(function (sets) {
        // flatten
        sets = [].concat.apply([], sets);
        var setObject = sets.reduce(function (acc, cur) {
          acc[cur._id] = acc[cur._id] || [];

          acc[cur._id].push(cur.prop);

          return acc;
        }, {});
        resolve(Object.keys(setObject).map(function (id) {
          return {
            _id: id,
            prop: setObject[id]
          };
        }));
      });
    });
  }; // AND


  var INTERSECTION = function INTERSECTION(keys) {
    return new Promise(function (resolve, reject) {
      UNION(keys).then(function (result) {
        return resolve(result // returns an intersection
        .filter(function (item) {
          return item.prop.length === keys.length;
        }));
      });
    });
  }; // NOT


  var SET_DIFFERENCE = function SET_DIFFERENCE(a, b) {
    if (typeof a === 'string') a = GET(a);
    if (typeof b === 'string') b = GET(b);
    return new Promise(function (resolve, reject) {
      Promise.all([a, b]).then(function (result) {
        var _result = _slicedToArray(result, 2),
            a = _result[0],
            b = _result[1];

        b = b.map(function (item) {
          return item._id;
        });
        return resolve(a.filter(function (item) {
          return b.indexOf(item._id);
        }));
      });
    });
  };

  var EACH = function EACH(keys) {
    return new Promise(function (resolve, reject) {
      Promise.all(keys.map(function (key) {
        return db.get(key);
      })).then(function (result) {
        return resolve(keys.map(function (key, i) {
          return {
            prop: key,
            _id: result[i]
          };
        }));
      });
    });
  };

  var RANGE = function RANGE(ops) {
    var s = {};
    return new Promise(function (resolve, reject) {
      db.createReadStream(ops).on('data', function (data) {
        return data.value.forEach(function (objectId) {
          s[objectId] = s[objectId] || [];
          s[objectId].push(data.key);
        });
      }).on('end', function () {
        return resolve(Object.keys(s).map(function (id) {
          return {
            _id: id,
            prop: s[id]
          };
        }));
      });
    });
  };

  return {
    EACH: EACH,
    GET: GET,
    INTERSECTION: INTERSECTION,
    SET_DIFFERENCE: SET_DIFFERENCE,
    UNION: UNION
  };
};