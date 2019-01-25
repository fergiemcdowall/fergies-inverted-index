# Fergie's Inverted Index
#### This is an inverted index library. There are many like it, but this one is Fergie's.

Throw JavaScript objects at the index and they will become retrievable by their properties using promises and map-reduce ([see examples](https://github.com/fergiemcdowall/fergies-inverted-index/tree/master/test/src))

This lib will work in node and also in the browser

## Getting started

### Initialise and populate an index

```javascript
import fii from 'fergies-inverted-index'

const db = fii()

db.PUT([ /* my array of objects to be searched */ ]).then(doStuff)

```

### Query the index

```javascript

// (given objects that contain: { land: <land>, colour: <colour>, population: <number> ... })

// get all object IDs where land=SCOTLAND and colour=GREEN
db.AND('land:SCOTLAND', 'colour:GREEN').then(result)

// as above, but return whole objects
db.AND('land:SCOTLAND', 'colour:GREEN').then(db.OBJECT).then(result)

// Get all object IDs where land=SCOTLAND, and those where land=IRELAND
db.OR('land:SCOTLAND', 'land:IRELAND').then(result)

// queries can be embedded within each other
db.AND(
  'land:SCOTLAND',
  db.OR('colour:GREEN', 'colour:BLUE')
).then(result)

// get all object IDs where land=SCOTLAND and colour is NOT GREEN
db.NOT(
  db.GET('land:SCOTLAND'),                 // everything in this set
  db.GET('colour:GREEN', 'colour:RED').    // minus everything in this set
).then(result)

// Get max population
db.MAX('population').then(result)

```

(See the [tests](https://github.com/fergiemcdowall/fergies-inverted-index/tree/master/test) for more examples.)


## API

- <a href="#fii"><code><b>fii()</b></code></a>
- <a href="#AND"><code>db.<b>AND()</b></code></a>
- <a href="#BUCKET"><code>db.<b>BUCKET()</b></code></a>
- <a href="#BUCKETFILTER"><code>db.<b>BUCKETFILTER()</b></code></a>
- <a href="#DELETE"><code>db.<b>DELETE()</b></code></a>
- <a href="#DISTINCT"><code>db.<b>DISTINCT()</b></code></a>
- <a href="#GET"><code>db.<b>GET()</b></code></a>
- <a href="#MAX"><code>db.<b>MAX()</b></code></a>
- <a href="#MIN"><code>db.<b>MIN()</b></code></a>
- <a href="#NOT"><code>db.<b>NOT()</b></code></a>
- <a href="#OBJECT"><code>db.<b>OBJECT()</b></code></a>
- <a href="#OR"><code>db.<b>OR()</b></code></a>
- <a href="#PUT"><code>db.<b>PUT()</b></code></a>
- <a href="#STORE"><code>db.<b>STORE</b></code></a>


<a name="open"></a>


### `fii([options[, callback]])`

```javascript
import fii from 'fergies-inverted-index'

// creates a DB called "myDB" using levelDB (node.js), or indexedDB (browser)
const db = fii({ name: 'myDB' })
```

In some cases you will want to start operating on the database
instentaneously. In these cases you can wait for the callback:

```javascript
import fii from 'fergies-inverted-index'

// creates a DB called "myDB" using levelDB (node.js), or indexedDB (browser)
fii({ name: 'myDB' }, (err, db) => {
  // db is guaranteed to be open and available
})
```

<a name="AND"></a>

### `db.AND([ ...Promise ]).then(result)`

`db.AND` returns a set of object IDs that match every clause in the query.

For example- get the set of objects where the `land` property is set
to `scotland`, `year` is `1975` and `color` is `blue`
```javascript
db.AND('land:scotland', 'year:1975', 'color:blue').then(result)
```


<a name="BUCKET"></a>

### `db.BUCKET(keyspace)`

`db.BUCKET` returns all object ids for objects that contain the given
property, aggregated by property

For example- get all objects that have `land` property set to `scotland`

```javascript
db.BUCKET('land:scotland').then(result)
```
see also GET


<a name="BUCKETFILTER"></a>

### `db.BUCKETFILTER([ ...bucket ], filter query )`

The first argument is an array of buckets, the second is an expression
that filters each bucket



<a name="DELETE"></a>

### `db.DELETE([ ...id ])`

Deletes all objects by ID


<a name="DISTINCT"></a>

### `db.DISTINCT(options)`

`db.DISTINCT` returns every value in the db that is greater than equal
to `gte` and less than or equal to `lte` (sorted alphabetically)

For example- get all names between `h` and `l`:

```javascript
db.DISTINCT({ gte: 'h', lte: 'l' }).then(result)
```

<a name="GET"></a>

### `db.GET(options)`

`db.GET` returns all object ids for objects that contain the given
property, aggregated by object id.

For example get all names between `h` and `l`:

```javascript
db.GET({ gte: 'h', lte: 'l' }).then(result)
```

Or to get all objects that have a `name` property that begins with 'h'

```javascript
db.GET('h').then(result)
```


<a name="MAX"></a>

### `db.MAX(keyspace)`

Get the highest alphabetical value in a given keyspace

For example- see the highest price:

```javascript
db.MAX('price')
```


<a name="MIN"></a>

### `db.MIN(keyspace)`

Get the lowest alphabetical value in a given keyspace

For example- see the lowest price:

```javascript
db.MIN('price')
```


<a name="NOT"></a>

### `db.NOT(A, B)`

Where A and B are sets, `db.NOT` Returns the ids of objects that are
present in A, but not in B.


<a name="OBJECT"></a>

### `db.OBJECT([ ...id ])`

Given an array of ids, `db.OBJECT` will return the corresponding
objects


<a name="OR"></a>

### `db.OR([ ...Promise ])`

Return ids of objects that are in one or more of the query clauses


<a name="PUT"></a>

### `db.PUT([ ...Promise ])`

Add objects to database


<a name="STORE"></a>

### `db.STORE`

Property that points to the underlying [level](https://github.com/Level/level) store
