var levelup = require('levelup');
var r = require("restify");
var db = levelup("store")

function put(req, res, next) {
  var body = JSON.parse(req.body)
  var key = body.key
  var val = body.value
  db.put(key, val, function(err) {
    if (err) {console.log(err)}
    res.send(JSON.stringify(req.body) + ' inserted');
    return next();
  })
}

function get(req, res, next) {
  var key = req.params.key
  db.get(key, function(err, value) {
    if (err) {console.log(err)}
    res.send(value);
    return next();
  })
}

var server = r.createServer({
  name: 'naturalDB',
  version: require("./package.json").version
});

server.use(r.bodyParser());
server.listen(8080);
server.get('/get/:key', get);
server.post('/put', put);

console.log('    add: curl -X POST -d \'{"key": "Anette", "value": "girlfriend"}\' localhost:8080/put')
console.log('    get: curl localhost:8080/get/Anette')
