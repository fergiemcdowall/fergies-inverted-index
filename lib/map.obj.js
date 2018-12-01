module.exports = function (db) {
  return {
    OBJECT: _ids => Promise.all(
      _ids.map(
        id => db.get('!DOC￮' + id._id + '￮')
      )
    ).then(objects => {
      return _ids.map((item, i) => {
        item.obj = objects[i]['!doc']
        return item
      })
    })
  }
}
