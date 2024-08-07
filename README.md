# Fergie's Inverted Index

#### This is an inverted index library. There are many like it, but this one is Fergie's.

Throw JavaScript objects at the index and they will become retrievable by their properties using promises and map-reduce ([see examples](https://github.com/fergiemcdowall/fergies-inverted-index/tree/master/test/src))

This lib will work in node and also in the browser

## Getting started

### Initialise and populate an index

```javascript
import { InvertedIndex } from 'fergies-inverted-index'

const { PUT, AND, BUCKETS, FACETS, OR, NOT, OBJECT, GET } = new InvertedIndex(ops)

PUT([ /* my array of objects to be searched */ ]).then(doStuff)

```

### Query the index

```javascript

// (given objects that contain: { land: <land>, colour: <colour>, population: <number> ... })

// get all object IDs where land=SCOTLAND and colour=GREEN
AND(|'land:SCOTLAND', 'colour:GREEN']).then(result)

// the query strings above can alternatively be expressed using JSON objects
AND([
  {
    FIELD: 'land'
    VALUE: 'SCOTLAND'
  }, {
    FIELD: 'colour',
    VALUE: 'GREEN'
  }
]).then(result)

// as above, but return whole objects
AND(['land:SCOTLAND', 'colour:GREEN']).then(OBJECT).then(result)

// Get all object IDs where land=SCOTLAND, and those where land=IRELAND
OR(['land:SCOTLAND', 'land:IRELAND']).then(result)

// queries can be embedded within each other
AND([
  'land:SCOTLAND',
  OR(['colour:GREEN', 'colour:BLUE'])
]).then(result)

// get all object IDs where land=SCOTLAND and colour is NOT GREEN
NOT(
  GET('land:SCOTLAND'),                 // everything in this set
  GET('colour:GREEN', 'colour:RED').    // minus everything in this set
).then(result)

// Get max population
MAX('population').then(result)

// Aggregate
BUCKETS(
  {
    FIELD: ['year'],
    VALUE: {
      LTE: 2010
    }
  },
  {
    FIELD: ['year'],
    VALUE: {
      GTE: 2010
    }
  }
).then(result)

FACETS({
  FIELD: 'year'
}).then(result)

//(see also AGGREGATION_FILTER)
```

(See the [tests](https://github.com/fergiemcdowall/fergies-inverted-index/tree/master/test) for more examples.)


## API

- <a href="#InvertedIndex"><code><b>new InvertedIndex(ops)</b></code></a>
- <a href="#AGGREGATION_FILTER"><code><b>AGGREGATION_FILTER()</b></code></a>
- <a href="#AND"><code><b>AND()</b></code></a>
- <a href="#BUCKET"><code><b>BUCKET()</b></code></a>
- <a href="#BUCKETS"><code><b>BUCKETS()</b></code></a>
- <a href="#CREATED"><code><b>CREATED()</b></code></a>
- <a href="#DELETE"><code><b>DELETE()</b></code></a>
- <a href="#DISTINCT"><code><b>DISTINCT()</b></code></a>
- <a href="#EXIST"><code><b>EXIST()</b></code></a>
- <a href="#EXPORT"><code><b>EXPORT()</b></code></a>
- <a href="#FACETS"><code><b>FACETS()</b></code></a>
- <a href="#FIELDS"><code><b>FIELDS()</b></code></a>
- <a href="#GET"><code><b>GET()</b></code></a>
- <a href="#IMPORT"><code><b>IMPORT()</b></code></a>
- <a href="#LAST_UPDATED"><code><b>LAST_UPDATED()</b></code></a>
- <a href="#MAX"><code><b>MAX()</b></code></a>
- <a href="#MIN"><code><b>MIN()</b></code></a>
- <a href="#NOT"><code><b>NOT()</b></code></a>
- <a href="#OBJECT"><code><b>OBJECT()</b></code></a>
- <a href="#OR"><code><b>OR()</b></code></a>
- <a href="#PUT"><code><b>PUT()</b></code></a>
- <a href="#SORT"><code><b>SORT()</b></code></a>
- <a href="#STORE"><code><b>STORE</b></code></a>


<a name="InvertedIndex"></a>

### `InvertedIndex(options)`

Returns an `InvertedIndex` instance

```javascript
import { InvertedIndex } from 'fergies-inverted-index'

const ii = InvertedIndex({ name: 'myIndex' })
```

#### `options`

| options | default value | notes |
| ------- | ------------- | ------------- |
| `caseSensistive` | `true` | |
| `stopwords` | `[]` | [stopwords](https://en.wikipedia.org/wiki/Stop_word) |
| `doNotIndexField` | `[]` | All field names specified in this array will not be indexed. They will however still be present in the retrieved objects |
| `storeVectors` |  `true` | Used for among other things deletion. Set to `false` if your index is read-only |
| `Level` | Defaults to `ClassicLevel` for node and `BrowserLevel` for web | Specify any [`abstract-level`](https://www.npmjs.com/package/abstract-level?activeTab=dependents) compatible backend for your index. The defaults provide LevelDB for node environments and IndexedDB for browsers |

<a name="AGGREGATION_FILTER"></a>

### `AGGREGATION_FILTER(aggregation, query, trimEmpty).then(result)`

The aggregation (either FACETS or BUCKETS) is filtered by the
query. Use boolean `trimEmpty` to show or hide empty buckets

```javascript
Promise.all([
  FACETS({
    FIELD: ['drivetrain', 'model']
  }),
  AND(['colour:Black'])
])
  .then(([facetResult, queryResult]) =>
    AGGREGATION_FILTER(facetResult, queryResult, true)
  )
  .then(result)

```


<a name="AND"></a>

### `AND([ ...token ]).then(result)`

`AND` returns a set of object IDs that match every clause in the query.

For example- get the set of objects where the `land` property is set
to `scotland`, `year` is `1975` and `color` is `blue`
```javascript
AND([ 'land:scotland', 'year:1975', 'color:blue' ]).then(result)
```


<a name="BUCKET"></a>

### `BUCKET( token ).then(result)`

Bucket returns all object ids for objects that contain the given token

```javascript
BUCKET(
  {
    FIELD: ['year'],
    VALUE: {
      LTE: 2010
    }
  }).then(result)
```


<a name="BUCKETS"></a>

### `BUCKETS( ...token ).then(result)`

Every bucket returns all object ids for objects that contain the given token

```javascript
BUCKETS(
  {
    FIELD: ['year'],
    VALUE: {
      LTE: 2010
    }
  },
  {
    FIELD: ['year'],
    VALUE: {
      GTE: 2010
    }
  }
).then(result)
```


<a name="CREATED"></a>

### `CREATED().then(result)`

Returns the timestamp that indicates when the index was created

```javascript
CREATED().then(result)
```


<a name="DELETE"></a>

### `DELETE([ ...id ]).then(result)`

Delete all objects by id. The result indicated if the delete operation
was successful or not.

```javascript
DELETE([ 1, 2, 3 ]).then(result)
```

<a name="DISTINCT"></a>

### `DISTINCT(options).then(result)`

`DISTINCT` returns every value in the db that is greater than equal
to `GTE` and less than or equal to `LTE` (sorted alphabetically)

For example- get all names between `h` and `l`:

```javascript
DISTINCT({ GTE: 'h', LTE: 'l' }).then(result)
```

<a name="EXIST"></a>

### `EXIST( ...id ).then(result)`

Indicates whether the documents with the given ids exist in the index

```javascript
EXIST(1, 2, 3).then(result)
```


<a name="EXPORT"></a>

### `EXPORT().then(result)`

Exports the index to text file. See also IMPORT.

```javascript
EXPORT().then(result)
```


<a name="FACETS"></a>

### `FACETS( ...token ).then(result)`

Creates an aggregation for each value in the given range. FACETS
differs from BUCKETS in that FACETS creates an aggregation per value
whereas BUCKETS can create aggregations on ranges of values

```javascript
FACETS(
  {
    FIELD: 'colour'
  },
  {
    FIELD: 'drivetrain'
  }
).then(result)
```

<a name="FIELDS"></a>

### `FIELDS().then(result)`

`FIELDS` returns all available fields

```javascript
FIELDS().then(result) // 'result' is an array containing all available fields
```


<a name="GET"></a>

### `GET(token).then(result)`

`GET` returns all object ids for objects that contain the given
property, aggregated by object id.

For example to get all Teslas do:

```javascript
GET('Tesla').then(result)  // get all documents that contain Tesla, somewhere in their structure
```

Perhaps you want to be more specific and only return documents that contain `Tesla` in the `make` FIELD

```javascript
GET('make:Tesla').then(result)
```

which is equivalent to:

```javascript
GET({
  FIELD: 'make',
  VALUE: 'Tesla'
}).then(result)
```

You can get all cars that begin with `O` to `V` in which case you could do

```javascript
GET({
  FIELD: 'make',
  VALUE: {
    GTE: 'O',   // GTE == greater than or equal to
    LTE: 'V'    // LTE == less than or equal to
  }
}).then(result)
```

<a name="IMPORT"></a>

### `IMPORT(exportedIndex).then(result)`

Reads in an exported index and returns a status.

See also EXPORT.

```javascript
IMPORT(exportedIndex).then(result)
```


<a name="LAST_UPDATED"></a>

### `LAST_UPDATED().then(result)`

Returns a timestamp indicating when the index was last updated.

```javascript
LAST_UPDATED().then(result)
```


<a name="MAX"></a>

### `MAX(token).then(result)`

Get the highest alphabetical value in a given token

For example- see the highest price:

```javascript
MAX('price')
```


<a name="MIN"></a>

### `MIN(token).then(result)`

Get the lowest alphabetical value in a given token

For example- see the lowest price:

```javascript
MIN('price')
```


<a name="NOT"></a>

### `NOT(A, B).then(result)`

Where A and B are sets, `NOT` Returns the ids of objects that are
present in A, but not in B.

For example:

```javascript
NOT(
  global[indexName].GET({
    FIELD: 'sectorcode',
    VALUE: {
      GTE: 'A',
      LTE: 'G'
    }
  }),
  'sectorcode:YZ'
)

```


<a name="OBJECT"></a>

### `OBJECT([ ...id ]).then(result)`

Given an array of ids, `OBJECT` will return the corresponding
objects.

```javascript
AND([
  'board_approval_month:October',
  global[indexName].OR([
    'sectorcode:LR',
    global[indexName].AND(['sectorcode:BC', 'sectorcode:BM'])
  ])
])
  .then(OBJECT)
  .then(result)
```


<a name="OR"></a>

### `OR([ ...tokens ]).then(result)`

Return ids of objects that are in one or more of the query clauses

For example- get the set of objects where the `land` property is set
to `scotland`, or `year` is `1975` or `color` is `blue`
```javascript
AND([ 'land:scotland', 'year:1975', 'color:blue' ]).then(result)
```


<a name="PUT"></a>

### `PUT([ ...documents ]).then(result)`

Add documents to index

For example:

```javascript
PUT([
  {
    _id: 8,
    make: 'BMW',
    colour: 'Silver',
    year: 2015,
    price: 81177,
    model: '3-series',
    drivetrain: 'Petrol'
  },
  {
    _id: 9,
    make: 'Volvo',
    colour: 'White',
    year: 2004,
    price: 3751,
    model: 'XC90',
    drivetrain: 'Hybrid'
  }
]).then(result)
```


<a name="SORT"></a>

### `SORT(resultSet).then(result)`

Example:

```javascript
GET('blue').then(SORT)
```

<a name="STORE"></a>

### `STORE`

Property that points to the underlying [level](https://github.com/Level/level) store


test
