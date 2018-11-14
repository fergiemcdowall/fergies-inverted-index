"use strict";

var encode = require('encoding-down');

var idMap = require('./map.id.js');

var leveldown = require('leveldown');

var levelup = require('levelup');

var memdown = require('memdown');

var objMap = require('./map.obj.js');

var propMap = require('./map.prop.js');

var writer = require('./write.js');

module.exports = function (options) {
  var down = leveldown(options.name); // const down = memdown(options.name)

  return new Promise(function (resolve, reject) {
    levelup(encode(down, {
      // should maybe default to memdown?
      valueEncoding: 'json'
    }), function (err, db) {
      if (err) return reject(err);
      return resolve(api(db));
    });
  });
};

var api = function api(db) {
  return {
    AND: idMap(db).INTERSECTION,
    DELETE: writer(db).DELETE,
    DISTINCT: propMap(db).DIST,
    // do start/end here
    EACH: idMap(db).EACH,
    // is this still needed? maybe its just a GET?
    GET: idMap(db).GET,
    MAX: propMap(db).MAX,
    MIN: propMap(db).MIN,
    NOT: idMap(db).SET_DIFFERENCE,
    OBJECT: objMap(db).OBJECT,
    OR: idMap(db).UNION,
    PUT: writer(db).PUT,
    STORE: db
  };
};