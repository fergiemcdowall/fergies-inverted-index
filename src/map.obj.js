export default function init (db) {
  return {
    OBJECT: _ids => Promise.all(
      _ids.map(
        id => db.get('￮DOC￮' + id._id + '￮').catch(reason => null)
      )
    ).then(_objects => _ids.map((_id, i) => {
      _id._object = _objects[i]
      return _id
    }))
  }
}
