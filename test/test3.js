const trav = require('traverse')

const obj = {
  foo: 'bar',
  _aliens: [1, 2, 3, 4, {
    five: ['six', 'seven'],
    eight: {
      nine: 'ten'
    }
  }]
}


console.log(JSON.stringify(obj, null, 2))

var keyValues = []
trav(obj).forEach(function(node) {
  var that = this
  var searchable = false
  this.path.forEach(item => {
    if (item.substring(0, 1) === '_') // denotes that a field is indexable
      searchable = true
  })
  if (searchable && this.isLeaf) keyValues.push({
    key: that.path.join('.'),
    value: that.node
  })
})

console.log(JSON.stringify(keyValues, null, 2))
