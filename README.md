# naturaldb
#### A database that feels natural

NaturalDB (NDB) is a datastore that talks javascript and is really easy to use.

 * can index unstructured js documents
 * can retrieve docs by 

## API

 * put
 * get
 * del

### put

options

  * indexed fields (prefixed with underscore, "_id" is reserved and must be specified)
  (fields are sorted by bytewise)

### get

  * by indexed field
  * can use gte, lte
  * can provide a .js sort function (maybe make some )
  * can reverence object paths using js notation("parent.daugheter.someArray[3]")

### del

  * can delete by !id