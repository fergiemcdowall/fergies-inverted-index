# Fergie's Inverted Index
#### This is my inverted index library. There are many like it, but this one is mine.

Throw JavaScript objects at the index and they will become retrievable by their properties using promises and map-reduce ([see examples](https://github.com/fergiemcdowall/fergies-inverted-index/tree/master/test))


## API

Command   | Options      | Accepts    | Returns    | Writes | Description
--------- | ------------ | ---------- | ---------- | ------ | -----------
`AND`     |              | properties | ids        | no     |
`DELETE`  |              | ids        | ids        | yes    |
`DISTINCT`|              | properties | properties | no     |
`EACH`    |              | properties | ids        | no     |
`GET`     | `gte`, `lte` | properties | ids        | no     |
`MAX`     |              | properties | properties | no     |
`MIN`     |              | properties | properties | no     |
`NOT`     |              | ids        | ids        | no     |
`OBJECT`  |              | ids        | objects    | no     |
`OR`      |              | properties | ids        | no     |
`PUT`     |              | objects    | ids        | yes    |
`STORE`   |              | levelup    | levelup    | both   |
