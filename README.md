# Fergie's Inverted Index
#### This is my inverted index library. There are many like it, but this one is mine.

Throw JavaScript objects at the index and they will become retrievable by their properties using promises and map-reduce ([see examples](https://github.com/fergiemcdowall/fergies-inverted-index/tree/master/test))


## API

Command   | Options      | Accepts    | Returns    | Writes | Description
--------- | ------------ | ---------- | ---------- | ------ | -----------
`AND`     |              | properties | ids        | no     | Boolean AND. Return IDs of objects that have prop.A AND prop.b
`DELETE`  |              | ids        | ids        | yes    | Remove objects from index
`DISTINCT`| `gte`, `lte` | properties | properties | no     | Return all properties in a range.
`EACH`    |              | properties | ids        | no     | 
`GET`     | `gte`, `lte` | properties | ids        | no     | Get the IDs of objects with a property in the given range
`MAX`     |              | properties | properties | no     | Get the highest property in this namespace
`MIN`     |              | properties | properties | no     | Get the lowest property in this namespace
`NOT`     |              | ids        | ids        | no     | Get all IDs of objects in set A that are not in set B
`OBJECT`  |              | ids        | objects    | no     | Get an object by its ID
`OR`      |              | properties | ids        | no     | Boolean OR. Return IDs of objects that have either prop.A OR prop.b
`PUT`     |              | objects    | ids        | yes    | Add objects to index
`STORE`   |              | levelup    | levelup    | both   | Get the underlying [levelup](https://github.com/Level/levelup) store.
