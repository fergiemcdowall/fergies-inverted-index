# Fergie's Inverted Index
#### This is my inverted index library. There are many like it, but this one is mine.

Throw JavaScript objects at the index and they will become retrievable by their properties using promises and map-reduce ([see examples](https://github.com/fergiemcdowall/fergies-inverted-index/tree/master/test))


## API

Command   | Options      | Accepts    | Returns    | Writes | Description
--------- | ------------ | ---------- | ---------- | ------ | -----------
`AND`     | -            | properties | ids        | no     | Boolean AND. Return IDs of objects that have prop.A AND prop.b
`DELETE`  | -            | ids        | ids        | yes    | Remove objects from index
`DISTINCT`| `gte`, `lte` | properties | properties | no     | Return all properties in a range.
`EACH`    | -            | properties | ids        | no     | For each property provided, get IDs of objects that contain it (use with DISTINCT, MAX and MIN)
`GET`     | `gte`, `lte` | properties | ids        | no     | Get the IDs of objects with a property in the given range
`MAX`     | `limit`      | properties | properties | no     | Get the highest property in this namespace
`MIN`     | `limit`      | properties | properties | no     | Get the lowest property in this namespace
`NOT`     | -            | ids        | ids        | no     | Get all IDs of objects in set A that are not in set B
`OBJECT`  | -            | ids        | objects    | no     | Get an object by its ID
`OR`      | -            | properties | ids        | no     | Boolean OR. Return IDs of objects that have either prop.A OR prop.b
`PUT`     | -            | objects    | ids        | yes    | Add objects to index
`STORE`   | -            | levelup    | levelup    | both   | Get the underlying [levelup](https://github.com/Level/levelup) store.


## Getting started

### Initialise and populate an index

```javascript
const fin = require('fergies-inverted-index')

// Make a new index, or open an existing one with this name
fin({ name: 'idx' }).then(idx => {
  idx.PUT([ /* my array of objects */ ]).then(doStuff)
})

```

### Query the index

```javascript

// (given objects that contain: { land: <land>, colour: <colour>, ... })

// get all object IDs where land=SCOTLAND and colour=GREEN
idx.AND([ 'land.SCOTLAND', 'colour.GREEN' ]).then(result)

// as above, but return whole objects
idx.AND([ 'land.SCOTLAND', 'colour.GREEN' ]).then(idx.OBJECT).then(result)

// Get all object IDs where land=SCOTLAND, and those where land=IRELAND
idx.OR([ 'land.SCOTLAND', 'land.IRELAND' ]).then(result)

// queries can be embedded within each other
idx.AND([
  'land.SCOTLAND',
  idx.OR([ 'colour.GREEN', 'colour.BLUE' ])
]).then(result)

// get all object IDs where land=SCOTLAND and colour is NOT GREEN
idx.NOT(
  idx.GET('land.SCOTLAND'),   // everything in this set
  idx.GET('colour.GREEN').    // minus everything in this set
).then(result)

// Get max price
idx.MAX('price').then(result)

```

(See the [tests](https://github.com/fergiemcdowall/fergies-inverted-index/tree/master/test) for more examples.)

### Compiling a client-side index that will run in the browser.

[Why distribute indexes?](./BROWSER.md)