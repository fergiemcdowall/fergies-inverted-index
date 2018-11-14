"use strict";

module.exports = function (db) {
  var MIN = function MIN(key) {
    var ops = {
      limit: 1,
      gte: key + '!'
    };
    return new Promise(function (resolve, reject) {
      db.createKeyStream(ops).on('data', function (data) {
        return resolve(data);
      });
    });
  };

  var MAX = function MAX(key) {
    var ops = {
      limit: 1,
      lte: key + '￮',
      reverse: true
    };
    return new Promise(function (resolve, reject) {
      db.createKeyStream(ops).on('data', function (data) {
        return resolve(data);
      });
    });
  };

  var DIST = function DIST(key, o) {
    o = o || {};
    var ops = {
      gte: key + '.' + (o.gte || '') + '!',
      lte: key + '.' + (o.lte || '') + '￮'
    };
    console.log(ops);
    var keys = [];
    return new Promise(function (resolve, reject) {
      db.createKeyStream(ops).on('data', function (data) {
        keys.push(data);
      }).on('end', function () {
        return resolve(keys);
      });
    });
  };

  return {
    DIST: DIST,
    MAX: MAX,
    MIN: MIN
  };
};