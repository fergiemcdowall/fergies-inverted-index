# Why distribute indexes?

You might have a small catalogue, classifier or search application on
a web page- traditionally these applications need to send queries back
and forward to a server. That is to say that the index exists in one
place and accessed by every client. However, in certain scenarios,
making a copy of the index locally available on the client is
desirable. In these cases we can _distribute_ the index.


### Use cases for distributed inverted indexes

* Real-time text classification

* Network resilience

* When the lowest possible latency in query-response times is needed

* When many users access a smaller dataset

### Trade-offs when using distributed indexes

* Entire index must be given to the user.

* Once index is replicated to a user, individual tuples cannot
  trivially be updated without resynchronising the entire index.

* Unsuitable for larger datasets


# How and when to distribute indexes

1. Create and export an index to file using the cli tool
'fergies-inverted-indexer'

1. Create the logic that will control the application

1. Use browserify (or similar) to create an application bundle that
can execute in the browser

1. (optional) service workers?


# Example

_coming..._