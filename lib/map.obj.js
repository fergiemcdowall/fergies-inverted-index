"use strict";

module.exports = function (db) {
  return {
    OBJECT: function OBJECT(_ids) {
      return Promise.all(_ids.map(function (id) {
        return db.get('!DOC￮' + id._id + '￮');
      }));
    }
  };
};