(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
    typeof define === 'function' && define.amd ? define(factory) :
    (global = global || self, global['fergies-inverted-index'] = factory());
}(this, function () { 'use strict';

    var immutable = extend;

    var hasOwnProperty = Object.prototype.hasOwnProperty;

    function extend() {
        var target = {};

        for (var i = 0; i < arguments.length; i++) {
            var source = arguments[i];

            for (var key in source) {
                if (hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }

        return target
    }

    /* Copyright (c) 2017 Rod Vagg, MIT License */

    function AbstractIterator (db) {
      this.db = db;
      this._ended = false;
      this._nexting = false;
    }

    AbstractIterator.prototype.next = function (callback) {
      var self = this;

      if (typeof callback !== 'function') {
        throw new Error('next() requires a callback argument')
      }

      if (self._ended) {
        process.nextTick(callback, new Error('cannot call next() after end()'));
        return self
      }

      if (self._nexting) {
        process.nextTick(callback, new Error('cannot call next() before previous next() has completed'));
        return self
      }

      self._nexting = true;
      self._next(function () {
        self._nexting = false;
        callback.apply(null, arguments);
      });

      return self
    };

    AbstractIterator.prototype._next = function (callback) {
      process.nextTick(callback);
    };

    AbstractIterator.prototype.end = function (callback) {
      if (typeof callback !== 'function') {
        throw new Error('end() requires a callback argument')
      }

      if (this._ended) {
        return process.nextTick(callback, new Error('end() already called on iterator'))
      }

      this._ended = true;
      this._end(callback);
    };

    AbstractIterator.prototype._end = function (callback) {
      process.nextTick(callback);
    };

    var abstractIterator = AbstractIterator;

    /* Copyright (c) 2017 Rod Vagg, MIT License */

    function AbstractChainedBatch (db) {
      this._db = db;
      this._operations = [];
      this._written = false;
    }

    AbstractChainedBatch.prototype._serializeKey = function (key) {
      return this._db._serializeKey(key)
    };

    AbstractChainedBatch.prototype._serializeValue = function (value) {
      return this._db._serializeValue(value)
    };

    AbstractChainedBatch.prototype._checkWritten = function () {
      if (this._written) {
        throw new Error('write() already called on this batch')
      }
    };

    AbstractChainedBatch.prototype.put = function (key, value) {
      this._checkWritten();

      var err = this._db._checkKey(key, 'key');
      if (err) { throw err }

      key = this._serializeKey(key);
      value = this._serializeValue(value);

      this._put(key, value);

      return this
    };

    AbstractChainedBatch.prototype._put = function (key, value) {
      this._operations.push({ type: 'put', key: key, value: value });
    };

    AbstractChainedBatch.prototype.del = function (key) {
      this._checkWritten();

      var err = this._db._checkKey(key, 'key');
      if (err) { throw err }

      key = this._serializeKey(key);
      this._del(key);

      return this
    };

    AbstractChainedBatch.prototype._del = function (key) {
      this._operations.push({ type: 'del', key: key });
    };

    AbstractChainedBatch.prototype.clear = function () {
      this._checkWritten();
      this._operations = [];
      this._clear();

      return this
    };

    AbstractChainedBatch.prototype._clear = function noop () {};

    AbstractChainedBatch.prototype.write = function (options, callback) {
      this._checkWritten();

      if (typeof options === 'function') { callback = options; }
      if (typeof callback !== 'function') {
        throw new Error('write() requires a callback argument')
      }
      if (typeof options !== 'object') { options = {}; }

      this._written = true;

      // @ts-ignore
      if (typeof this._write === 'function') { return this._write(callback) }

      if (typeof this._db._batch === 'function') {
        return this._db._batch(this._operations, options, callback)
      }

      process.nextTick(callback);
    };

    var abstractChainedBatch = AbstractChainedBatch;

    /* Copyright (c) 2017 Rod Vagg, MIT License */




    const hasOwnProperty$1 = Object.prototype.hasOwnProperty;
    const rangeOptions = 'start end gt gte lt lte'.split(' ');

    function AbstractLevelDOWN (location) {
      if (!arguments.length || location === undefined) {
        throw new Error('constructor requires at least a location argument')
      }

      if (typeof location !== 'string') {
        throw new Error('constructor requires a location string argument')
      }

      this.location = location;
      this.status = 'new';
    }

    AbstractLevelDOWN.prototype.open = function (options, callback) {
      var self = this;
      var oldStatus = this.status;

      if (typeof options === 'function') { callback = options; }

      if (typeof callback !== 'function') {
        throw new Error('open() requires a callback argument')
      }

      if (typeof options !== 'object') { options = {}; }

      options.createIfMissing = options.createIfMissing !== false;
      options.errorIfExists = !!options.errorIfExists;

      this.status = 'opening';
      this._open(options, function (err) {
        if (err) {
          self.status = oldStatus;
          return callback(err)
        }
        self.status = 'open';
        callback();
      });
    };

    AbstractLevelDOWN.prototype._open = function (options, callback) {
      process.nextTick(callback);
    };

    AbstractLevelDOWN.prototype.close = function (callback) {
      var self = this;
      var oldStatus = this.status;

      if (typeof callback !== 'function') {
        throw new Error('close() requires a callback argument')
      }

      this.status = 'closing';
      this._close(function (err) {
        if (err) {
          self.status = oldStatus;
          return callback(err)
        }
        self.status = 'closed';
        callback();
      });
    };

    AbstractLevelDOWN.prototype._close = function (callback) {
      process.nextTick(callback);
    };

    AbstractLevelDOWN.prototype.get = function (key, options, callback) {
      if (typeof options === 'function') { callback = options; }

      if (typeof callback !== 'function') {
        throw new Error('get() requires a callback argument')
      }

      var err = this._checkKey(key, 'key');
      if (err) return process.nextTick(callback, err)

      key = this._serializeKey(key);

      if (typeof options !== 'object') { options = {}; }

      options.asBuffer = options.asBuffer !== false;

      this._get(key, options, callback);
    };

    AbstractLevelDOWN.prototype._get = function (key, options, callback) {
      process.nextTick(function () { callback(new Error('NotFound')); });
    };

    AbstractLevelDOWN.prototype.put = function (key, value, options, callback) {
      if (typeof options === 'function') { callback = options; }

      if (typeof callback !== 'function') {
        throw new Error('put() requires a callback argument')
      }

      var err = this._checkKey(key, 'key');
      if (err) return process.nextTick(callback, err)

      key = this._serializeKey(key);
      value = this._serializeValue(value);

      if (typeof options !== 'object') { options = {}; }

      this._put(key, value, options, callback);
    };

    AbstractLevelDOWN.prototype._put = function (key, value, options, callback) {
      process.nextTick(callback);
    };

    AbstractLevelDOWN.prototype.del = function (key, options, callback) {
      if (typeof options === 'function') { callback = options; }

      if (typeof callback !== 'function') {
        throw new Error('del() requires a callback argument')
      }

      var err = this._checkKey(key, 'key');
      if (err) return process.nextTick(callback, err)

      key = this._serializeKey(key);

      if (typeof options !== 'object') { options = {}; }

      this._del(key, options, callback);
    };

    AbstractLevelDOWN.prototype._del = function (key, options, callback) {
      process.nextTick(callback);
    };

    AbstractLevelDOWN.prototype.batch = function (array, options, callback) {
      if (!arguments.length) { return this._chainedBatch() }

      if (typeof options === 'function') { callback = options; }

      if (typeof array === 'function') { callback = array; }

      if (typeof callback !== 'function') {
        throw new Error('batch(array) requires a callback argument')
      }

      if (!Array.isArray(array)) {
        return process.nextTick(callback, new Error('batch(array) requires an array argument'))
      }

      if (!options || typeof options !== 'object') { options = {}; }

      var serialized = new Array(array.length);

      for (var i = 0; i < array.length; i++) {
        if (typeof array[i] !== 'object' || array[i] === null) {
          return process.nextTick(callback, new Error('batch(array) element must be an object and not `null`'))
        }

        var e = immutable(array[i]);

        if (e.type !== 'put' && e.type !== 'del') {
          return process.nextTick(callback, new Error("`type` must be 'put' or 'del'"))
        }

        var err = this._checkKey(e.key, 'key');
        if (err) return process.nextTick(callback, err)

        e.key = this._serializeKey(e.key);

        if (e.type === 'put') { e.value = this._serializeValue(e.value); }

        serialized[i] = e;
      }

      this._batch(serialized, options, callback);
    };

    AbstractLevelDOWN.prototype._batch = function (array, options, callback) {
      process.nextTick(callback);
    };

    AbstractLevelDOWN.prototype._setupIteratorOptions = function (options) {
      options = cleanRangeOptions(options);

      options.reverse = !!options.reverse;
      options.keys = options.keys !== false;
      options.values = options.values !== false;
      options.limit = 'limit' in options ? options.limit : -1;
      options.keyAsBuffer = options.keyAsBuffer !== false;
      options.valueAsBuffer = options.valueAsBuffer !== false;

      return options
    };

    function cleanRangeOptions (options) {
      var result = {};

      for (var k in options) {
        if (!hasOwnProperty$1.call(options, k)) continue
        if (isRangeOption(k) && isEmptyRangeOption(options[k])) continue

        result[k] = options[k];
      }

      return result
    }

    function isRangeOption (k) {
      return rangeOptions.indexOf(k) !== -1
    }

    function isEmptyRangeOption (v) {
      return v === '' || v == null || isEmptyBuffer(v)
    }

    function isEmptyBuffer (v) {
      return Buffer.isBuffer(v) && v.length === 0
    }

    AbstractLevelDOWN.prototype.iterator = function (options) {
      if (typeof options !== 'object') { options = {}; }
      options = this._setupIteratorOptions(options);
      return this._iterator(options)
    };

    AbstractLevelDOWN.prototype._iterator = function (options) {
      return new abstractIterator(this)
    };

    AbstractLevelDOWN.prototype._chainedBatch = function () {
      return new abstractChainedBatch(this)
    };

    AbstractLevelDOWN.prototype._serializeKey = function (key) {
      return Buffer.isBuffer(key) ? key : String(key)
    };

    AbstractLevelDOWN.prototype._serializeValue = function (value) {
      if (value == null) return ''
      return Buffer.isBuffer(value) || process.browser ? value : String(value)
    };

    AbstractLevelDOWN.prototype._checkKey = function (obj, type) {
      if (obj === null || obj === undefined) {
        return new Error(type + ' cannot be `null` or `undefined`')
      }

      if (Buffer.isBuffer(obj) && obj.length === 0) {
        return new Error(type + ' cannot be an empty Buffer')
      }

      if (String(obj) === '') {
        return new Error(type + ' cannot be an empty String')
      }
    };

    var abstractLeveldown = AbstractLevelDOWN;

    var AbstractLevelDOWN$1 = abstractLeveldown;
    var AbstractIterator$1 = abstractIterator;
    var AbstractChainedBatch$1 = abstractChainedBatch;

    var abstractLeveldown$1 = {
    	AbstractLevelDOWN: AbstractLevelDOWN$1,
    	AbstractIterator: AbstractIterator$1,
    	AbstractChainedBatch: AbstractChainedBatch$1
    };

    // shim for using process in browser
    // based off https://github.com/defunctzombie/node-process/blob/master/browser.js

    function defaultSetTimout() {
        throw new Error('setTimeout has not been defined');
    }
    function defaultClearTimeout () {
        throw new Error('clearTimeout has not been defined');
    }
    var cachedSetTimeout = defaultSetTimout;
    var cachedClearTimeout = defaultClearTimeout;
    if (typeof global.setTimeout === 'function') {
        cachedSetTimeout = setTimeout;
    }
    if (typeof global.clearTimeout === 'function') {
        cachedClearTimeout = clearTimeout;
    }

    function runTimeout(fun) {
        if (cachedSetTimeout === setTimeout) {
            //normal enviroments in sane situations
            return setTimeout(fun, 0);
        }
        // if setTimeout wasn't available but was latter defined
        if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
            cachedSetTimeout = setTimeout;
            return setTimeout(fun, 0);
        }
        try {
            // when when somebody has screwed with setTimeout but no I.E. maddness
            return cachedSetTimeout(fun, 0);
        } catch(e){
            try {
                // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
                return cachedSetTimeout.call(null, fun, 0);
            } catch(e){
                // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
                return cachedSetTimeout.call(this, fun, 0);
            }
        }


    }
    function runClearTimeout(marker) {
        if (cachedClearTimeout === clearTimeout) {
            //normal enviroments in sane situations
            return clearTimeout(marker);
        }
        // if clearTimeout wasn't available but was latter defined
        if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
            cachedClearTimeout = clearTimeout;
            return clearTimeout(marker);
        }
        try {
            // when when somebody has screwed with setTimeout but no I.E. maddness
            return cachedClearTimeout(marker);
        } catch (e){
            try {
                // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
                return cachedClearTimeout.call(null, marker);
            } catch (e){
                // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
                // Some versions of I.E. have different rules for clearTimeout vs setTimeout
                return cachedClearTimeout.call(this, marker);
            }
        }



    }
    var queue = [];
    var draining = false;
    var currentQueue;
    var queueIndex = -1;

    function cleanUpNextTick() {
        if (!draining || !currentQueue) {
            return;
        }
        draining = false;
        if (currentQueue.length) {
            queue = currentQueue.concat(queue);
        } else {
            queueIndex = -1;
        }
        if (queue.length) {
            drainQueue();
        }
    }

    function drainQueue() {
        if (draining) {
            return;
        }
        var timeout = runTimeout(cleanUpNextTick);
        draining = true;

        var len = queue.length;
        while(len) {
            currentQueue = queue;
            queue = [];
            while (++queueIndex < len) {
                if (currentQueue) {
                    currentQueue[queueIndex].run();
                }
            }
            queueIndex = -1;
            len = queue.length;
        }
        currentQueue = null;
        draining = false;
        runClearTimeout(timeout);
    }
    function nextTick(fun) {
        var args = new Array(arguments.length - 1);
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                args[i - 1] = arguments[i];
            }
        }
        queue.push(new Item(fun, args));
        if (queue.length === 1 && !draining) {
            runTimeout(drainQueue);
        }
    }
    // v8 likes predictible objects
    function Item(fun, array) {
        this.fun = fun;
        this.array = array;
    }
    Item.prototype.run = function () {
        this.fun.apply(null, this.array);
    };
    var title = 'browser';
    var platform = 'browser';
    var browser = true;
    var env = {};
    var argv = [];
    var version = ''; // empty string to avoid regexp issues
    var versions = {};
    var release = {};
    var config = {};

    function noop() {}

    var on = noop;
    var addListener = noop;
    var once = noop;
    var off = noop;
    var removeListener = noop;
    var removeAllListeners = noop;
    var emit = noop;

    function binding(name) {
        throw new Error('process.binding is not supported');
    }

    function cwd () { return '/' }
    function chdir (dir) {
        throw new Error('process.chdir is not supported');
    }function umask() { return 0; }

    // from https://github.com/kumavis/browser-process-hrtime/blob/master/index.js
    var performance = global.performance || {};
    var performanceNow =
      performance.now        ||
      performance.mozNow     ||
      performance.msNow      ||
      performance.oNow       ||
      performance.webkitNow  ||
      function(){ return (new Date()).getTime() };

    // generate timestamp or delta
    // see http://nodejs.org/api/process.html#process_process_hrtime
    function hrtime(previousTimestamp){
      var clocktime = performanceNow.call(performance)*1e-3;
      var seconds = Math.floor(clocktime);
      var nanoseconds = Math.floor((clocktime%1)*1e9);
      if (previousTimestamp) {
        seconds = seconds - previousTimestamp[0];
        nanoseconds = nanoseconds - previousTimestamp[1];
        if (nanoseconds<0) {
          seconds--;
          nanoseconds += 1e9;
        }
      }
      return [seconds,nanoseconds]
    }

    var startTime = new Date();
    function uptime() {
      var currentTime = new Date();
      var dif = currentTime - startTime;
      return dif / 1000;
    }

    var process$1 = {
      nextTick: nextTick,
      title: title,
      browser: browser,
      env: env,
      argv: argv,
      version: version,
      versions: versions,
      on: on,
      addListener: addListener,
      once: once,
      off: off,
      removeListener: removeListener,
      removeAllListeners: removeAllListeners,
      emit: emit,
      binding: binding,
      cwd: cwd,
      chdir: chdir,
      umask: umask,
      hrtime: hrtime,
      platform: platform,
      release: release,
      config: config,
      uptime: uptime
    };

    var inherits;
    if (typeof Object.create === 'function'){
      inherits = function inherits(ctor, superCtor) {
        // implementation from standard node.js 'util' module
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      };
    } else {
      inherits = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function () {};
        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor();
        ctor.prototype.constructor = ctor;
      };
    }
    var inherits$1 = inherits;

    // Copyright Joyent, Inc. and other Node contributors.
    var formatRegExp = /%[sdj%]/g;
    function format(f) {
      if (!isString(f)) {
        var objects = [];
        for (var i = 0; i < arguments.length; i++) {
          objects.push(inspect(arguments[i]));
        }
        return objects.join(' ');
      }

      var i = 1;
      var args = arguments;
      var len = args.length;
      var str = String(f).replace(formatRegExp, function(x) {
        if (x === '%%') return '%';
        if (i >= len) return x;
        switch (x) {
          case '%s': return String(args[i++]);
          case '%d': return Number(args[i++]);
          case '%j':
            try {
              return JSON.stringify(args[i++]);
            } catch (_) {
              return '[Circular]';
            }
          default:
            return x;
        }
      });
      for (var x = args[i]; i < len; x = args[++i]) {
        if (isNull(x) || !isObject(x)) {
          str += ' ' + x;
        } else {
          str += ' ' + inspect(x);
        }
      }
      return str;
    }

    // Mark that a method should not be used.
    // Returns a modified function which warns once by default.
    // If --no-deprecation is set, then it is a no-op.
    function deprecate(fn, msg) {
      // Allow for deprecating things in the process of starting up.
      if (isUndefined(global.process)) {
        return function() {
          return deprecate(fn, msg).apply(this, arguments);
        };
      }

      var warned = false;
      function deprecated() {
        if (!warned) {
          {
            console.error(msg);
          }
          warned = true;
        }
        return fn.apply(this, arguments);
      }

      return deprecated;
    }

    var debugs = {};
    var debugEnviron;
    function debuglog(set) {
      if (isUndefined(debugEnviron))
        debugEnviron = process$1.env.NODE_DEBUG || '';
      set = set.toUpperCase();
      if (!debugs[set]) {
        if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
          var pid = 0;
          debugs[set] = function() {
            var msg = format.apply(null, arguments);
            console.error('%s %d: %s', set, pid, msg);
          };
        } else {
          debugs[set] = function() {};
        }
      }
      return debugs[set];
    }

    /**
     * Echos the value of a value. Trys to print the value out
     * in the best way possible given the different types.
     *
     * @param {Object} obj The object to print out.
     * @param {Object} opts Optional options object that alters the output.
     */
    /* legacy: obj, showHidden, depth, colors*/
    function inspect(obj, opts) {
      // default options
      var ctx = {
        seen: [],
        stylize: stylizeNoColor
      };
      // legacy...
      if (arguments.length >= 3) ctx.depth = arguments[2];
      if (arguments.length >= 4) ctx.colors = arguments[3];
      if (isBoolean(opts)) {
        // legacy...
        ctx.showHidden = opts;
      } else if (opts) {
        // got an "options" object
        _extend(ctx, opts);
      }
      // set default options
      if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
      if (isUndefined(ctx.depth)) ctx.depth = 2;
      if (isUndefined(ctx.colors)) ctx.colors = false;
      if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
      if (ctx.colors) ctx.stylize = stylizeWithColor;
      return formatValue(ctx, obj, ctx.depth);
    }

    // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
    inspect.colors = {
      'bold' : [1, 22],
      'italic' : [3, 23],
      'underline' : [4, 24],
      'inverse' : [7, 27],
      'white' : [37, 39],
      'grey' : [90, 39],
      'black' : [30, 39],
      'blue' : [34, 39],
      'cyan' : [36, 39],
      'green' : [32, 39],
      'magenta' : [35, 39],
      'red' : [31, 39],
      'yellow' : [33, 39]
    };

    // Don't use 'blue' not visible on cmd.exe
    inspect.styles = {
      'special': 'cyan',
      'number': 'yellow',
      'boolean': 'yellow',
      'undefined': 'grey',
      'null': 'bold',
      'string': 'green',
      'date': 'magenta',
      // "name": intentionally not styling
      'regexp': 'red'
    };


    function stylizeWithColor(str, styleType) {
      var style = inspect.styles[styleType];

      if (style) {
        return '\u001b[' + inspect.colors[style][0] + 'm' + str +
               '\u001b[' + inspect.colors[style][1] + 'm';
      } else {
        return str;
      }
    }


    function stylizeNoColor(str, styleType) {
      return str;
    }


    function arrayToHash(array) {
      var hash = {};

      array.forEach(function(val, idx) {
        hash[val] = true;
      });

      return hash;
    }


    function formatValue(ctx, value, recurseTimes) {
      // Provide a hook for user-specified inspect functions.
      // Check that value is an object with an inspect function on it
      if (ctx.customInspect &&
          value &&
          isFunction(value.inspect) &&
          // Filter out the util module, it's inspect function is special
          value.inspect !== inspect &&
          // Also filter out any prototype objects using the circular check.
          !(value.constructor && value.constructor.prototype === value)) {
        var ret = value.inspect(recurseTimes, ctx);
        if (!isString(ret)) {
          ret = formatValue(ctx, ret, recurseTimes);
        }
        return ret;
      }

      // Primitive types cannot have properties
      var primitive = formatPrimitive(ctx, value);
      if (primitive) {
        return primitive;
      }

      // Look up the keys of the object.
      var keys = Object.keys(value);
      var visibleKeys = arrayToHash(keys);

      if (ctx.showHidden) {
        keys = Object.getOwnPropertyNames(value);
      }

      // IE doesn't make error fields non-enumerable
      // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
      if (isError(value)
          && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
        return formatError(value);
      }

      // Some type of object without properties can be shortcutted.
      if (keys.length === 0) {
        if (isFunction(value)) {
          var name = value.name ? ': ' + value.name : '';
          return ctx.stylize('[Function' + name + ']', 'special');
        }
        if (isRegExp(value)) {
          return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
        }
        if (isDate(value)) {
          return ctx.stylize(Date.prototype.toString.call(value), 'date');
        }
        if (isError(value)) {
          return formatError(value);
        }
      }

      var base = '', array = false, braces = ['{', '}'];

      // Make Array say that they are Array
      if (isArray(value)) {
        array = true;
        braces = ['[', ']'];
      }

      // Make functions say that they are functions
      if (isFunction(value)) {
        var n = value.name ? ': ' + value.name : '';
        base = ' [Function' + n + ']';
      }

      // Make RegExps say that they are RegExps
      if (isRegExp(value)) {
        base = ' ' + RegExp.prototype.toString.call(value);
      }

      // Make dates with properties first say the date
      if (isDate(value)) {
        base = ' ' + Date.prototype.toUTCString.call(value);
      }

      // Make error with message first say the error
      if (isError(value)) {
        base = ' ' + formatError(value);
      }

      if (keys.length === 0 && (!array || value.length == 0)) {
        return braces[0] + base + braces[1];
      }

      if (recurseTimes < 0) {
        if (isRegExp(value)) {
          return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
        } else {
          return ctx.stylize('[Object]', 'special');
        }
      }

      ctx.seen.push(value);

      var output;
      if (array) {
        output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
      } else {
        output = keys.map(function(key) {
          return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
        });
      }

      ctx.seen.pop();

      return reduceToSingleString(output, base, braces);
    }


    function formatPrimitive(ctx, value) {
      if (isUndefined(value))
        return ctx.stylize('undefined', 'undefined');
      if (isString(value)) {
        var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                                 .replace(/'/g, "\\'")
                                                 .replace(/\\"/g, '"') + '\'';
        return ctx.stylize(simple, 'string');
      }
      if (isNumber(value))
        return ctx.stylize('' + value, 'number');
      if (isBoolean(value))
        return ctx.stylize('' + value, 'boolean');
      // For some reason typeof null is "object", so special case here.
      if (isNull(value))
        return ctx.stylize('null', 'null');
    }


    function formatError(value) {
      return '[' + Error.prototype.toString.call(value) + ']';
    }


    function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
      var output = [];
      for (var i = 0, l = value.length; i < l; ++i) {
        if (hasOwnProperty$2(value, String(i))) {
          output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
              String(i), true));
        } else {
          output.push('');
        }
      }
      keys.forEach(function(key) {
        if (!key.match(/^\d+$/)) {
          output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
              key, true));
        }
      });
      return output;
    }


    function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
      var name, str, desc;
      desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
      if (desc.get) {
        if (desc.set) {
          str = ctx.stylize('[Getter/Setter]', 'special');
        } else {
          str = ctx.stylize('[Getter]', 'special');
        }
      } else {
        if (desc.set) {
          str = ctx.stylize('[Setter]', 'special');
        }
      }
      if (!hasOwnProperty$2(visibleKeys, key)) {
        name = '[' + key + ']';
      }
      if (!str) {
        if (ctx.seen.indexOf(desc.value) < 0) {
          if (isNull(recurseTimes)) {
            str = formatValue(ctx, desc.value, null);
          } else {
            str = formatValue(ctx, desc.value, recurseTimes - 1);
          }
          if (str.indexOf('\n') > -1) {
            if (array) {
              str = str.split('\n').map(function(line) {
                return '  ' + line;
              }).join('\n').substr(2);
            } else {
              str = '\n' + str.split('\n').map(function(line) {
                return '   ' + line;
              }).join('\n');
            }
          }
        } else {
          str = ctx.stylize('[Circular]', 'special');
        }
      }
      if (isUndefined(name)) {
        if (array && key.match(/^\d+$/)) {
          return str;
        }
        name = JSON.stringify('' + key);
        if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
          name = name.substr(1, name.length - 2);
          name = ctx.stylize(name, 'name');
        } else {
          name = name.replace(/'/g, "\\'")
                     .replace(/\\"/g, '"')
                     .replace(/(^"|"$)/g, "'");
          name = ctx.stylize(name, 'string');
        }
      }

      return name + ': ' + str;
    }


    function reduceToSingleString(output, base, braces) {
      var length = output.reduce(function(prev, cur) {
        if (cur.indexOf('\n') >= 0) ;
        return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
      }, 0);

      if (length > 60) {
        return braces[0] +
               (base === '' ? '' : base + '\n ') +
               ' ' +
               output.join(',\n  ') +
               ' ' +
               braces[1];
      }

      return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
    }


    // NOTE: These type checking functions intentionally don't use `instanceof`
    // because it is fragile and can be easily faked with `Object.create()`.
    function isArray(ar) {
      return Array.isArray(ar);
    }

    function isBoolean(arg) {
      return typeof arg === 'boolean';
    }

    function isNull(arg) {
      return arg === null;
    }

    function isNullOrUndefined(arg) {
      return arg == null;
    }

    function isNumber(arg) {
      return typeof arg === 'number';
    }

    function isString(arg) {
      return typeof arg === 'string';
    }

    function isSymbol(arg) {
      return typeof arg === 'symbol';
    }

    function isUndefined(arg) {
      return arg === void 0;
    }

    function isRegExp(re) {
      return isObject(re) && objectToString(re) === '[object RegExp]';
    }

    function isObject(arg) {
      return typeof arg === 'object' && arg !== null;
    }

    function isDate(d) {
      return isObject(d) && objectToString(d) === '[object Date]';
    }

    function isError(e) {
      return isObject(e) &&
          (objectToString(e) === '[object Error]' || e instanceof Error);
    }

    function isFunction(arg) {
      return typeof arg === 'function';
    }

    function isPrimitive(arg) {
      return arg === null ||
             typeof arg === 'boolean' ||
             typeof arg === 'number' ||
             typeof arg === 'string' ||
             typeof arg === 'symbol' ||  // ES6 symbol
             typeof arg === 'undefined';
    }

    function isBuffer(maybeBuf) {
      return Buffer.isBuffer(maybeBuf);
    }

    function objectToString(o) {
      return Object.prototype.toString.call(o);
    }


    function pad(n) {
      return n < 10 ? '0' + n.toString(10) : n.toString(10);
    }


    var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
                  'Oct', 'Nov', 'Dec'];

    // 26 Feb 16:19:34
    function timestamp() {
      var d = new Date();
      var time = [pad(d.getHours()),
                  pad(d.getMinutes()),
                  pad(d.getSeconds())].join(':');
      return [d.getDate(), months[d.getMonth()], time].join(' ');
    }


    // log is just a thin wrapper to console.log that prepends a timestamp
    function log() {
      console.log('%s - %s', timestamp(), format.apply(null, arguments));
    }

    function _extend(origin, add) {
      // Don't do anything if add isn't an object
      if (!add || !isObject(add)) return origin;

      var keys = Object.keys(add);
      var i = keys.length;
      while (i--) {
        origin[keys[i]] = add[keys[i]];
      }
      return origin;
    }
    function hasOwnProperty$2(obj, prop) {
      return Object.prototype.hasOwnProperty.call(obj, prop);
    }

    var require$$0 = {
      inherits: inherits$1,
      _extend: _extend,
      log: log,
      isBuffer: isBuffer,
      isPrimitive: isPrimitive,
      isFunction: isFunction,
      isError: isError,
      isDate: isDate,
      isObject: isObject,
      isRegExp: isRegExp,
      isUndefined: isUndefined,
      isSymbol: isSymbol,
      isString: isString,
      isNumber: isNumber,
      isNullOrUndefined: isNullOrUndefined,
      isNull: isNull,
      isBoolean: isBoolean,
      isArray: isArray,
      inspect: inspect,
      deprecate: deprecate,
      format: format,
      debuglog: debuglog
    };

    var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function commonjsRequire () {
    	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
    }

    function createCommonjsModule(fn, module) {
    	return module = { exports: {} }, fn(module, module.exports), module.exports;
    }

    var encodings = createCommonjsModule(function (module, exports) {
    exports.utf8 = exports['utf-8'] = {
      encode: function(data){
        return isBinary(data)
          ? data
          : String(data);
      },
      decode: identity,
      buffer: false,
      type: 'utf8'
    };

    exports.json = {
      encode: JSON.stringify,
      decode: JSON.parse,
      buffer: false,
      type: 'json'
    };

    exports.binary = {
      encode: function(data){
        return isBinary(data)
          ? data
          : new Buffer(data);      
      },
      decode: identity,
      buffer: true,
      type: 'binary'
    };

    exports.none = {
      encode: identity,
      decode: identity,
      buffer: false,
      type: 'id'
    };

    exports.id = exports.none;

    var bufferEncodings = [
      'hex',
      'ascii',
      'base64',
      'ucs2',
      'ucs-2',
      'utf16le',
      'utf-16le'
    ];

    bufferEncodings.forEach(function(type){
      exports[type] = {
        encode: function(data){
          return isBinary(data)
            ? data
            : new Buffer(data, type);
        },
        decode: function(buffer){
          return buffer.toString(type);
        },
        buffer: true,
        type: type
      };
    });

    function identity(value){
      return value;
    }

    function isBinary(data){
      return data === undefined
        || data === null
        || Buffer.isBuffer(data);
    }
    });
    var encodings_1 = encodings.utf8;
    var encodings_2 = encodings.json;
    var encodings_3 = encodings.binary;
    var encodings_4 = encodings.none;
    var encodings_5 = encodings.id;

    var levelCodec = Codec;

    function Codec(opts){
      this.opts = opts || {};
      this.encodings = encodings;
    }

    Codec.prototype._encoding = function(encoding){
      if (typeof encoding == 'string') encoding = encodings[encoding];
      if (!encoding) encoding = encodings.id;
      return encoding;
    };

    Codec.prototype._keyEncoding = function(opts, batchOpts){
      return this._encoding(batchOpts && batchOpts.keyEncoding
        || opts && opts.keyEncoding
        || this.opts.keyEncoding);
    };

    Codec.prototype._valueEncoding = function(opts, batchOpts){
      return this._encoding(
        batchOpts && (batchOpts.valueEncoding || batchOpts.encoding)
        || opts && (opts.valueEncoding || opts.encoding)
        || (this.opts.valueEncoding || this.opts.encoding));
    };

    Codec.prototype.encodeKey = function(key, opts, batchOpts){
      return this._keyEncoding(opts, batchOpts).encode(key);
    };

    Codec.prototype.encodeValue = function(value, opts, batchOpts){
      return this._valueEncoding(opts, batchOpts).encode(value);
    };

    Codec.prototype.decodeKey = function(key, opts){
      return this._keyEncoding(opts).decode(key);
    };

    Codec.prototype.decodeValue = function(value, opts){
      return this._valueEncoding(opts).decode(value);
    };

    Codec.prototype.encodeBatch = function(ops, opts){
      var self = this;

      return ops.map(function(_op){
        var op = {
          type: _op.type,
          key: self.encodeKey(_op.key, opts, _op)
        };
        if (self.keyAsBuffer(opts, _op)) op.keyEncoding = 'binary';
        if (_op.prefix) op.prefix = _op.prefix;
        if ('value' in _op) {
          op.value = self.encodeValue(_op.value, opts, _op);
          if (self.valueAsBuffer(opts, _op)) op.valueEncoding = 'binary';
        }
        return op;
      });
    };

    var ltgtKeys = ['lt', 'gt', 'lte', 'gte', 'start', 'end'];

    Codec.prototype.encodeLtgt = function(ltgt){
      var self = this;
      var ret = {};
      Object.keys(ltgt).forEach(function(key){
        ret[key] = ltgtKeys.indexOf(key) > -1
          ? self.encodeKey(ltgt[key], ltgt)
          : ltgt[key];
      });
      return ret;
    };

    Codec.prototype.createStreamDecoder = function(opts){
      var self = this;

      if (opts.keys && opts.values) {
        return function(key, value){
          return {
            key: self.decodeKey(key, opts),
            value: self.decodeValue(value, opts)
          };
        };
      } else if (opts.keys) {
        return function(key) {
          return self.decodeKey(key, opts);
        }; 
      } else if (opts.values) {
        return function(_, value){
          return self.decodeValue(value, opts);
        }
      } else {
        return function(){};
      }
    };

    Codec.prototype.keyAsBuffer = function(opts){
      return this._keyEncoding(opts).buffer;
    };

    Codec.prototype.valueAsBuffer = function(opts){
      return this._valueEncoding(opts).buffer;
    };

    var prr = createCommonjsModule(function (module) {
    /*!
      * prr
      * (c) 2013 Rod Vagg <rod@vagg.org>
      * https://github.com/rvagg/prr
      * License: MIT
      */

    (function (name, context, definition) {
      if (module.exports)
        module.exports = definition();
      else
        context[name] = definition();
    })('prr', commonjsGlobal, function() {

      var setProperty = typeof Object.defineProperty == 'function'
          ? function (obj, key, options) {
              Object.defineProperty(obj, key, options);
              return obj
            }
          : function (obj, key, options) { // < es5
              obj[key] = options.value;
              return obj
            }

        , makeOptions = function (value, options) {
            var oo = typeof options == 'object'
              , os = !oo && typeof options == 'string'
              , op = function (p) {
                  return oo
                    ? !!options[p]
                    : os
                      ? options.indexOf(p[0]) > -1
                      : false
                };

            return {
                enumerable   : op('enumerable')
              , configurable : op('configurable')
              , writable     : op('writable')
              , value        : value
            }
          }

        , prr = function (obj, key, value, options) {
            var k;

            options = makeOptions(value, options);

            if (typeof key == 'object') {
              for (k in key) {
                if (Object.hasOwnProperty.call(key, k)) {
                  options.value = key[k];
                  setProperty(obj, k, options);
                }
              }
              return obj
            }

            return setProperty(obj, key, options)
          };

      return prr
    });
    });

    function init (type, message, cause) {
      if (!!message && typeof message != 'string') {
        message = message.message || message.name;
      }
      prr(this, {
          type    : type
        , name    : type
          // can be passed just a 'cause'
        , cause   : typeof message != 'string' ? message : cause
        , message : message
      }, 'ewr');
    }

    // generic prototype, not intended to be actually used - helpful for `instanceof`
    function CustomError (message, cause) {
      Error.call(this);
      if (Error.captureStackTrace)
        Error.captureStackTrace(this, this.constructor);
      init.call(this, 'CustomError', message, cause);
    }

    CustomError.prototype = new Error();

    function createError (errno, type, proto) {
      var err = function (message, cause) {
        init.call(this, type, message, cause);
        //TODO: the specificity here is stupid, errno should be available everywhere
        if (type == 'FilesystemError') {
          this.code    = this.cause.code;
          this.path    = this.cause.path;
          this.errno   = this.cause.errno;
          this.message =
            (errno.errno[this.cause.errno]
              ? errno.errno[this.cause.errno].description
              : this.cause.message)
            + (this.cause.path ? ' [' + this.cause.path + ']' : '');
        }
        Error.call(this);
        if (Error.captureStackTrace)
          Error.captureStackTrace(this, err);
      };
      err.prototype = !!proto ? new proto() : new CustomError();
      return err
    }

    var custom = function (errno) {
      var ce = function (type, proto) {
        return createError(errno, type, proto)
      };
      return {
          CustomError     : CustomError
        , FilesystemError : ce('FilesystemError')
        , createError     : ce
      }
    };

    var errno = createCommonjsModule(function (module) {
    var all = module.exports.all = [
      {
        errno: -2,
        code: 'ENOENT',
        description: 'no such file or directory'
      },
      {
        errno: -1,
        code: 'UNKNOWN',
        description: 'unknown error'
      },
      {
        errno: 0,
        code: 'OK',
        description: 'success'
      },
      {
        errno: 1,
        code: 'EOF',
        description: 'end of file'
      },
      {
        errno: 2,
        code: 'EADDRINFO',
        description: 'getaddrinfo error'
      },
      {
        errno: 3,
        code: 'EACCES',
        description: 'permission denied'
      },
      {
        errno: 4,
        code: 'EAGAIN',
        description: 'resource temporarily unavailable'
      },
      {
        errno: 5,
        code: 'EADDRINUSE',
        description: 'address already in use'
      },
      {
        errno: 6,
        code: 'EADDRNOTAVAIL',
        description: 'address not available'
      },
      {
        errno: 7,
        code: 'EAFNOSUPPORT',
        description: 'address family not supported'
      },
      {
        errno: 8,
        code: 'EALREADY',
        description: 'connection already in progress'
      },
      {
        errno: 9,
        code: 'EBADF',
        description: 'bad file descriptor'
      },
      {
        errno: 10,
        code: 'EBUSY',
        description: 'resource busy or locked'
      },
      {
        errno: 11,
        code: 'ECONNABORTED',
        description: 'software caused connection abort'
      },
      {
        errno: 12,
        code: 'ECONNREFUSED',
        description: 'connection refused'
      },
      {
        errno: 13,
        code: 'ECONNRESET',
        description: 'connection reset by peer'
      },
      {
        errno: 14,
        code: 'EDESTADDRREQ',
        description: 'destination address required'
      },
      {
        errno: 15,
        code: 'EFAULT',
        description: 'bad address in system call argument'
      },
      {
        errno: 16,
        code: 'EHOSTUNREACH',
        description: 'host is unreachable'
      },
      {
        errno: 17,
        code: 'EINTR',
        description: 'interrupted system call'
      },
      {
        errno: 18,
        code: 'EINVAL',
        description: 'invalid argument'
      },
      {
        errno: 19,
        code: 'EISCONN',
        description: 'socket is already connected'
      },
      {
        errno: 20,
        code: 'EMFILE',
        description: 'too many open files'
      },
      {
        errno: 21,
        code: 'EMSGSIZE',
        description: 'message too long'
      },
      {
        errno: 22,
        code: 'ENETDOWN',
        description: 'network is down'
      },
      {
        errno: 23,
        code: 'ENETUNREACH',
        description: 'network is unreachable'
      },
      {
        errno: 24,
        code: 'ENFILE',
        description: 'file table overflow'
      },
      {
        errno: 25,
        code: 'ENOBUFS',
        description: 'no buffer space available'
      },
      {
        errno: 26,
        code: 'ENOMEM',
        description: 'not enough memory'
      },
      {
        errno: 27,
        code: 'ENOTDIR',
        description: 'not a directory'
      },
      {
        errno: 28,
        code: 'EISDIR',
        description: 'illegal operation on a directory'
      },
      {
        errno: 29,
        code: 'ENONET',
        description: 'machine is not on the network'
      },
      {
        errno: 31,
        code: 'ENOTCONN',
        description: 'socket is not connected'
      },
      {
        errno: 32,
        code: 'ENOTSOCK',
        description: 'socket operation on non-socket'
      },
      {
        errno: 33,
        code: 'ENOTSUP',
        description: 'operation not supported on socket'
      },
      {
        errno: 34,
        code: 'ENOENT',
        description: 'no such file or directory'
      },
      {
        errno: 35,
        code: 'ENOSYS',
        description: 'function not implemented'
      },
      {
        errno: 36,
        code: 'EPIPE',
        description: 'broken pipe'
      },
      {
        errno: 37,
        code: 'EPROTO',
        description: 'protocol error'
      },
      {
        errno: 38,
        code: 'EPROTONOSUPPORT',
        description: 'protocol not supported'
      },
      {
        errno: 39,
        code: 'EPROTOTYPE',
        description: 'protocol wrong type for socket'
      },
      {
        errno: 40,
        code: 'ETIMEDOUT',
        description: 'connection timed out'
      },
      {
        errno: 41,
        code: 'ECHARSET',
        description: 'invalid Unicode character'
      },
      {
        errno: 42,
        code: 'EAIFAMNOSUPPORT',
        description: 'address family for hostname not supported'
      },
      {
        errno: 44,
        code: 'EAISERVICE',
        description: 'servname not supported for ai_socktype'
      },
      {
        errno: 45,
        code: 'EAISOCKTYPE',
        description: 'ai_socktype not supported'
      },
      {
        errno: 46,
        code: 'ESHUTDOWN',
        description: 'cannot send after transport endpoint shutdown'
      },
      {
        errno: 47,
        code: 'EEXIST',
        description: 'file already exists'
      },
      {
        errno: 48,
        code: 'ESRCH',
        description: 'no such process'
      },
      {
        errno: 49,
        code: 'ENAMETOOLONG',
        description: 'name too long'
      },
      {
        errno: 50,
        code: 'EPERM',
        description: 'operation not permitted'
      },
      {
        errno: 51,
        code: 'ELOOP',
        description: 'too many symbolic links encountered'
      },
      {
        errno: 52,
        code: 'EXDEV',
        description: 'cross-device link not permitted'
      },
      {
        errno: 53,
        code: 'ENOTEMPTY',
        description: 'directory not empty'
      },
      {
        errno: 54,
        code: 'ENOSPC',
        description: 'no space left on device'
      },
      {
        errno: 55,
        code: 'EIO',
        description: 'i/o error'
      },
      {
        errno: 56,
        code: 'EROFS',
        description: 'read-only file system'
      },
      {
        errno: 57,
        code: 'ENODEV',
        description: 'no such device'
      },
      {
        errno: 58,
        code: 'ESPIPE',
        description: 'invalid seek'
      },
      {
        errno: 59,
        code: 'ECANCELED',
        description: 'operation canceled'
      }
    ];

    module.exports.errno = {};
    module.exports.code = {};

    all.forEach(function (error) {
      module.exports.errno[error.errno] = error;
      module.exports.code[error.code] = error;
    });

    module.exports.custom = custom(module.exports);
    module.exports.create = module.exports.custom.createError;
    });
    var errno_1 = errno.all;
    var errno_2 = errno.errno;
    var errno_3 = errno.code;
    var errno_4 = errno.custom;
    var errno_5 = errno.create;

    /* Copyright (c) 2012-2017 LevelUP contributors
     * See list at <https://github.com/rvagg/node-levelup#contributing>
     * MIT License
     * <https://github.com/rvagg/node-levelup/blob/master/LICENSE.md>
     */

    var createError$1 = errno.create;
    var LevelUPError = createError$1('LevelUPError');
    var NotFoundError = createError$1('NotFoundError', LevelUPError);

    NotFoundError.prototype.notFound = true;
    NotFoundError.prototype.status = 404;

    var errors = {
      LevelUPError: LevelUPError,
      InitializationError: createError$1('InitializationError', LevelUPError),
      OpenError: createError$1('OpenError', LevelUPError),
      ReadError: createError$1('ReadError', LevelUPError),
      WriteError: createError$1('WriteError', LevelUPError),
      NotFoundError: NotFoundError,
      EncodingError: createError$1('EncodingError', LevelUPError)
    };

    var AbstractLevelDOWN$2 = abstractLeveldown$1.AbstractLevelDOWN;
    var AbstractChainedBatch$2 = abstractLeveldown$1.AbstractChainedBatch;
    var AbstractIterator$2 = abstractLeveldown$1.AbstractIterator;
    var inherits$2 = require$$0.inherits;

    var EncodingError = errors.EncodingError;

    var encodingDown = DB.default = DB;

    function DB (db, opts) {
      if (!(this instanceof DB)) return new DB(db, opts)
      AbstractLevelDOWN$2.call(this, '');

      opts = opts || {};
      if (typeof opts.keyEncoding === 'undefined') opts.keyEncoding = 'utf8';
      if (typeof opts.valueEncoding === 'undefined') opts.valueEncoding = 'utf8';

      this.db = db;
      this.codec = new levelCodec(opts);
    }

    inherits$2(DB, AbstractLevelDOWN$2);

    DB.prototype._serializeKey =
    DB.prototype._serializeValue = function (datum) {
      return datum
    };

    DB.prototype._open = function (opts, cb) {
      this.db.open(opts, cb);
    };

    DB.prototype._close = function (cb) {
      this.db.close(cb);
    };

    DB.prototype._put = function (key, value, opts, cb) {
      key = this.codec.encodeKey(key, opts);
      value = this.codec.encodeValue(value, opts);
      this.db.put(key, value, opts, cb);
    };

    DB.prototype._get = function (key, opts, cb) {
      var self = this;
      key = this.codec.encodeKey(key, opts);
      opts.asBuffer = this.codec.valueAsBuffer(opts);
      this.db.get(key, opts, function (err, value) {
        if (err) return cb(err)
        try {
          value = self.codec.decodeValue(value, opts);
        } catch (err) {
          return cb(new EncodingError(err))
        }
        cb(null, value);
      });
    };

    DB.prototype._del = function (key, opts, cb) {
      key = this.codec.encodeKey(key, opts);
      this.db.del(key, opts, cb);
    };

    DB.prototype._chainedBatch = function () {
      return new Batch(this)
    };

    DB.prototype._batch = function (ops, opts, cb) {
      ops = this.codec.encodeBatch(ops, opts);
      this.db.batch(ops, opts, cb);
    };

    DB.prototype._iterator = function (opts) {
      opts.keyAsBuffer = this.codec.keyAsBuffer(opts);
      opts.valueAsBuffer = this.codec.valueAsBuffer(opts);
      return new Iterator(this, opts)
    };

    DB.prototype.approximateSize = function (start, end, opts, cb) {
      return this.db.approximateSize(start, end, opts, cb)
    };

    function Iterator (db, opts) {
      AbstractIterator$2.call(this, db);
      this.codec = db.codec;
      this.keys = opts.keys;
      this.values = opts.values;
      this.opts = this.codec.encodeLtgt(opts);
      this.it = db.db.iterator(this.opts);
    }

    inherits$2(Iterator, AbstractIterator$2);

    Iterator.prototype._next = function (cb) {
      var self = this;
      this.it.next(function (err, key, value) {
        if (err) return cb(err)
        try {
          if (self.keys && typeof key !== 'undefined') {
            key = self.codec.decodeKey(key, self.opts);
          } else {
            key = undefined;
          }

          if (self.values && typeof value !== 'undefined') {
            value = self.codec.decodeValue(value, self.opts);
          } else {
            value = undefined;
          }
        } catch (err) {
          return cb(new EncodingError(err))
        }
        cb(null, key, value);
      });
    };

    Iterator.prototype._end = function (cb) {
      this.it.end(cb);
    };

    function Batch (db, codec) {
      AbstractChainedBatch$2.call(this, db);
      this.codec = db.codec;
      this.batch = db.db.batch();
    }

    inherits$2(Batch, AbstractChainedBatch$2);

    Batch.prototype._put = function (key, value) {
      key = this.codec.encodeKey(key);
      value = this.codec.encodeValue(value);
      this.batch.put(key, value);
    };

    Batch.prototype._del = function (key) {
      key = this.codec.encodeKey(key);
      this.batch.del(key);
    };

    Batch.prototype._clear = function () {
      this.batch.clear();
    };

    Batch.prototype._write = function (opts, cb) {
      this.batch.write(opts, cb);
    };

    function init$1(db) {
      const GET = key => new Promise((resolve, reject) => {
        // to allow for nested promises
        // if this is a promise then resolve that
        if (key instanceof Promise) return resolve(key)
        if ((typeof key) === 'string') key = { gte: key, lte: key + '￮' };
        return RANGE(key).then(resolve)
      });

      // OR
      const UNION = (...keys) => Promise.all(
        keys.map(key => GET(key))
      ).then(sets => {
        // flatten
        sets = [].concat.apply([], sets);
        var setObject = sets.reduce((acc, cur) => {
          acc[cur._id] = acc[cur._id] || [];
          acc[cur._id].push(cur.match);
          return acc
        }, {});
        return Object.keys(setObject).map(id => {
          return {
            _id: id,
            match: setObject[id]
          }
        })
      });

      // AND
      const INTERSECTION = (...keys) => {
        return UNION(...keys).then(result => {
          // returns an intersection
          return result.filter(item => (item.match.length === keys.length))
        })
      };

      // NOT
      const SET_DIFFERENCE = (a, b) => {
        if (typeof a === 'string') a = GET(a);
        if (typeof b === 'string') b = GET(b);
        return Promise.all([a, b]).then(result => {
          var [ a, b ] = result;
          b = b.map(item => item._id);
          return a.filter(item => b.indexOf(item._id))
        })
      };

      const RANGE = ops => new Promise((resolve, reject) => {
        const s = {};
        db.createReadStream(ops)
          .on('data', data => data.value.forEach(objectId => {
            s[objectId] = s[objectId] || [];
            s[objectId].push(data.key);
          }))
          .on('end', () => resolve(
            Object.keys(s).map(id => {
              return {
                _id: id,
                match: s[id]
              }
            })
          ));
      });

      // TODO: put in some validation here
      // arg 1: an aggregration
      // arg 2: a filter set- return only results of arg 1 that intersect with arg 2
      const AGGREGATE = (...args) => Promise.all(args).then(result => {
        var aggregation = new Set(result[1].map(item => item._id));
        return result[0].map(
          item => {
            return {
              match: item.match,
              _id: [...new Set([...item._id].filter(x => aggregation.has(x)))]
            }
          }
        ).filter(item => item._id.length)
      });

      const BUCKET = key => GET(key).then(result => {
        return {
          match: key,
          _id: [...result.reduce((acc, cur) => acc.add(cur._id), new Set())].sort()
        }
      });

      return {
        AGGREGATE: AGGREGATE,
        BUCKET: BUCKET,
        GET: GET,
        INTERSECTION: INTERSECTION,
        SET_DIFFERENCE: SET_DIFFERENCE,
        UNION: UNION
      }
    }

    /* Copyright (c) 2017 Rod Vagg, MIT License */

    function AbstractIterator$3 (db) {
      this.db = db;
      this._ended = false;
      this._nexting = false;
    }

    AbstractIterator$3.prototype.next = function (callback) {
      var self = this;

      if (typeof callback !== 'function') {
        throw new Error('next() requires a callback argument')
      }

      if (self._ended) {
        process.nextTick(callback, new Error('cannot call next() after end()'));
        return self
      }

      if (self._nexting) {
        process.nextTick(callback, new Error('cannot call next() before previous next() has completed'));
        return self
      }

      self._nexting = true;
      self._next(function () {
        self._nexting = false;
        callback.apply(null, arguments);
      });

      return self
    };

    AbstractIterator$3.prototype._next = function (callback) {
      process.nextTick(callback);
    };

    AbstractIterator$3.prototype.end = function (callback) {
      if (typeof callback !== 'function') {
        throw new Error('end() requires a callback argument')
      }

      if (this._ended) {
        return process.nextTick(callback, new Error('end() already called on iterator'))
      }

      this._ended = true;
      this._end(callback);
    };

    AbstractIterator$3.prototype._end = function (callback) {
      process.nextTick(callback);
    };

    var abstractIterator$1 = AbstractIterator$3;

    /* Copyright (c) 2017 Rod Vagg, MIT License */

    function AbstractChainedBatch$3 (db) {
      this._db = db;
      this._operations = [];
      this._written = false;
    }

    AbstractChainedBatch$3.prototype._serializeKey = function (key) {
      return this._db._serializeKey(key)
    };

    AbstractChainedBatch$3.prototype._serializeValue = function (value) {
      return this._db._serializeValue(value)
    };

    AbstractChainedBatch$3.prototype._checkWritten = function () {
      if (this._written) {
        throw new Error('write() already called on this batch')
      }
    };

    AbstractChainedBatch$3.prototype.put = function (key, value) {
      this._checkWritten();

      var err = this._db._checkKey(key, 'key');
      if (err) { throw err }

      key = this._serializeKey(key);
      value = this._serializeValue(value);

      this._put(key, value);

      return this
    };

    AbstractChainedBatch$3.prototype._put = function (key, value) {
      this._operations.push({ type: 'put', key: key, value: value });
    };

    AbstractChainedBatch$3.prototype.del = function (key) {
      this._checkWritten();

      var err = this._db._checkKey(key, 'key');
      if (err) { throw err }

      key = this._serializeKey(key);
      this._del(key);

      return this
    };

    AbstractChainedBatch$3.prototype._del = function (key) {
      this._operations.push({ type: 'del', key: key });
    };

    AbstractChainedBatch$3.prototype.clear = function () {
      this._checkWritten();
      this._operations = [];
      this._clear();

      return this
    };

    AbstractChainedBatch$3.prototype._clear = function noop () {};

    AbstractChainedBatch$3.prototype.write = function (options, callback) {
      this._checkWritten();

      if (typeof options === 'function') { callback = options; }
      if (typeof callback !== 'function') {
        throw new Error('write() requires a callback argument')
      }
      if (typeof options !== 'object') { options = {}; }

      this._written = true;

      // @ts-ignore
      if (typeof this._write === 'function') { return this._write(callback) }

      if (typeof this._db._batch === 'function') {
        return this._db._batch(this._operations, options, callback)
      }

      process.nextTick(callback);
    };

    var abstractChainedBatch$1 = AbstractChainedBatch$3;

    /* Copyright (c) 2017 Rod Vagg, MIT License */




    var hasOwnProperty$3 = Object.prototype.hasOwnProperty;
    var rangeOptions$1 = 'start end gt gte lt lte'.split(' ');

    function AbstractLevelDOWN$3 (location) {
      if (!arguments.length || location === undefined) {
        throw new Error('constructor requires at least a location argument')
      }

      if (typeof location !== 'string') {
        throw new Error('constructor requires a location string argument')
      }

      this.location = location;
      this.status = 'new';
    }

    AbstractLevelDOWN$3.prototype.open = function (options, callback) {
      var self = this;
      var oldStatus = this.status;

      if (typeof options === 'function') { callback = options; }

      if (typeof callback !== 'function') {
        throw new Error('open() requires a callback argument')
      }

      if (typeof options !== 'object') { options = {}; }

      options.createIfMissing = options.createIfMissing !== false;
      options.errorIfExists = !!options.errorIfExists;

      this.status = 'opening';
      this._open(options, function (err) {
        if (err) {
          self.status = oldStatus;
          return callback(err)
        }
        self.status = 'open';
        callback();
      });
    };

    AbstractLevelDOWN$3.prototype._open = function (options, callback) {
      process.nextTick(callback);
    };

    AbstractLevelDOWN$3.prototype.close = function (callback) {
      var self = this;
      var oldStatus = this.status;

      if (typeof callback !== 'function') {
        throw new Error('close() requires a callback argument')
      }

      this.status = 'closing';
      this._close(function (err) {
        if (err) {
          self.status = oldStatus;
          return callback(err)
        }
        self.status = 'closed';
        callback();
      });
    };

    AbstractLevelDOWN$3.prototype._close = function (callback) {
      process.nextTick(callback);
    };

    AbstractLevelDOWN$3.prototype.get = function (key, options, callback) {
      if (typeof options === 'function') { callback = options; }

      if (typeof callback !== 'function') {
        throw new Error('get() requires a callback argument')
      }

      var err = this._checkKey(key, 'key');
      if (err) return process.nextTick(callback, err)

      key = this._serializeKey(key);

      if (typeof options !== 'object') { options = {}; }

      options.asBuffer = options.asBuffer !== false;

      this._get(key, options, callback);
    };

    AbstractLevelDOWN$3.prototype._get = function (key, options, callback) {
      process.nextTick(function () { callback(new Error('NotFound')); });
    };

    AbstractLevelDOWN$3.prototype.put = function (key, value, options, callback) {
      if (typeof options === 'function') { callback = options; }

      if (typeof callback !== 'function') {
        throw new Error('put() requires a callback argument')
      }

      var err = this._checkKey(key, 'key');
      if (err) return process.nextTick(callback, err)

      key = this._serializeKey(key);
      value = this._serializeValue(value);

      if (typeof options !== 'object') { options = {}; }

      this._put(key, value, options, callback);
    };

    AbstractLevelDOWN$3.prototype._put = function (key, value, options, callback) {
      process.nextTick(callback);
    };

    AbstractLevelDOWN$3.prototype.del = function (key, options, callback) {
      if (typeof options === 'function') { callback = options; }

      if (typeof callback !== 'function') {
        throw new Error('del() requires a callback argument')
      }

      var err = this._checkKey(key, 'key');
      if (err) return process.nextTick(callback, err)

      key = this._serializeKey(key);

      if (typeof options !== 'object') { options = {}; }

      this._del(key, options, callback);
    };

    AbstractLevelDOWN$3.prototype._del = function (key, options, callback) {
      process.nextTick(callback);
    };

    AbstractLevelDOWN$3.prototype.batch = function (array, options, callback) {
      if (!arguments.length) { return this._chainedBatch() }

      if (typeof options === 'function') { callback = options; }

      if (typeof array === 'function') { callback = array; }

      if (typeof callback !== 'function') {
        throw new Error('batch(array) requires a callback argument')
      }

      if (!Array.isArray(array)) {
        return process.nextTick(callback, new Error('batch(array) requires an array argument'))
      }

      if (!options || typeof options !== 'object') { options = {}; }

      var serialized = new Array(array.length);

      for (var i = 0; i < array.length; i++) {
        if (typeof array[i] !== 'object' || array[i] === null) {
          return process.nextTick(callback, new Error('batch(array) element must be an object and not `null`'))
        }

        var e = immutable(array[i]);

        if (e.type !== 'put' && e.type !== 'del') {
          return process.nextTick(callback, new Error("`type` must be 'put' or 'del'"))
        }

        var err = this._checkKey(e.key, 'key');
        if (err) return process.nextTick(callback, err)

        e.key = this._serializeKey(e.key);

        if (e.type === 'put') { e.value = this._serializeValue(e.value); }

        serialized[i] = e;
      }

      this._batch(serialized, options, callback);
    };

    AbstractLevelDOWN$3.prototype._batch = function (array, options, callback) {
      process.nextTick(callback);
    };

    AbstractLevelDOWN$3.prototype._setupIteratorOptions = function (options) {
      options = cleanRangeOptions$1(options);

      options.reverse = !!options.reverse;
      options.keys = options.keys !== false;
      options.values = options.values !== false;
      options.limit = 'limit' in options ? options.limit : -1;
      options.keyAsBuffer = options.keyAsBuffer !== false;
      options.valueAsBuffer = options.valueAsBuffer !== false;

      return options
    };

    function cleanRangeOptions$1 (options) {
      var result = {};

      for (var k in options) {
        if (!hasOwnProperty$3.call(options, k)) continue
        if (isRangeOption$1(k) && isEmptyRangeOption$1(options[k])) continue

        result[k] = options[k];
      }

      return result
    }

    function isRangeOption$1 (k) {
      return rangeOptions$1.indexOf(k) !== -1
    }

    function isEmptyRangeOption$1 (v) {
      return v === '' || v == null || isEmptyBuffer$1(v)
    }

    function isEmptyBuffer$1 (v) {
      return Buffer.isBuffer(v) && v.length === 0
    }

    AbstractLevelDOWN$3.prototype.iterator = function (options) {
      if (typeof options !== 'object') { options = {}; }
      options = this._setupIteratorOptions(options);
      return this._iterator(options)
    };

    AbstractLevelDOWN$3.prototype._iterator = function (options) {
      return new abstractIterator$1(this)
    };

    AbstractLevelDOWN$3.prototype._chainedBatch = function () {
      return new abstractChainedBatch$1(this)
    };

    AbstractLevelDOWN$3.prototype._serializeKey = function (key) {
      return Buffer.isBuffer(key) ? key : String(key)
    };

    AbstractLevelDOWN$3.prototype._serializeValue = function (value) {
      if (value == null) return ''
      return Buffer.isBuffer(value) || process.browser ? value : String(value)
    };

    AbstractLevelDOWN$3.prototype._checkKey = function (obj, type) {
      if (obj === null || obj === undefined) {
        return new Error(type + ' cannot be `null` or `undefined`')
      }

      if (Buffer.isBuffer(obj) && obj.length === 0) {
        return new Error(type + ' cannot be an empty Buffer')
      }

      if (String(obj) === '') {
        return new Error(type + ' cannot be an empty String')
      }
    };

    var abstractLeveldown$2 = AbstractLevelDOWN$3;

    var AbstractLevelDOWN$4 = abstractLeveldown$2;
    var AbstractIterator$4 = abstractIterator$1;
    var AbstractChainedBatch$4 = abstractChainedBatch$1;

    var abstractLeveldown$3 = {
    	AbstractLevelDOWN: AbstractLevelDOWN$4,
    	AbstractIterator: AbstractIterator$4,
    	AbstractChainedBatch: AbstractChainedBatch$4
    };

    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    // resolves . and .. elements in a path array with directory names there
    // must be no slashes, empty elements, or device names (c:\) in the array
    // (so also no leading and trailing slashes - it does not distinguish
    // relative and absolute paths)
    function normalizeArray(parts, allowAboveRoot) {
      // if the path tries to go above the root, `up` ends up > 0
      var up = 0;
      for (var i = parts.length - 1; i >= 0; i--) {
        var last = parts[i];
        if (last === '.') {
          parts.splice(i, 1);
        } else if (last === '..') {
          parts.splice(i, 1);
          up++;
        } else if (up) {
          parts.splice(i, 1);
          up--;
        }
      }

      // if the path is allowed to go above the root, restore leading ..s
      if (allowAboveRoot) {
        for (; up--; up) {
          parts.unshift('..');
        }
      }

      return parts;
    }

    // Split a filename into [root, dir, basename, ext], unix version
    // 'root' is just a slash, or nothing.
    var splitPathRe =
        /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
    var splitPath = function(filename) {
      return splitPathRe.exec(filename).slice(1);
    };

    // path.resolve([from ...], to)
    // posix version
    function resolve() {
      var resolvedPath = '',
          resolvedAbsolute = false;

      for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
        var path = (i >= 0) ? arguments[i] : '/';

        // Skip empty and invalid entries
        if (typeof path !== 'string') {
          throw new TypeError('Arguments to path.resolve must be strings');
        } else if (!path) {
          continue;
        }

        resolvedPath = path + '/' + resolvedPath;
        resolvedAbsolute = path.charAt(0) === '/';
      }

      // At this point the path should be resolved to a full absolute path, but
      // handle relative paths to be safe (might happen when process.cwd() fails)

      // Normalize the path
      resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
        return !!p;
      }), !resolvedAbsolute).join('/');

      return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
    }
    // path.normalize(path)
    // posix version
    function normalize(path) {
      var isPathAbsolute = isAbsolute(path),
          trailingSlash = substr(path, -1) === '/';

      // Normalize the path
      path = normalizeArray(filter(path.split('/'), function(p) {
        return !!p;
      }), !isPathAbsolute).join('/');

      if (!path && !isPathAbsolute) {
        path = '.';
      }
      if (path && trailingSlash) {
        path += '/';
      }

      return (isPathAbsolute ? '/' : '') + path;
    }
    // posix version
    function isAbsolute(path) {
      return path.charAt(0) === '/';
    }

    // posix version
    function join() {
      var paths = Array.prototype.slice.call(arguments, 0);
      return normalize(filter(paths, function(p, index) {
        if (typeof p !== 'string') {
          throw new TypeError('Arguments to path.join must be strings');
        }
        return p;
      }).join('/'));
    }


    // path.relative(from, to)
    // posix version
    function relative(from, to) {
      from = resolve(from).substr(1);
      to = resolve(to).substr(1);

      function trim(arr) {
        var start = 0;
        for (; start < arr.length; start++) {
          if (arr[start] !== '') break;
        }

        var end = arr.length - 1;
        for (; end >= 0; end--) {
          if (arr[end] !== '') break;
        }

        if (start > end) return [];
        return arr.slice(start, end - start + 1);
      }

      var fromParts = trim(from.split('/'));
      var toParts = trim(to.split('/'));

      var length = Math.min(fromParts.length, toParts.length);
      var samePartsLength = length;
      for (var i = 0; i < length; i++) {
        if (fromParts[i] !== toParts[i]) {
          samePartsLength = i;
          break;
        }
      }

      var outputParts = [];
      for (var i = samePartsLength; i < fromParts.length; i++) {
        outputParts.push('..');
      }

      outputParts = outputParts.concat(toParts.slice(samePartsLength));

      return outputParts.join('/');
    }

    var sep = '/';
    var delimiter = ':';

    function dirname(path) {
      var result = splitPath(path),
          root = result[0],
          dir = result[1];

      if (!root && !dir) {
        // No dirname whatsoever
        return '.';
      }

      if (dir) {
        // It has a dirname, strip trailing slash
        dir = dir.substr(0, dir.length - 1);
      }

      return root + dir;
    }

    function basename(path, ext) {
      var f = splitPath(path)[2];
      // TODO: make this comparison case-insensitive on windows?
      if (ext && f.substr(-1 * ext.length) === ext) {
        f = f.substr(0, f.length - ext.length);
      }
      return f;
    }


    function extname(path) {
      return splitPath(path)[3];
    }
    var path = {
      extname: extname,
      basename: basename,
      dirname: dirname,
      sep: sep,
      delimiter: delimiter,
      relative: relative,
      join: join,
      isAbsolute: isAbsolute,
      normalize: normalize,
      resolve: resolve
    };
    function filter (xs, f) {
        if (xs.filter) return xs.filter(f);
        var res = [];
        for (var i = 0; i < xs.length; i++) {
            if (f(xs[i], i, xs)) res.push(xs[i]);
        }
        return res;
    }

    // String.prototype.substr - negative index don't work in IE8
    var substr = 'ab'.substr(-1) === 'b' ?
        function (str, start, len) { return str.substr(start, len) } :
        function (str, start, len) {
            if (start < 0) start = str.length + start;
            return str.substr(start, len);
        }
    ;

    var bindings_1 = createCommonjsModule(function (module, exports) {
    /**
     * Module dependencies.
     */

    var join = path.join
      , dirname = path.dirname
      , exists = (path.existsSync)
      , defaults = {
            arrow: process.env.NODE_BINDINGS_ARROW || ' → '
          , compiled: process.env.NODE_BINDINGS_COMPILED_DIR || 'compiled'
          , platform: process.platform
          , arch: process.arch
          , version: process.versions.node
          , bindings: 'bindings.node'
          , try: [
              // node-gyp's linked version in the "build" dir
              [ 'module_root', 'build', 'bindings' ]
              // node-waf and gyp_addon (a.k.a node-gyp)
            , [ 'module_root', 'build', 'Debug', 'bindings' ]
            , [ 'module_root', 'build', 'Release', 'bindings' ]
              // Debug files, for development (legacy behavior, remove for node v0.9)
            , [ 'module_root', 'out', 'Debug', 'bindings' ]
            , [ 'module_root', 'Debug', 'bindings' ]
              // Release files, but manually compiled (legacy behavior, remove for node v0.9)
            , [ 'module_root', 'out', 'Release', 'bindings' ]
            , [ 'module_root', 'Release', 'bindings' ]
              // Legacy from node-waf, node <= 0.4.x
            , [ 'module_root', 'build', 'default', 'bindings' ]
              // Production "Release" buildtype binary (meh...)
            , [ 'module_root', 'compiled', 'version', 'platform', 'arch', 'bindings' ]
            ]
        };

    /**
     * The main `bindings()` function loads the compiled bindings for a given module.
     * It uses V8's Error API to determine the parent filename that this function is
     * being invoked from, which is then used to find the root directory.
     */

    function bindings (opts) {

      // Argument surgery
      if (typeof opts == 'string') {
        opts = { bindings: opts };
      } else if (!opts) {
        opts = {};
      }

      // maps `defaults` onto `opts` object
      Object.keys(defaults).map(function(i) {
        if (!(i in opts)) opts[i] = defaults[i];
      });

      // Get the module root
      if (!opts.module_root) {
        opts.module_root = exports.getRoot(exports.getFileName());
      }

      // Ensure the given bindings name ends with .node
      if (path.extname(opts.bindings) != '.node') {
        opts.bindings += '.node';
      }

      var tries = []
        , i = 0
        , l = opts.try.length
        , n
        , b
        , err;

      for (; i<l; i++) {
        n = join.apply(null, opts.try[i].map(function (p) {
          return opts[p] || p
        }));
        tries.push(n);
        try {
          b = opts.path ? commonjsRequire.resolve(n) : commonjsRequire(n);
          if (!opts.path) {
            b.path = n;
          }
          return b
        } catch (e) {
          if (!/not find/i.test(e.message)) {
            throw e
          }
        }
      }

      err = new Error('Could not locate the bindings file. Tried:\n'
        + tries.map(function (a) { return opts.arrow + a }).join('\n'));
      err.tries = tries;
      throw err
    }
    module.exports = exports = bindings;


    /**
     * Gets the filename of the JavaScript file that invokes this function.
     * Used to help find the root directory of a module.
     * Optionally accepts an filename argument to skip when searching for the invoking filename
     */

    exports.getFileName = function getFileName (calling_file) {
      var origPST = Error.prepareStackTrace
        , origSTL = Error.stackTraceLimit
        , dummy = {}
        , fileName;

      Error.stackTraceLimit = 10;

      Error.prepareStackTrace = function (e, st) {
        for (var i=0, l=st.length; i<l; i++) {
          fileName = st[i].getFileName();
          if (fileName !== __filename) {
            if (calling_file) {
                if (fileName !== calling_file) {
                  return
                }
            } else {
              return
            }
          }
        }
      };

      // run the 'prepareStackTrace' function above
      Error.captureStackTrace(dummy);

      // cleanup
      Error.prepareStackTrace = origPST;
      Error.stackTraceLimit = origSTL;

      return fileName
    };

    /**
     * Gets the root directory of a module, given an arbitrary filename
     * somewhere in the module tree. The "root directory" is the directory
     * containing the `package.json` file.
     *
     *   In:  /home/nate/node-native-module/lib/index.js
     *   Out: /home/nate/node-native-module
     */

    exports.getRoot = function getRoot (file) {
      var dir = dirname(file)
        , prev;
      while (true) {
        if (dir === '.') {
          // Avoids an infinite loop in rare cases, like the REPL
          dir = process.cwd();
        }
        if (exists(join(dir, 'package.json')) || exists(join(dir, 'node_modules'))) {
          // Found the 'package.json' file or 'node_modules' dir; we're done
          return dir
        }
        if (prev === dir) {
          // Got to the top
          throw new Error('Could not find module root given file: "' + file
                        + '". Do you have a `package.json` file? ')
        }
        // Try the parent dir next
        prev = dir;
        dir = join(dir, '..');
      }
    };
    });
    var bindings_2 = bindings_1.getFileName;
    var bindings_3 = bindings_1.getRoot;

    const AbstractChainedBatch$5 = abstractLeveldown$3.AbstractChainedBatch;

    function ChainedBatch (db) {
      AbstractChainedBatch$5.call(this, db);
      this.binding = db.binding.batch();
    }

    ChainedBatch.prototype._put = function (key, value) {
      this.binding.put(key, value);
    };

    ChainedBatch.prototype._del = function (key) {
      this.binding.del(key);
    };

    ChainedBatch.prototype._clear = function (key) {
      this.binding.clear(key);
    };

    ChainedBatch.prototype._write = function (options, callback) {
      this.binding.write(options, callback);
    };

    require$$0.inherits(ChainedBatch, AbstractChainedBatch$5);

    var chainedBatch = ChainedBatch;

    var LIMIT = process.maxTickDepth / 2 || 1000
      , factory = function () {
          var count = 0;
          return function (callback) {
            if (count >= LIMIT){
              commonjsGlobal.setImmediate(callback);
              count = 0;
            } else
              process.nextTick(callback);
            count++;
          }
        };

    var fastFuture = commonjsGlobal.setImmediate ? factory : function () { return process.nextTick };

    const AbstractIterator$5 = abstractLeveldown$3.AbstractIterator;


    function Iterator$1 (db, options) {
      AbstractIterator$5.call(this, db);

      this.binding = db.binding.iterator(options);
      this.cache = null;
      this.finished = false;
      this.fastFuture = fastFuture();
    }

    require$$0.inherits(Iterator$1, AbstractIterator$5);

    Iterator$1.prototype.seek = function (target) {
      if (this._ended) {
        throw new Error('cannot call seek() after end()')
      }
      if (this._nexting) {
        throw new Error('cannot call seek() before next() has completed')
      }
      if (typeof target !== 'string' && !Buffer.isBuffer(target)) {
        throw new Error('seek() requires a string or buffer key')
      }
      if (target.length === 0) {
        throw new Error('cannot seek() to an empty key')
      }

      this.cache = null;
      this.binding.seek(target);
      this.finished = false;
    };

    Iterator$1.prototype._next = function (callback) {
      var that = this;
      var key;
      var value;

      if (this.cache && this.cache.length) {
        key = this.cache.pop();
        value = this.cache.pop();

        this.fastFuture(function () {
          callback(null, key, value);
        });
      } else if (this.finished) {
        this.fastFuture(function () {
          callback();
        });
      } else {
        this.binding.next(function (err, array, finished) {
          if (err) return callback(err)

          that.cache = array;
          that.finished = finished;
          that._next(callback);
        });
      }

      return this
    };

    Iterator$1.prototype._end = function (callback) {
      delete this.cache;
      this.binding.end(callback);
    };

    var iterator = Iterator$1;

    const AbstractLevelDOWN$5 = abstractLeveldown$3.AbstractLevelDOWN;
    const binding$1 = bindings_1('leveldown').leveldown;



    function LevelDOWN (location) {
      if (!(this instanceof LevelDOWN)) {
        return new LevelDOWN(location)
      }

      AbstractLevelDOWN$5.call(this, location);
      this.binding = binding$1(location);
    }

    require$$0.inherits(LevelDOWN, AbstractLevelDOWN$5);

    LevelDOWN.prototype._open = function (options, callback) {
      this.binding.open(options, callback);
    };

    LevelDOWN.prototype._close = function (callback) {
      this.binding.close(callback);
    };

    LevelDOWN.prototype._put = function (key, value, options, callback) {
      this.binding.put(key, value, options, callback);
    };

    LevelDOWN.prototype._get = function (key, options, callback) {
      this.binding.get(key, options, callback);
    };

    LevelDOWN.prototype._del = function (key, options, callback) {
      this.binding.del(key, options, callback);
    };

    LevelDOWN.prototype._chainedBatch = function () {
      return new chainedBatch(this)
    };

    LevelDOWN.prototype._batch = function (operations, options, callback) {
      return this.binding.batch(operations, options, callback)
    };

    LevelDOWN.prototype.approximateSize = function (start, end, callback) {
      if (start == null ||
          end == null ||
          typeof start === 'function' ||
          typeof end === 'function') {
        throw new Error('approximateSize() requires valid `start`, `end` and `callback` arguments')
      }

      if (typeof callback !== 'function') {
        throw new Error('approximateSize() requires a callback argument')
      }

      start = this._serializeKey(start);
      end = this._serializeKey(end);

      this.binding.approximateSize(start, end, callback);
    };

    LevelDOWN.prototype.compactRange = function (start, end, callback) {
      this.binding.compactRange(start, end, callback);
    };

    LevelDOWN.prototype.getProperty = function (property) {
      if (typeof property !== 'string') {
        throw new Error('getProperty() requires a valid `property` argument')
      }

      return this.binding.getProperty(property)
    };

    LevelDOWN.prototype._iterator = function (options) {
      return new iterator(this, options)
    };

    LevelDOWN.destroy = function (location, callback) {
      if (arguments.length < 2) {
        throw new Error('destroy() requires `location` and `callback` arguments')
      }
      if (typeof location !== 'string') {
        throw new Error('destroy() requires a location string argument')
      }
      if (typeof callback !== 'function') {
        throw new Error('destroy() requires a callback function argument')
      }

      binding$1.destroy(location, callback);
    };

    LevelDOWN.repair = function (location, callback) {
      if (arguments.length < 2) {
        throw new Error('repair() requires `location` and `callback` arguments')
      }
      if (typeof location !== 'string') {
        throw new Error('repair() requires a location string argument')
      }
      if (typeof callback !== 'function') {
        throw new Error('repair() requires a callback function argument')
      }

      binding$1.repair(location, callback);
    };

    var leveldown = LevelDOWN.default = LevelDOWN;

    var domain;

    // This constructor is used to store event handlers. Instantiating this is
    // faster than explicitly calling `Object.create(null)` to get a "clean" empty
    // object (tested with v8 v4.9).
    function EventHandlers() {}
    EventHandlers.prototype = Object.create(null);

    function EventEmitter() {
      EventEmitter.init.call(this);
    }

    // nodejs oddity
    // require('events') === require('events').EventEmitter
    EventEmitter.EventEmitter = EventEmitter;

    EventEmitter.usingDomains = false;

    EventEmitter.prototype.domain = undefined;
    EventEmitter.prototype._events = undefined;
    EventEmitter.prototype._maxListeners = undefined;

    // By default EventEmitters will print a warning if more than 10 listeners are
    // added to it. This is a useful default which helps finding memory leaks.
    EventEmitter.defaultMaxListeners = 10;

    EventEmitter.init = function() {
      this.domain = null;
      if (EventEmitter.usingDomains) {
        // if there is an active domain, then attach to it.
        if (domain.active && !(this instanceof domain.Domain)) ;
      }

      if (!this._events || this._events === Object.getPrototypeOf(this)._events) {
        this._events = new EventHandlers();
        this._eventsCount = 0;
      }

      this._maxListeners = this._maxListeners || undefined;
    };

    // Obviously not all Emitters should be limited to 10. This function allows
    // that to be increased. Set to zero for unlimited.
    EventEmitter.prototype.setMaxListeners = function setMaxListeners(n) {
      if (typeof n !== 'number' || n < 0 || isNaN(n))
        throw new TypeError('"n" argument must be a positive number');
      this._maxListeners = n;
      return this;
    };

    function $getMaxListeners(that) {
      if (that._maxListeners === undefined)
        return EventEmitter.defaultMaxListeners;
      return that._maxListeners;
    }

    EventEmitter.prototype.getMaxListeners = function getMaxListeners() {
      return $getMaxListeners(this);
    };

    // These standalone emit* functions are used to optimize calling of event
    // handlers for fast cases because emit() itself often has a variable number of
    // arguments and can be deoptimized because of that. These functions always have
    // the same number of arguments and thus do not get deoptimized, so the code
    // inside them can execute faster.
    function emitNone(handler, isFn, self) {
      if (isFn)
        handler.call(self);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self);
      }
    }
    function emitOne(handler, isFn, self, arg1) {
      if (isFn)
        handler.call(self, arg1);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1);
      }
    }
    function emitTwo(handler, isFn, self, arg1, arg2) {
      if (isFn)
        handler.call(self, arg1, arg2);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1, arg2);
      }
    }
    function emitThree(handler, isFn, self, arg1, arg2, arg3) {
      if (isFn)
        handler.call(self, arg1, arg2, arg3);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].call(self, arg1, arg2, arg3);
      }
    }

    function emitMany(handler, isFn, self, args) {
      if (isFn)
        handler.apply(self, args);
      else {
        var len = handler.length;
        var listeners = arrayClone(handler, len);
        for (var i = 0; i < len; ++i)
          listeners[i].apply(self, args);
      }
    }

    EventEmitter.prototype.emit = function emit(type) {
      var er, handler, len, args, i, events, domain;
      var doError = (type === 'error');

      events = this._events;
      if (events)
        doError = (doError && events.error == null);
      else if (!doError)
        return false;

      domain = this.domain;

      // If there is no 'error' event listener then throw.
      if (doError) {
        er = arguments[1];
        if (domain) {
          if (!er)
            er = new Error('Uncaught, unspecified "error" event');
          er.domainEmitter = this;
          er.domain = domain;
          er.domainThrown = false;
          domain.emit('error', er);
        } else if (er instanceof Error) {
          throw er; // Unhandled 'error' event
        } else {
          // At least give some kind of context to the user
          var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
          err.context = er;
          throw err;
        }
        return false;
      }

      handler = events[type];

      if (!handler)
        return false;

      var isFn = typeof handler === 'function';
      len = arguments.length;
      switch (len) {
        // fast cases
        case 1:
          emitNone(handler, isFn, this);
          break;
        case 2:
          emitOne(handler, isFn, this, arguments[1]);
          break;
        case 3:
          emitTwo(handler, isFn, this, arguments[1], arguments[2]);
          break;
        case 4:
          emitThree(handler, isFn, this, arguments[1], arguments[2], arguments[3]);
          break;
        // slower
        default:
          args = new Array(len - 1);
          for (i = 1; i < len; i++)
            args[i - 1] = arguments[i];
          emitMany(handler, isFn, this, args);
      }

      return true;
    };

    function _addListener(target, type, listener, prepend) {
      var m;
      var events;
      var existing;

      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');

      events = target._events;
      if (!events) {
        events = target._events = new EventHandlers();
        target._eventsCount = 0;
      } else {
        // To avoid recursion in the case that type === "newListener"! Before
        // adding it to the listeners, first emit "newListener".
        if (events.newListener) {
          target.emit('newListener', type,
                      listener.listener ? listener.listener : listener);

          // Re-assign `events` because a newListener handler could have caused the
          // this._events to be assigned to a new object
          events = target._events;
        }
        existing = events[type];
      }

      if (!existing) {
        // Optimize the case of one listener. Don't need the extra array object.
        existing = events[type] = listener;
        ++target._eventsCount;
      } else {
        if (typeof existing === 'function') {
          // Adding the second element, need to change to array.
          existing = events[type] = prepend ? [listener, existing] :
                                              [existing, listener];
        } else {
          // If we've already got an array, just append.
          if (prepend) {
            existing.unshift(listener);
          } else {
            existing.push(listener);
          }
        }

        // Check for listener leak
        if (!existing.warned) {
          m = $getMaxListeners(target);
          if (m && m > 0 && existing.length > m) {
            existing.warned = true;
            var w = new Error('Possible EventEmitter memory leak detected. ' +
                                existing.length + ' ' + type + ' listeners added. ' +
                                'Use emitter.setMaxListeners() to increase limit');
            w.name = 'MaxListenersExceededWarning';
            w.emitter = target;
            w.type = type;
            w.count = existing.length;
            emitWarning(w);
          }
        }
      }

      return target;
    }
    function emitWarning(e) {
      typeof console.warn === 'function' ? console.warn(e) : console.log(e);
    }
    EventEmitter.prototype.addListener = function addListener(type, listener) {
      return _addListener(this, type, listener, false);
    };

    EventEmitter.prototype.on = EventEmitter.prototype.addListener;

    EventEmitter.prototype.prependListener =
        function prependListener(type, listener) {
          return _addListener(this, type, listener, true);
        };

    function _onceWrap(target, type, listener) {
      var fired = false;
      function g() {
        target.removeListener(type, g);
        if (!fired) {
          fired = true;
          listener.apply(target, arguments);
        }
      }
      g.listener = listener;
      return g;
    }

    EventEmitter.prototype.once = function once(type, listener) {
      if (typeof listener !== 'function')
        throw new TypeError('"listener" argument must be a function');
      this.on(type, _onceWrap(this, type, listener));
      return this;
    };

    EventEmitter.prototype.prependOnceListener =
        function prependOnceListener(type, listener) {
          if (typeof listener !== 'function')
            throw new TypeError('"listener" argument must be a function');
          this.prependListener(type, _onceWrap(this, type, listener));
          return this;
        };

    // emits a 'removeListener' event iff the listener was removed
    EventEmitter.prototype.removeListener =
        function removeListener(type, listener) {
          var list, events, position, i, originalListener;

          if (typeof listener !== 'function')
            throw new TypeError('"listener" argument must be a function');

          events = this._events;
          if (!events)
            return this;

          list = events[type];
          if (!list)
            return this;

          if (list === listener || (list.listener && list.listener === listener)) {
            if (--this._eventsCount === 0)
              this._events = new EventHandlers();
            else {
              delete events[type];
              if (events.removeListener)
                this.emit('removeListener', type, list.listener || listener);
            }
          } else if (typeof list !== 'function') {
            position = -1;

            for (i = list.length; i-- > 0;) {
              if (list[i] === listener ||
                  (list[i].listener && list[i].listener === listener)) {
                originalListener = list[i].listener;
                position = i;
                break;
              }
            }

            if (position < 0)
              return this;

            if (list.length === 1) {
              list[0] = undefined;
              if (--this._eventsCount === 0) {
                this._events = new EventHandlers();
                return this;
              } else {
                delete events[type];
              }
            } else {
              spliceOne(list, position);
            }

            if (events.removeListener)
              this.emit('removeListener', type, originalListener || listener);
          }

          return this;
        };

    EventEmitter.prototype.removeAllListeners =
        function removeAllListeners(type) {
          var listeners, events;

          events = this._events;
          if (!events)
            return this;

          // not listening for removeListener, no need to emit
          if (!events.removeListener) {
            if (arguments.length === 0) {
              this._events = new EventHandlers();
              this._eventsCount = 0;
            } else if (events[type]) {
              if (--this._eventsCount === 0)
                this._events = new EventHandlers();
              else
                delete events[type];
            }
            return this;
          }

          // emit removeListener for all listeners on all events
          if (arguments.length === 0) {
            var keys = Object.keys(events);
            for (var i = 0, key; i < keys.length; ++i) {
              key = keys[i];
              if (key === 'removeListener') continue;
              this.removeAllListeners(key);
            }
            this.removeAllListeners('removeListener');
            this._events = new EventHandlers();
            this._eventsCount = 0;
            return this;
          }

          listeners = events[type];

          if (typeof listeners === 'function') {
            this.removeListener(type, listeners);
          } else if (listeners) {
            // LIFO order
            do {
              this.removeListener(type, listeners[listeners.length - 1]);
            } while (listeners[0]);
          }

          return this;
        };

    EventEmitter.prototype.listeners = function listeners(type) {
      var evlistener;
      var ret;
      var events = this._events;

      if (!events)
        ret = [];
      else {
        evlistener = events[type];
        if (!evlistener)
          ret = [];
        else if (typeof evlistener === 'function')
          ret = [evlistener.listener || evlistener];
        else
          ret = unwrapListeners(evlistener);
      }

      return ret;
    };

    EventEmitter.listenerCount = function(emitter, type) {
      if (typeof emitter.listenerCount === 'function') {
        return emitter.listenerCount(type);
      } else {
        return listenerCount.call(emitter, type);
      }
    };

    EventEmitter.prototype.listenerCount = listenerCount;
    function listenerCount(type) {
      var events = this._events;

      if (events) {
        var evlistener = events[type];

        if (typeof evlistener === 'function') {
          return 1;
        } else if (evlistener) {
          return evlistener.length;
        }
      }

      return 0;
    }

    EventEmitter.prototype.eventNames = function eventNames() {
      return this._eventsCount > 0 ? Reflect.ownKeys(this._events) : [];
    };

    // About 1.5x faster than the two-arg version of Array#splice().
    function spliceOne(list, index) {
      for (var i = index, k = i + 1, n = list.length; k < n; i += 1, k += 1)
        list[i] = list[k];
      list.pop();
    }

    function arrayClone(arr, i) {
      var copy = new Array(i);
      while (i--)
        copy[i] = arr[i];
      return copy;
    }

    function unwrapListeners(arr) {
      var ret = new Array(arr.length);
      for (var i = 0; i < ret.length; ++i) {
        ret[i] = arr[i].listener || arr[i];
      }
      return ret;
    }

    /* Copyright (c) 2017 Rod Vagg, MIT License */

    function AbstractIterator$6 (db) {
      this.db = db;
      this._ended = false;
      this._nexting = false;
    }

    AbstractIterator$6.prototype.next = function (callback) {
      var self = this;

      if (typeof callback !== 'function') {
        throw new Error('next() requires a callback argument')
      }

      if (self._ended) {
        process.nextTick(callback, new Error('cannot call next() after end()'));
        return self
      }

      if (self._nexting) {
        process.nextTick(callback, new Error('cannot call next() before previous next() has completed'));
        return self
      }

      self._nexting = true;
      self._next(function () {
        self._nexting = false;
        callback.apply(null, arguments);
      });

      return self
    };

    AbstractIterator$6.prototype._next = function (callback) {
      process.nextTick(callback);
    };

    AbstractIterator$6.prototype.end = function (callback) {
      if (typeof callback !== 'function') {
        throw new Error('end() requires a callback argument')
      }

      if (this._ended) {
        return process.nextTick(callback, new Error('end() already called on iterator'))
      }

      this._ended = true;
      this._end(callback);
    };

    AbstractIterator$6.prototype._end = function (callback) {
      process.nextTick(callback);
    };

    var abstractIterator$2 = AbstractIterator$6;

    /* Copyright (c) 2017 Rod Vagg, MIT License */

    function AbstractChainedBatch$6 (db) {
      this._db = db;
      this._operations = [];
      this._written = false;
    }

    AbstractChainedBatch$6.prototype._serializeKey = function (key) {
      return this._db._serializeKey(key)
    };

    AbstractChainedBatch$6.prototype._serializeValue = function (value) {
      return this._db._serializeValue(value)
    };

    AbstractChainedBatch$6.prototype._checkWritten = function () {
      if (this._written) {
        throw new Error('write() already called on this batch')
      }
    };

    AbstractChainedBatch$6.prototype.put = function (key, value) {
      this._checkWritten();

      var err = this._db._checkKey(key, 'key');
      if (err) { throw err }

      key = this._serializeKey(key);
      value = this._serializeValue(value);

      this._put(key, value);

      return this
    };

    AbstractChainedBatch$6.prototype._put = function (key, value) {
      this._operations.push({ type: 'put', key: key, value: value });
    };

    AbstractChainedBatch$6.prototype.del = function (key) {
      this._checkWritten();

      var err = this._db._checkKey(key, 'key');
      if (err) { throw err }

      key = this._serializeKey(key);
      this._del(key);

      return this
    };

    AbstractChainedBatch$6.prototype._del = function (key) {
      this._operations.push({ type: 'del', key: key });
    };

    AbstractChainedBatch$6.prototype.clear = function () {
      this._checkWritten();
      this._operations = [];
      this._clear();

      return this
    };

    AbstractChainedBatch$6.prototype._clear = function noop () {};

    AbstractChainedBatch$6.prototype.write = function (options, callback) {
      this._checkWritten();

      if (typeof options === 'function') { callback = options; }
      if (typeof callback !== 'function') {
        throw new Error('write() requires a callback argument')
      }
      if (typeof options !== 'object') { options = {}; }

      this._written = true;

      // @ts-ignore
      if (typeof this._write === 'function') { return this._write(callback) }

      if (typeof this._db._batch === 'function') {
        return this._db._batch(this._operations, options, callback)
      }

      process.nextTick(callback);
    };

    var abstractChainedBatch$2 = AbstractChainedBatch$6;

    /* Copyright (c) 2017 Rod Vagg, MIT License */




    var hasOwnProperty$4 = Object.prototype.hasOwnProperty;
    var rangeOptions$2 = 'start end gt gte lt lte'.split(' ');

    function AbstractLevelDOWN$6 (location) {
      if (!arguments.length || location === undefined) {
        throw new Error('constructor requires at least a location argument')
      }

      if (typeof location !== 'string') {
        throw new Error('constructor requires a location string argument')
      }

      this.location = location;
      this.status = 'new';
    }

    AbstractLevelDOWN$6.prototype.open = function (options, callback) {
      var self = this;
      var oldStatus = this.status;

      if (typeof options === 'function') { callback = options; }

      if (typeof callback !== 'function') {
        throw new Error('open() requires a callback argument')
      }

      if (typeof options !== 'object') { options = {}; }

      options.createIfMissing = options.createIfMissing !== false;
      options.errorIfExists = !!options.errorIfExists;

      this.status = 'opening';
      this._open(options, function (err) {
        if (err) {
          self.status = oldStatus;
          return callback(err)
        }
        self.status = 'open';
        callback();
      });
    };

    AbstractLevelDOWN$6.prototype._open = function (options, callback) {
      process.nextTick(callback);
    };

    AbstractLevelDOWN$6.prototype.close = function (callback) {
      var self = this;
      var oldStatus = this.status;

      if (typeof callback !== 'function') {
        throw new Error('close() requires a callback argument')
      }

      this.status = 'closing';
      this._close(function (err) {
        if (err) {
          self.status = oldStatus;
          return callback(err)
        }
        self.status = 'closed';
        callback();
      });
    };

    AbstractLevelDOWN$6.prototype._close = function (callback) {
      process.nextTick(callback);
    };

    AbstractLevelDOWN$6.prototype.get = function (key, options, callback) {
      if (typeof options === 'function') { callback = options; }

      if (typeof callback !== 'function') {
        throw new Error('get() requires a callback argument')
      }

      var err = this._checkKey(key, 'key');
      if (err) return process.nextTick(callback, err)

      key = this._serializeKey(key);

      if (typeof options !== 'object') { options = {}; }

      options.asBuffer = options.asBuffer !== false;

      this._get(key, options, callback);
    };

    AbstractLevelDOWN$6.prototype._get = function (key, options, callback) {
      process.nextTick(function () { callback(new Error('NotFound')); });
    };

    AbstractLevelDOWN$6.prototype.put = function (key, value, options, callback) {
      if (typeof options === 'function') { callback = options; }

      if (typeof callback !== 'function') {
        throw new Error('put() requires a callback argument')
      }

      var err = this._checkKey(key, 'key');
      if (err) return process.nextTick(callback, err)

      key = this._serializeKey(key);
      value = this._serializeValue(value);

      if (typeof options !== 'object') { options = {}; }

      this._put(key, value, options, callback);
    };

    AbstractLevelDOWN$6.prototype._put = function (key, value, options, callback) {
      process.nextTick(callback);
    };

    AbstractLevelDOWN$6.prototype.del = function (key, options, callback) {
      if (typeof options === 'function') { callback = options; }

      if (typeof callback !== 'function') {
        throw new Error('del() requires a callback argument')
      }

      var err = this._checkKey(key, 'key');
      if (err) return process.nextTick(callback, err)

      key = this._serializeKey(key);

      if (typeof options !== 'object') { options = {}; }

      this._del(key, options, callback);
    };

    AbstractLevelDOWN$6.prototype._del = function (key, options, callback) {
      process.nextTick(callback);
    };

    AbstractLevelDOWN$6.prototype.batch = function (array, options, callback) {
      if (!arguments.length) { return this._chainedBatch() }

      if (typeof options === 'function') { callback = options; }

      if (typeof array === 'function') { callback = array; }

      if (typeof callback !== 'function') {
        throw new Error('batch(array) requires a callback argument')
      }

      if (!Array.isArray(array)) {
        return process.nextTick(callback, new Error('batch(array) requires an array argument'))
      }

      if (!options || typeof options !== 'object') { options = {}; }

      var serialized = new Array(array.length);

      for (var i = 0; i < array.length; i++) {
        if (typeof array[i] !== 'object' || array[i] === null) {
          return process.nextTick(callback, new Error('batch(array) element must be an object and not `null`'))
        }

        var e = immutable(array[i]);

        if (e.type !== 'put' && e.type !== 'del') {
          return process.nextTick(callback, new Error("`type` must be 'put' or 'del'"))
        }

        var err = this._checkKey(e.key, 'key');
        if (err) return process.nextTick(callback, err)

        e.key = this._serializeKey(e.key);

        if (e.type === 'put') { e.value = this._serializeValue(e.value); }

        serialized[i] = e;
      }

      this._batch(serialized, options, callback);
    };

    AbstractLevelDOWN$6.prototype._batch = function (array, options, callback) {
      process.nextTick(callback);
    };

    AbstractLevelDOWN$6.prototype._setupIteratorOptions = function (options) {
      options = cleanRangeOptions$2(options);

      options.reverse = !!options.reverse;
      options.keys = options.keys !== false;
      options.values = options.values !== false;
      options.limit = 'limit' in options ? options.limit : -1;
      options.keyAsBuffer = options.keyAsBuffer !== false;
      options.valueAsBuffer = options.valueAsBuffer !== false;

      return options
    };

    function cleanRangeOptions$2 (options) {
      var result = {};

      for (var k in options) {
        if (!hasOwnProperty$4.call(options, k)) continue
        if (isRangeOption$2(k) && isEmptyRangeOption$2(options[k])) continue

        result[k] = options[k];
      }

      return result
    }

    function isRangeOption$2 (k) {
      return rangeOptions$2.indexOf(k) !== -1
    }

    function isEmptyRangeOption$2 (v) {
      return v === '' || v == null || isEmptyBuffer$2(v)
    }

    function isEmptyBuffer$2 (v) {
      return Buffer.isBuffer(v) && v.length === 0
    }

    AbstractLevelDOWN$6.prototype.iterator = function (options) {
      if (typeof options !== 'object') { options = {}; }
      options = this._setupIteratorOptions(options);
      return this._iterator(options)
    };

    AbstractLevelDOWN$6.prototype._iterator = function (options) {
      return new abstractIterator$2(this)
    };

    AbstractLevelDOWN$6.prototype._chainedBatch = function () {
      return new abstractChainedBatch$2(this)
    };

    AbstractLevelDOWN$6.prototype._serializeKey = function (key) {
      return Buffer.isBuffer(key) ? key : String(key)
    };

    AbstractLevelDOWN$6.prototype._serializeValue = function (value) {
      if (value == null) return ''
      return Buffer.isBuffer(value) || process.browser ? value : String(value)
    };

    AbstractLevelDOWN$6.prototype._checkKey = function (obj, type) {
      if (obj === null || obj === undefined) {
        return new Error(type + ' cannot be `null` or `undefined`')
      }

      if (Buffer.isBuffer(obj) && obj.length === 0) {
        return new Error(type + ' cannot be an empty Buffer')
      }

      if (String(obj) === '') {
        return new Error(type + ' cannot be an empty String')
      }
    };

    var abstractLeveldown$4 = AbstractLevelDOWN$6;

    var AbstractLevelDOWN$7 = abstractLeveldown$4;
    var AbstractIterator$7 = abstractIterator$2;
    var AbstractChainedBatch$7 = abstractChainedBatch$2;

    var abstractLeveldown$5 = {
    	AbstractLevelDOWN: AbstractLevelDOWN$7,
    	AbstractIterator: AbstractIterator$7,
    	AbstractChainedBatch: AbstractChainedBatch$7
    };

    var inherits_browser = createCommonjsModule(function (module) {
    if (typeof Object.create === 'function') {
      // implementation from standard node.js 'util' module
      module.exports = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        ctor.prototype = Object.create(superCtor.prototype, {
          constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
          }
        });
      };
    } else {
      // old school shim for old browsers
      module.exports = function inherits(ctor, superCtor) {
        ctor.super_ = superCtor;
        var TempCtor = function () {};
        TempCtor.prototype = superCtor.prototype;
        ctor.prototype = new TempCtor();
        ctor.prototype.constructor = ctor;
      };
    }
    });

    var inherits$3 = createCommonjsModule(function (module) {
    try {
      var util = require$$0;
      if (typeof util.inherits !== 'function') throw '';
      module.exports = util.inherits;
    } catch (e) {
      module.exports = inherits_browser;
    }
    });

    var AbstractIterator$8 = abstractLeveldown$5.AbstractIterator;


    function DeferredIterator (options) {
      AbstractIterator$8.call(this, options);

      this._options = options;
      this._iterator = null;
      this._operations = [];
    }

    inherits$3(DeferredIterator, AbstractIterator$8);

    DeferredIterator.prototype.setDb = function (db) {
      var it = this._iterator = db.iterator(this._options);
      this._operations.forEach(function (op) {
        it[op.method].apply(it, op.args);
      });
    };

    DeferredIterator.prototype._operation = function (method, args) {
      if (this._iterator) return this._iterator[method].apply(this._iterator, args)
      this._operations.push({ method: method, args: args });
    };

    'next end'.split(' ').forEach(function (m) {
      DeferredIterator.prototype['_' + m] = function () {
        this._operation(m, arguments);
      };
    });

    var deferredIterator = DeferredIterator;

    var AbstractLevelDOWN$8 = abstractLeveldown$5.AbstractLevelDOWN;


    var deferrables = 'put get del batch'.split(' ');

    function DeferredLevelDOWN (db) {
      AbstractLevelDOWN$8.call(this, '');
      this._db = db;
      this._operations = [];
      this._iterators = [];
      closed(this);
    }

    inherits$3(DeferredLevelDOWN, AbstractLevelDOWN$8);

    DeferredLevelDOWN.prototype._open = function (options, callback) {
      var self = this;

      this._db.open(options, function (err) {
        if (err) return callback(err)

        self._operations.forEach(function (op) {
          self._db[op.method].apply(self._db, op.args);
        });
        self._operations = [];
        self._iterators.forEach(function (it) {
          it.setDb(self._db);
        });
        self._iterators = [];
        open(self);
        callback();
      });
    };

    DeferredLevelDOWN.prototype._close = function (callback) {
      var self = this;

      this._db.close(function (err) {
        if (err) return callback(err)
        closed(self);
        callback();
      });
    };

    function open (self) {
      deferrables.concat('iterator').forEach(function (m) {
        self['_' + m] = function () {
          return this._db[m].apply(this._db, arguments)
        };
      });
      if (self._db.approximateSize) {
        self.approximateSize = function () {
          return this._db.approximateSize.apply(this._db, arguments)
        };
      }
    }

    function closed (self) {
      deferrables.forEach(function (m) {
        self['_' + m] = function () {
          this._operations.push({ method: m, args: arguments });
        };
      });
      if (typeof self._db.approximateSize === 'function') {
        self.approximateSize = function () {
          this._operations.push({
            method: 'approximateSize',
            args: arguments
          });
        };
      }
      self._iterator = function (options) {
        var it = new deferredIterator(options);
        this._iterators.push(it);
        return it
      };
    }

    DeferredLevelDOWN.prototype._serializeKey = function (key) {
      return key
    };

    DeferredLevelDOWN.prototype._serializeValue = function (value) {
      return value
    };

    var deferredLeveldown = DeferredLevelDOWN;
    var DeferredIterator_1 = deferredIterator;
    deferredLeveldown.DeferredIterator = DeferredIterator_1;

    var lookup = [];
    var revLookup = [];
    var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;
    var inited = false;
    function init$2 () {
      inited = true;
      var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
      for (var i = 0, len = code.length; i < len; ++i) {
        lookup[i] = code[i];
        revLookup[code.charCodeAt(i)] = i;
      }

      revLookup['-'.charCodeAt(0)] = 62;
      revLookup['_'.charCodeAt(0)] = 63;
    }

    function toByteArray (b64) {
      if (!inited) {
        init$2();
      }
      var i, j, l, tmp, placeHolders, arr;
      var len = b64.length;

      if (len % 4 > 0) {
        throw new Error('Invalid string. Length must be a multiple of 4')
      }

      // the number of equal signs (place holders)
      // if there are two placeholders, than the two characters before it
      // represent one byte
      // if there is only one, then the three characters before it represent 2 bytes
      // this is just a cheap hack to not do indexOf twice
      placeHolders = b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;

      // base64 is 4/3 + up to two characters of the original data
      arr = new Arr(len * 3 / 4 - placeHolders);

      // if there are placeholders, only get up to the last complete 4 chars
      l = placeHolders > 0 ? len - 4 : len;

      var L = 0;

      for (i = 0, j = 0; i < l; i += 4, j += 3) {
        tmp = (revLookup[b64.charCodeAt(i)] << 18) | (revLookup[b64.charCodeAt(i + 1)] << 12) | (revLookup[b64.charCodeAt(i + 2)] << 6) | revLookup[b64.charCodeAt(i + 3)];
        arr[L++] = (tmp >> 16) & 0xFF;
        arr[L++] = (tmp >> 8) & 0xFF;
        arr[L++] = tmp & 0xFF;
      }

      if (placeHolders === 2) {
        tmp = (revLookup[b64.charCodeAt(i)] << 2) | (revLookup[b64.charCodeAt(i + 1)] >> 4);
        arr[L++] = tmp & 0xFF;
      } else if (placeHolders === 1) {
        tmp = (revLookup[b64.charCodeAt(i)] << 10) | (revLookup[b64.charCodeAt(i + 1)] << 4) | (revLookup[b64.charCodeAt(i + 2)] >> 2);
        arr[L++] = (tmp >> 8) & 0xFF;
        arr[L++] = tmp & 0xFF;
      }

      return arr
    }

    function tripletToBase64 (num) {
      return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F]
    }

    function encodeChunk (uint8, start, end) {
      var tmp;
      var output = [];
      for (var i = start; i < end; i += 3) {
        tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + (uint8[i + 2]);
        output.push(tripletToBase64(tmp));
      }
      return output.join('')
    }

    function fromByteArray (uint8) {
      if (!inited) {
        init$2();
      }
      var tmp;
      var len = uint8.length;
      var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
      var output = '';
      var parts = [];
      var maxChunkLength = 16383; // must be multiple of 3

      // go through the array every three bytes, we'll deal with trailing stuff later
      for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
        parts.push(encodeChunk(uint8, i, (i + maxChunkLength) > len2 ? len2 : (i + maxChunkLength)));
      }

      // pad the end with zeros, but make sure to not forget the extra bytes
      if (extraBytes === 1) {
        tmp = uint8[len - 1];
        output += lookup[tmp >> 2];
        output += lookup[(tmp << 4) & 0x3F];
        output += '==';
      } else if (extraBytes === 2) {
        tmp = (uint8[len - 2] << 8) + (uint8[len - 1]);
        output += lookup[tmp >> 10];
        output += lookup[(tmp >> 4) & 0x3F];
        output += lookup[(tmp << 2) & 0x3F];
        output += '=';
      }

      parts.push(output);

      return parts.join('')
    }

    function read (buffer, offset, isLE, mLen, nBytes) {
      var e, m;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var nBits = -7;
      var i = isLE ? (nBytes - 1) : 0;
      var d = isLE ? -1 : 1;
      var s = buffer[offset + i];

      i += d;

      e = s & ((1 << (-nBits)) - 1);
      s >>= (-nBits);
      nBits += eLen;
      for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

      m = e & ((1 << (-nBits)) - 1);
      e >>= (-nBits);
      nBits += mLen;
      for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

      if (e === 0) {
        e = 1 - eBias;
      } else if (e === eMax) {
        return m ? NaN : ((s ? -1 : 1) * Infinity)
      } else {
        m = m + Math.pow(2, mLen);
        e = e - eBias;
      }
      return (s ? -1 : 1) * m * Math.pow(2, e - mLen)
    }

    function write (buffer, value, offset, isLE, mLen, nBytes) {
      var e, m, c;
      var eLen = nBytes * 8 - mLen - 1;
      var eMax = (1 << eLen) - 1;
      var eBias = eMax >> 1;
      var rt = (mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0);
      var i = isLE ? 0 : (nBytes - 1);
      var d = isLE ? 1 : -1;
      var s = value < 0 || (value === 0 && 1 / value < 0) ? 1 : 0;

      value = Math.abs(value);

      if (isNaN(value) || value === Infinity) {
        m = isNaN(value) ? 1 : 0;
        e = eMax;
      } else {
        e = Math.floor(Math.log(value) / Math.LN2);
        if (value * (c = Math.pow(2, -e)) < 1) {
          e--;
          c *= 2;
        }
        if (e + eBias >= 1) {
          value += rt / c;
        } else {
          value += rt * Math.pow(2, 1 - eBias);
        }
        if (value * c >= 2) {
          e++;
          c /= 2;
        }

        if (e + eBias >= eMax) {
          m = 0;
          e = eMax;
        } else if (e + eBias >= 1) {
          m = (value * c - 1) * Math.pow(2, mLen);
          e = e + eBias;
        } else {
          m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
          e = 0;
        }
      }

      for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

      e = (e << mLen) | m;
      eLen += mLen;
      for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

      buffer[offset + i - d] |= s * 128;
    }

    var toString = {}.toString;

    var isArray$1 = Array.isArray || function (arr) {
      return toString.call(arr) == '[object Array]';
    };

    /*!
     * The buffer module from node.js, for the browser.
     *
     * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
     * @license  MIT
     */

    var INSPECT_MAX_BYTES = 50;

    /**
     * If `Buffer.TYPED_ARRAY_SUPPORT`:
     *   === true    Use Uint8Array implementation (fastest)
     *   === false   Use Object implementation (most compatible, even IE6)
     *
     * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
     * Opera 11.6+, iOS 4.2+.
     *
     * Due to various browser bugs, sometimes the Object implementation will be used even
     * when the browser supports typed arrays.
     *
     * Note:
     *
     *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
     *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
     *
     *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
     *
     *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
     *     incorrect length in some situations.

     * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
     * get the Object implementation, which is slower but behaves correctly.
     */
    Buffer$1.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined
      ? global.TYPED_ARRAY_SUPPORT
      : true;

    /*
     * Export kMaxLength after typed array support is determined.
     */
    var _kMaxLength = kMaxLength();

    function kMaxLength () {
      return Buffer$1.TYPED_ARRAY_SUPPORT
        ? 0x7fffffff
        : 0x3fffffff
    }

    function createBuffer (that, length) {
      if (kMaxLength() < length) {
        throw new RangeError('Invalid typed array length')
      }
      if (Buffer$1.TYPED_ARRAY_SUPPORT) {
        // Return an augmented `Uint8Array` instance, for best performance
        that = new Uint8Array(length);
        that.__proto__ = Buffer$1.prototype;
      } else {
        // Fallback: Return an object instance of the Buffer class
        if (that === null) {
          that = new Buffer$1(length);
        }
        that.length = length;
      }

      return that
    }

    /**
     * The Buffer constructor returns instances of `Uint8Array` that have their
     * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
     * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
     * and the `Uint8Array` methods. Square bracket notation works as expected -- it
     * returns a single octet.
     *
     * The `Uint8Array` prototype remains unmodified.
     */

    function Buffer$1 (arg, encodingOrOffset, length) {
      if (!Buffer$1.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer$1)) {
        return new Buffer$1(arg, encodingOrOffset, length)
      }

      // Common case.
      if (typeof arg === 'number') {
        if (typeof encodingOrOffset === 'string') {
          throw new Error(
            'If encoding is specified then the first argument must be a string'
          )
        }
        return allocUnsafe(this, arg)
      }
      return from(this, arg, encodingOrOffset, length)
    }

    Buffer$1.poolSize = 8192; // not used by this implementation

    // TODO: Legacy, not needed anymore. Remove in next major version.
    Buffer$1._augment = function (arr) {
      arr.__proto__ = Buffer$1.prototype;
      return arr
    };

    function from (that, value, encodingOrOffset, length) {
      if (typeof value === 'number') {
        throw new TypeError('"value" argument must not be a number')
      }

      if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
        return fromArrayBuffer(that, value, encodingOrOffset, length)
      }

      if (typeof value === 'string') {
        return fromString(that, value, encodingOrOffset)
      }

      return fromObject(that, value)
    }

    /**
     * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
     * if value is a number.
     * Buffer.from(str[, encoding])
     * Buffer.from(array)
     * Buffer.from(buffer)
     * Buffer.from(arrayBuffer[, byteOffset[, length]])
     **/
    Buffer$1.from = function (value, encodingOrOffset, length) {
      return from(null, value, encodingOrOffset, length)
    };

    if (Buffer$1.TYPED_ARRAY_SUPPORT) {
      Buffer$1.prototype.__proto__ = Uint8Array.prototype;
      Buffer$1.__proto__ = Uint8Array;
    }

    function assertSize (size) {
      if (typeof size !== 'number') {
        throw new TypeError('"size" argument must be a number')
      } else if (size < 0) {
        throw new RangeError('"size" argument must not be negative')
      }
    }

    function alloc (that, size, fill, encoding) {
      assertSize(size);
      if (size <= 0) {
        return createBuffer(that, size)
      }
      if (fill !== undefined) {
        // Only pay attention to encoding if it's a string. This
        // prevents accidentally sending in a number that would
        // be interpretted as a start offset.
        return typeof encoding === 'string'
          ? createBuffer(that, size).fill(fill, encoding)
          : createBuffer(that, size).fill(fill)
      }
      return createBuffer(that, size)
    }

    /**
     * Creates a new filled Buffer instance.
     * alloc(size[, fill[, encoding]])
     **/
    Buffer$1.alloc = function (size, fill, encoding) {
      return alloc(null, size, fill, encoding)
    };

    function allocUnsafe (that, size) {
      assertSize(size);
      that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
      if (!Buffer$1.TYPED_ARRAY_SUPPORT) {
        for (var i = 0; i < size; ++i) {
          that[i] = 0;
        }
      }
      return that
    }

    /**
     * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
     * */
    Buffer$1.allocUnsafe = function (size) {
      return allocUnsafe(null, size)
    };
    /**
     * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
     */
    Buffer$1.allocUnsafeSlow = function (size) {
      return allocUnsafe(null, size)
    };

    function fromString (that, string, encoding) {
      if (typeof encoding !== 'string' || encoding === '') {
        encoding = 'utf8';
      }

      if (!Buffer$1.isEncoding(encoding)) {
        throw new TypeError('"encoding" must be a valid string encoding')
      }

      var length = byteLength(string, encoding) | 0;
      that = createBuffer(that, length);

      var actual = that.write(string, encoding);

      if (actual !== length) {
        // Writing a hex string, for example, that contains invalid characters will
        // cause everything after the first invalid character to be ignored. (e.g.
        // 'abxxcd' will be treated as 'ab')
        that = that.slice(0, actual);
      }

      return that
    }

    function fromArrayLike (that, array) {
      var length = array.length < 0 ? 0 : checked(array.length) | 0;
      that = createBuffer(that, length);
      for (var i = 0; i < length; i += 1) {
        that[i] = array[i] & 255;
      }
      return that
    }

    function fromArrayBuffer (that, array, byteOffset, length) {
      array.byteLength; // this throws if `array` is not a valid ArrayBuffer

      if (byteOffset < 0 || array.byteLength < byteOffset) {
        throw new RangeError('\'offset\' is out of bounds')
      }

      if (array.byteLength < byteOffset + (length || 0)) {
        throw new RangeError('\'length\' is out of bounds')
      }

      if (byteOffset === undefined && length === undefined) {
        array = new Uint8Array(array);
      } else if (length === undefined) {
        array = new Uint8Array(array, byteOffset);
      } else {
        array = new Uint8Array(array, byteOffset, length);
      }

      if (Buffer$1.TYPED_ARRAY_SUPPORT) {
        // Return an augmented `Uint8Array` instance, for best performance
        that = array;
        that.__proto__ = Buffer$1.prototype;
      } else {
        // Fallback: Return an object instance of the Buffer class
        that = fromArrayLike(that, array);
      }
      return that
    }

    function fromObject (that, obj) {
      if (internalIsBuffer(obj)) {
        var len = checked(obj.length) | 0;
        that = createBuffer(that, len);

        if (that.length === 0) {
          return that
        }

        obj.copy(that, 0, 0, len);
        return that
      }

      if (obj) {
        if ((typeof ArrayBuffer !== 'undefined' &&
            obj.buffer instanceof ArrayBuffer) || 'length' in obj) {
          if (typeof obj.length !== 'number' || isnan(obj.length)) {
            return createBuffer(that, 0)
          }
          return fromArrayLike(that, obj)
        }

        if (obj.type === 'Buffer' && isArray$1(obj.data)) {
          return fromArrayLike(that, obj.data)
        }
      }

      throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.')
    }

    function checked (length) {
      // Note: cannot use `length < kMaxLength()` here because that fails when
      // length is NaN (which is otherwise coerced to zero.)
      if (length >= kMaxLength()) {
        throw new RangeError('Attempt to allocate Buffer larger than maximum ' +
                             'size: 0x' + kMaxLength().toString(16) + ' bytes')
      }
      return length | 0
    }

    function SlowBuffer (length) {
      if (+length != length) { // eslint-disable-line eqeqeq
        length = 0;
      }
      return Buffer$1.alloc(+length)
    }
    Buffer$1.isBuffer = isBuffer$1;
    function internalIsBuffer (b) {
      return !!(b != null && b._isBuffer)
    }

    Buffer$1.compare = function compare (a, b) {
      if (!internalIsBuffer(a) || !internalIsBuffer(b)) {
        throw new TypeError('Arguments must be Buffers')
      }

      if (a === b) return 0

      var x = a.length;
      var y = b.length;

      for (var i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i];
          y = b[i];
          break
        }
      }

      if (x < y) return -1
      if (y < x) return 1
      return 0
    };

    Buffer$1.isEncoding = function isEncoding (encoding) {
      switch (String(encoding).toLowerCase()) {
        case 'hex':
        case 'utf8':
        case 'utf-8':
        case 'ascii':
        case 'latin1':
        case 'binary':
        case 'base64':
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return true
        default:
          return false
      }
    };

    Buffer$1.concat = function concat (list, length) {
      if (!isArray$1(list)) {
        throw new TypeError('"list" argument must be an Array of Buffers')
      }

      if (list.length === 0) {
        return Buffer$1.alloc(0)
      }

      var i;
      if (length === undefined) {
        length = 0;
        for (i = 0; i < list.length; ++i) {
          length += list[i].length;
        }
      }

      var buffer = Buffer$1.allocUnsafe(length);
      var pos = 0;
      for (i = 0; i < list.length; ++i) {
        var buf = list[i];
        if (!internalIsBuffer(buf)) {
          throw new TypeError('"list" argument must be an Array of Buffers')
        }
        buf.copy(buffer, pos);
        pos += buf.length;
      }
      return buffer
    };

    function byteLength (string, encoding) {
      if (internalIsBuffer(string)) {
        return string.length
      }
      if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' &&
          (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
        return string.byteLength
      }
      if (typeof string !== 'string') {
        string = '' + string;
      }

      var len = string.length;
      if (len === 0) return 0

      // Use a for loop to avoid recursion
      var loweredCase = false;
      for (;;) {
        switch (encoding) {
          case 'ascii':
          case 'latin1':
          case 'binary':
            return len
          case 'utf8':
          case 'utf-8':
          case undefined:
            return utf8ToBytes(string).length
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return len * 2
          case 'hex':
            return len >>> 1
          case 'base64':
            return base64ToBytes(string).length
          default:
            if (loweredCase) return utf8ToBytes(string).length // assume utf8
            encoding = ('' + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    }
    Buffer$1.byteLength = byteLength;

    function slowToString (encoding, start, end) {
      var loweredCase = false;

      // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
      // property of a typed array.

      // This behaves neither like String nor Uint8Array in that we set start/end
      // to their upper/lower bounds if the value passed is out of range.
      // undefined is handled specially as per ECMA-262 6th Edition,
      // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
      if (start === undefined || start < 0) {
        start = 0;
      }
      // Return early if start > this.length. Done here to prevent potential uint32
      // coercion fail below.
      if (start > this.length) {
        return ''
      }

      if (end === undefined || end > this.length) {
        end = this.length;
      }

      if (end <= 0) {
        return ''
      }

      // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
      end >>>= 0;
      start >>>= 0;

      if (end <= start) {
        return ''
      }

      if (!encoding) encoding = 'utf8';

      while (true) {
        switch (encoding) {
          case 'hex':
            return hexSlice(this, start, end)

          case 'utf8':
          case 'utf-8':
            return utf8Slice(this, start, end)

          case 'ascii':
            return asciiSlice(this, start, end)

          case 'latin1':
          case 'binary':
            return latin1Slice(this, start, end)

          case 'base64':
            return base64Slice(this, start, end)

          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return utf16leSlice(this, start, end)

          default:
            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
            encoding = (encoding + '').toLowerCase();
            loweredCase = true;
        }
      }
    }

    // The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
    // Buffer instances.
    Buffer$1.prototype._isBuffer = true;

    function swap (b, n, m) {
      var i = b[n];
      b[n] = b[m];
      b[m] = i;
    }

    Buffer$1.prototype.swap16 = function swap16 () {
      var len = this.length;
      if (len % 2 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 16-bits')
      }
      for (var i = 0; i < len; i += 2) {
        swap(this, i, i + 1);
      }
      return this
    };

    Buffer$1.prototype.swap32 = function swap32 () {
      var len = this.length;
      if (len % 4 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 32-bits')
      }
      for (var i = 0; i < len; i += 4) {
        swap(this, i, i + 3);
        swap(this, i + 1, i + 2);
      }
      return this
    };

    Buffer$1.prototype.swap64 = function swap64 () {
      var len = this.length;
      if (len % 8 !== 0) {
        throw new RangeError('Buffer size must be a multiple of 64-bits')
      }
      for (var i = 0; i < len; i += 8) {
        swap(this, i, i + 7);
        swap(this, i + 1, i + 6);
        swap(this, i + 2, i + 5);
        swap(this, i + 3, i + 4);
      }
      return this
    };

    Buffer$1.prototype.toString = function toString () {
      var length = this.length | 0;
      if (length === 0) return ''
      if (arguments.length === 0) return utf8Slice(this, 0, length)
      return slowToString.apply(this, arguments)
    };

    Buffer$1.prototype.equals = function equals (b) {
      if (!internalIsBuffer(b)) throw new TypeError('Argument must be a Buffer')
      if (this === b) return true
      return Buffer$1.compare(this, b) === 0
    };

    Buffer$1.prototype.inspect = function inspect () {
      var str = '';
      var max = INSPECT_MAX_BYTES;
      if (this.length > 0) {
        str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
        if (this.length > max) str += ' ... ';
      }
      return '<Buffer ' + str + '>'
    };

    Buffer$1.prototype.compare = function compare (target, start, end, thisStart, thisEnd) {
      if (!internalIsBuffer(target)) {
        throw new TypeError('Argument must be a Buffer')
      }

      if (start === undefined) {
        start = 0;
      }
      if (end === undefined) {
        end = target ? target.length : 0;
      }
      if (thisStart === undefined) {
        thisStart = 0;
      }
      if (thisEnd === undefined) {
        thisEnd = this.length;
      }

      if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
        throw new RangeError('out of range index')
      }

      if (thisStart >= thisEnd && start >= end) {
        return 0
      }
      if (thisStart >= thisEnd) {
        return -1
      }
      if (start >= end) {
        return 1
      }

      start >>>= 0;
      end >>>= 0;
      thisStart >>>= 0;
      thisEnd >>>= 0;

      if (this === target) return 0

      var x = thisEnd - thisStart;
      var y = end - start;
      var len = Math.min(x, y);

      var thisCopy = this.slice(thisStart, thisEnd);
      var targetCopy = target.slice(start, end);

      for (var i = 0; i < len; ++i) {
        if (thisCopy[i] !== targetCopy[i]) {
          x = thisCopy[i];
          y = targetCopy[i];
          break
        }
      }

      if (x < y) return -1
      if (y < x) return 1
      return 0
    };

    // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
    // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
    //
    // Arguments:
    // - buffer - a Buffer to search
    // - val - a string, Buffer, or number
    // - byteOffset - an index into `buffer`; will be clamped to an int32
    // - encoding - an optional encoding, relevant is val is a string
    // - dir - true for indexOf, false for lastIndexOf
    function bidirectionalIndexOf (buffer, val, byteOffset, encoding, dir) {
      // Empty buffer means no match
      if (buffer.length === 0) return -1

      // Normalize byteOffset
      if (typeof byteOffset === 'string') {
        encoding = byteOffset;
        byteOffset = 0;
      } else if (byteOffset > 0x7fffffff) {
        byteOffset = 0x7fffffff;
      } else if (byteOffset < -0x80000000) {
        byteOffset = -0x80000000;
      }
      byteOffset = +byteOffset;  // Coerce to Number.
      if (isNaN(byteOffset)) {
        // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
        byteOffset = dir ? 0 : (buffer.length - 1);
      }

      // Normalize byteOffset: negative offsets start from the end of the buffer
      if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
      if (byteOffset >= buffer.length) {
        if (dir) return -1
        else byteOffset = buffer.length - 1;
      } else if (byteOffset < 0) {
        if (dir) byteOffset = 0;
        else return -1
      }

      // Normalize val
      if (typeof val === 'string') {
        val = Buffer$1.from(val, encoding);
      }

      // Finally, search either indexOf (if dir is true) or lastIndexOf
      if (internalIsBuffer(val)) {
        // Special case: looking for empty string/buffer always fails
        if (val.length === 0) {
          return -1
        }
        return arrayIndexOf(buffer, val, byteOffset, encoding, dir)
      } else if (typeof val === 'number') {
        val = val & 0xFF; // Search for a byte value [0-255]
        if (Buffer$1.TYPED_ARRAY_SUPPORT &&
            typeof Uint8Array.prototype.indexOf === 'function') {
          if (dir) {
            return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset)
          } else {
            return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset)
          }
        }
        return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir)
      }

      throw new TypeError('val must be string, number or Buffer')
    }

    function arrayIndexOf (arr, val, byteOffset, encoding, dir) {
      var indexSize = 1;
      var arrLength = arr.length;
      var valLength = val.length;

      if (encoding !== undefined) {
        encoding = String(encoding).toLowerCase();
        if (encoding === 'ucs2' || encoding === 'ucs-2' ||
            encoding === 'utf16le' || encoding === 'utf-16le') {
          if (arr.length < 2 || val.length < 2) {
            return -1
          }
          indexSize = 2;
          arrLength /= 2;
          valLength /= 2;
          byteOffset /= 2;
        }
      }

      function read$$1 (buf, i) {
        if (indexSize === 1) {
          return buf[i]
        } else {
          return buf.readUInt16BE(i * indexSize)
        }
      }

      var i;
      if (dir) {
        var foundIndex = -1;
        for (i = byteOffset; i < arrLength; i++) {
          if (read$$1(arr, i) === read$$1(val, foundIndex === -1 ? 0 : i - foundIndex)) {
            if (foundIndex === -1) foundIndex = i;
            if (i - foundIndex + 1 === valLength) return foundIndex * indexSize
          } else {
            if (foundIndex !== -1) i -= i - foundIndex;
            foundIndex = -1;
          }
        }
      } else {
        if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
        for (i = byteOffset; i >= 0; i--) {
          var found = true;
          for (var j = 0; j < valLength; j++) {
            if (read$$1(arr, i + j) !== read$$1(val, j)) {
              found = false;
              break
            }
          }
          if (found) return i
        }
      }

      return -1
    }

    Buffer$1.prototype.includes = function includes (val, byteOffset, encoding) {
      return this.indexOf(val, byteOffset, encoding) !== -1
    };

    Buffer$1.prototype.indexOf = function indexOf (val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, true)
    };

    Buffer$1.prototype.lastIndexOf = function lastIndexOf (val, byteOffset, encoding) {
      return bidirectionalIndexOf(this, val, byteOffset, encoding, false)
    };

    function hexWrite (buf, string, offset, length) {
      offset = Number(offset) || 0;
      var remaining = buf.length - offset;
      if (!length) {
        length = remaining;
      } else {
        length = Number(length);
        if (length > remaining) {
          length = remaining;
        }
      }

      // must be an even number of digits
      var strLen = string.length;
      if (strLen % 2 !== 0) throw new TypeError('Invalid hex string')

      if (length > strLen / 2) {
        length = strLen / 2;
      }
      for (var i = 0; i < length; ++i) {
        var parsed = parseInt(string.substr(i * 2, 2), 16);
        if (isNaN(parsed)) return i
        buf[offset + i] = parsed;
      }
      return i
    }

    function utf8Write (buf, string, offset, length) {
      return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length)
    }

    function asciiWrite (buf, string, offset, length) {
      return blitBuffer(asciiToBytes(string), buf, offset, length)
    }

    function latin1Write (buf, string, offset, length) {
      return asciiWrite(buf, string, offset, length)
    }

    function base64Write (buf, string, offset, length) {
      return blitBuffer(base64ToBytes(string), buf, offset, length)
    }

    function ucs2Write (buf, string, offset, length) {
      return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length)
    }

    Buffer$1.prototype.write = function write$$1 (string, offset, length, encoding) {
      // Buffer#write(string)
      if (offset === undefined) {
        encoding = 'utf8';
        length = this.length;
        offset = 0;
      // Buffer#write(string, encoding)
      } else if (length === undefined && typeof offset === 'string') {
        encoding = offset;
        length = this.length;
        offset = 0;
      // Buffer#write(string, offset[, length][, encoding])
      } else if (isFinite(offset)) {
        offset = offset | 0;
        if (isFinite(length)) {
          length = length | 0;
          if (encoding === undefined) encoding = 'utf8';
        } else {
          encoding = length;
          length = undefined;
        }
      // legacy write(string, encoding, offset, length) - remove in v0.13
      } else {
        throw new Error(
          'Buffer.write(string, encoding, offset[, length]) is no longer supported'
        )
      }

      var remaining = this.length - offset;
      if (length === undefined || length > remaining) length = remaining;

      if ((string.length > 0 && (length < 0 || offset < 0)) || offset > this.length) {
        throw new RangeError('Attempt to write outside buffer bounds')
      }

      if (!encoding) encoding = 'utf8';

      var loweredCase = false;
      for (;;) {
        switch (encoding) {
          case 'hex':
            return hexWrite(this, string, offset, length)

          case 'utf8':
          case 'utf-8':
            return utf8Write(this, string, offset, length)

          case 'ascii':
            return asciiWrite(this, string, offset, length)

          case 'latin1':
          case 'binary':
            return latin1Write(this, string, offset, length)

          case 'base64':
            // Warning: maxLength not taken into account in base64Write
            return base64Write(this, string, offset, length)

          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return ucs2Write(this, string, offset, length)

          default:
            if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding)
            encoding = ('' + encoding).toLowerCase();
            loweredCase = true;
        }
      }
    };

    Buffer$1.prototype.toJSON = function toJSON () {
      return {
        type: 'Buffer',
        data: Array.prototype.slice.call(this._arr || this, 0)
      }
    };

    function base64Slice (buf, start, end) {
      if (start === 0 && end === buf.length) {
        return fromByteArray(buf)
      } else {
        return fromByteArray(buf.slice(start, end))
      }
    }

    function utf8Slice (buf, start, end) {
      end = Math.min(buf.length, end);
      var res = [];

      var i = start;
      while (i < end) {
        var firstByte = buf[i];
        var codePoint = null;
        var bytesPerSequence = (firstByte > 0xEF) ? 4
          : (firstByte > 0xDF) ? 3
          : (firstByte > 0xBF) ? 2
          : 1;

        if (i + bytesPerSequence <= end) {
          var secondByte, thirdByte, fourthByte, tempCodePoint;

          switch (bytesPerSequence) {
            case 1:
              if (firstByte < 0x80) {
                codePoint = firstByte;
              }
              break
            case 2:
              secondByte = buf[i + 1];
              if ((secondByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0x1F) << 0x6 | (secondByte & 0x3F);
                if (tempCodePoint > 0x7F) {
                  codePoint = tempCodePoint;
                }
              }
              break
            case 3:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | (thirdByte & 0x3F);
                if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                  codePoint = tempCodePoint;
                }
              }
              break
            case 4:
              secondByte = buf[i + 1];
              thirdByte = buf[i + 2];
              fourthByte = buf[i + 3];
              if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
                tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | (fourthByte & 0x3F);
                if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                  codePoint = tempCodePoint;
                }
              }
          }
        }

        if (codePoint === null) {
          // we did not generate a valid codePoint so insert a
          // replacement char (U+FFFD) and advance only 1 byte
          codePoint = 0xFFFD;
          bytesPerSequence = 1;
        } else if (codePoint > 0xFFFF) {
          // encode to utf16 (surrogate pair dance)
          codePoint -= 0x10000;
          res.push(codePoint >>> 10 & 0x3FF | 0xD800);
          codePoint = 0xDC00 | codePoint & 0x3FF;
        }

        res.push(codePoint);
        i += bytesPerSequence;
      }

      return decodeCodePointsArray(res)
    }

    // Based on http://stackoverflow.com/a/22747272/680742, the browser with
    // the lowest limit is Chrome, with 0x10000 args.
    // We go 1 magnitude less, for safety
    var MAX_ARGUMENTS_LENGTH = 0x1000;

    function decodeCodePointsArray (codePoints) {
      var len = codePoints.length;
      if (len <= MAX_ARGUMENTS_LENGTH) {
        return String.fromCharCode.apply(String, codePoints) // avoid extra slice()
      }

      // Decode in chunks to avoid "call stack size exceeded".
      var res = '';
      var i = 0;
      while (i < len) {
        res += String.fromCharCode.apply(
          String,
          codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH)
        );
      }
      return res
    }

    function asciiSlice (buf, start, end) {
      var ret = '';
      end = Math.min(buf.length, end);

      for (var i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i] & 0x7F);
      }
      return ret
    }

    function latin1Slice (buf, start, end) {
      var ret = '';
      end = Math.min(buf.length, end);

      for (var i = start; i < end; ++i) {
        ret += String.fromCharCode(buf[i]);
      }
      return ret
    }

    function hexSlice (buf, start, end) {
      var len = buf.length;

      if (!start || start < 0) start = 0;
      if (!end || end < 0 || end > len) end = len;

      var out = '';
      for (var i = start; i < end; ++i) {
        out += toHex(buf[i]);
      }
      return out
    }

    function utf16leSlice (buf, start, end) {
      var bytes = buf.slice(start, end);
      var res = '';
      for (var i = 0; i < bytes.length; i += 2) {
        res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
      }
      return res
    }

    Buffer$1.prototype.slice = function slice (start, end) {
      var len = this.length;
      start = ~~start;
      end = end === undefined ? len : ~~end;

      if (start < 0) {
        start += len;
        if (start < 0) start = 0;
      } else if (start > len) {
        start = len;
      }

      if (end < 0) {
        end += len;
        if (end < 0) end = 0;
      } else if (end > len) {
        end = len;
      }

      if (end < start) end = start;

      var newBuf;
      if (Buffer$1.TYPED_ARRAY_SUPPORT) {
        newBuf = this.subarray(start, end);
        newBuf.__proto__ = Buffer$1.prototype;
      } else {
        var sliceLen = end - start;
        newBuf = new Buffer$1(sliceLen, undefined);
        for (var i = 0; i < sliceLen; ++i) {
          newBuf[i] = this[i + start];
        }
      }

      return newBuf
    };

    /*
     * Need to make sure that buffer isn't trying to write out of bounds.
     */
    function checkOffset (offset, ext, length) {
      if ((offset % 1) !== 0 || offset < 0) throw new RangeError('offset is not uint')
      if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length')
    }

    Buffer$1.prototype.readUIntLE = function readUIntLE (offset, byteLength, noAssert) {
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) checkOffset(offset, byteLength, this.length);

      var val = this[offset];
      var mul = 1;
      var i = 0;
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul;
      }

      return val
    };

    Buffer$1.prototype.readUIntBE = function readUIntBE (offset, byteLength, noAssert) {
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) {
        checkOffset(offset, byteLength, this.length);
      }

      var val = this[offset + --byteLength];
      var mul = 1;
      while (byteLength > 0 && (mul *= 0x100)) {
        val += this[offset + --byteLength] * mul;
      }

      return val
    };

    Buffer$1.prototype.readUInt8 = function readUInt8 (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 1, this.length);
      return this[offset]
    };

    Buffer$1.prototype.readUInt16LE = function readUInt16LE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 2, this.length);
      return this[offset] | (this[offset + 1] << 8)
    };

    Buffer$1.prototype.readUInt16BE = function readUInt16BE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 2, this.length);
      return (this[offset] << 8) | this[offset + 1]
    };

    Buffer$1.prototype.readUInt32LE = function readUInt32LE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);

      return ((this[offset]) |
          (this[offset + 1] << 8) |
          (this[offset + 2] << 16)) +
          (this[offset + 3] * 0x1000000)
    };

    Buffer$1.prototype.readUInt32BE = function readUInt32BE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);

      return (this[offset] * 0x1000000) +
        ((this[offset + 1] << 16) |
        (this[offset + 2] << 8) |
        this[offset + 3])
    };

    Buffer$1.prototype.readIntLE = function readIntLE (offset, byteLength, noAssert) {
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) checkOffset(offset, byteLength, this.length);

      var val = this[offset];
      var mul = 1;
      var i = 0;
      while (++i < byteLength && (mul *= 0x100)) {
        val += this[offset + i] * mul;
      }
      mul *= 0x80;

      if (val >= mul) val -= Math.pow(2, 8 * byteLength);

      return val
    };

    Buffer$1.prototype.readIntBE = function readIntBE (offset, byteLength, noAssert) {
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) checkOffset(offset, byteLength, this.length);

      var i = byteLength;
      var mul = 1;
      var val = this[offset + --i];
      while (i > 0 && (mul *= 0x100)) {
        val += this[offset + --i] * mul;
      }
      mul *= 0x80;

      if (val >= mul) val -= Math.pow(2, 8 * byteLength);

      return val
    };

    Buffer$1.prototype.readInt8 = function readInt8 (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 1, this.length);
      if (!(this[offset] & 0x80)) return (this[offset])
      return ((0xff - this[offset] + 1) * -1)
    };

    Buffer$1.prototype.readInt16LE = function readInt16LE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 2, this.length);
      var val = this[offset] | (this[offset + 1] << 8);
      return (val & 0x8000) ? val | 0xFFFF0000 : val
    };

    Buffer$1.prototype.readInt16BE = function readInt16BE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 2, this.length);
      var val = this[offset + 1] | (this[offset] << 8);
      return (val & 0x8000) ? val | 0xFFFF0000 : val
    };

    Buffer$1.prototype.readInt32LE = function readInt32LE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);

      return (this[offset]) |
        (this[offset + 1] << 8) |
        (this[offset + 2] << 16) |
        (this[offset + 3] << 24)
    };

    Buffer$1.prototype.readInt32BE = function readInt32BE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);

      return (this[offset] << 24) |
        (this[offset + 1] << 16) |
        (this[offset + 2] << 8) |
        (this[offset + 3])
    };

    Buffer$1.prototype.readFloatLE = function readFloatLE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);
      return read(this, offset, true, 23, 4)
    };

    Buffer$1.prototype.readFloatBE = function readFloatBE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 4, this.length);
      return read(this, offset, false, 23, 4)
    };

    Buffer$1.prototype.readDoubleLE = function readDoubleLE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 8, this.length);
      return read(this, offset, true, 52, 8)
    };

    Buffer$1.prototype.readDoubleBE = function readDoubleBE (offset, noAssert) {
      if (!noAssert) checkOffset(offset, 8, this.length);
      return read(this, offset, false, 52, 8)
    };

    function checkInt (buf, value, offset, ext, max, min) {
      if (!internalIsBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance')
      if (value > max || value < min) throw new RangeError('"value" argument is out of bounds')
      if (offset + ext > buf.length) throw new RangeError('Index out of range')
    }

    Buffer$1.prototype.writeUIntLE = function writeUIntLE (value, offset, byteLength, noAssert) {
      value = +value;
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) {
        var maxBytes = Math.pow(2, 8 * byteLength) - 1;
        checkInt(this, value, offset, byteLength, maxBytes, 0);
      }

      var mul = 1;
      var i = 0;
      this[offset] = value & 0xFF;
      while (++i < byteLength && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xFF;
      }

      return offset + byteLength
    };

    Buffer$1.prototype.writeUIntBE = function writeUIntBE (value, offset, byteLength, noAssert) {
      value = +value;
      offset = offset | 0;
      byteLength = byteLength | 0;
      if (!noAssert) {
        var maxBytes = Math.pow(2, 8 * byteLength) - 1;
        checkInt(this, value, offset, byteLength, maxBytes, 0);
      }

      var i = byteLength - 1;
      var mul = 1;
      this[offset + i] = value & 0xFF;
      while (--i >= 0 && (mul *= 0x100)) {
        this[offset + i] = (value / mul) & 0xFF;
      }

      return offset + byteLength
    };

    Buffer$1.prototype.writeUInt8 = function writeUInt8 (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
      if (!Buffer$1.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
      this[offset] = (value & 0xff);
      return offset + 1
    };

    function objectWriteUInt16 (buf, value, offset, littleEndian) {
      if (value < 0) value = 0xffff + value + 1;
      for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
        buf[offset + i] = (value & (0xff << (8 * (littleEndian ? i : 1 - i)))) >>>
          (littleEndian ? i : 1 - i) * 8;
      }
    }

    Buffer$1.prototype.writeUInt16LE = function writeUInt16LE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
      if (Buffer$1.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value & 0xff);
        this[offset + 1] = (value >>> 8);
      } else {
        objectWriteUInt16(this, value, offset, true);
      }
      return offset + 2
    };

    Buffer$1.prototype.writeUInt16BE = function writeUInt16BE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
      if (Buffer$1.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 8);
        this[offset + 1] = (value & 0xff);
      } else {
        objectWriteUInt16(this, value, offset, false);
      }
      return offset + 2
    };

    function objectWriteUInt32 (buf, value, offset, littleEndian) {
      if (value < 0) value = 0xffffffff + value + 1;
      for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
        buf[offset + i] = (value >>> (littleEndian ? i : 3 - i) * 8) & 0xff;
      }
    }

    Buffer$1.prototype.writeUInt32LE = function writeUInt32LE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
      if (Buffer$1.TYPED_ARRAY_SUPPORT) {
        this[offset + 3] = (value >>> 24);
        this[offset + 2] = (value >>> 16);
        this[offset + 1] = (value >>> 8);
        this[offset] = (value & 0xff);
      } else {
        objectWriteUInt32(this, value, offset, true);
      }
      return offset + 4
    };

    Buffer$1.prototype.writeUInt32BE = function writeUInt32BE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
      if (Buffer$1.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 24);
        this[offset + 1] = (value >>> 16);
        this[offset + 2] = (value >>> 8);
        this[offset + 3] = (value & 0xff);
      } else {
        objectWriteUInt32(this, value, offset, false);
      }
      return offset + 4
    };

    Buffer$1.prototype.writeIntLE = function writeIntLE (value, offset, byteLength, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) {
        var limit = Math.pow(2, 8 * byteLength - 1);

        checkInt(this, value, offset, byteLength, limit - 1, -limit);
      }

      var i = 0;
      var mul = 1;
      var sub = 0;
      this[offset] = value & 0xFF;
      while (++i < byteLength && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
      }

      return offset + byteLength
    };

    Buffer$1.prototype.writeIntBE = function writeIntBE (value, offset, byteLength, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) {
        var limit = Math.pow(2, 8 * byteLength - 1);

        checkInt(this, value, offset, byteLength, limit - 1, -limit);
      }

      var i = byteLength - 1;
      var mul = 1;
      var sub = 0;
      this[offset + i] = value & 0xFF;
      while (--i >= 0 && (mul *= 0x100)) {
        if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
          sub = 1;
        }
        this[offset + i] = ((value / mul) >> 0) - sub & 0xFF;
      }

      return offset + byteLength
    };

    Buffer$1.prototype.writeInt8 = function writeInt8 (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
      if (!Buffer$1.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
      if (value < 0) value = 0xff + value + 1;
      this[offset] = (value & 0xff);
      return offset + 1
    };

    Buffer$1.prototype.writeInt16LE = function writeInt16LE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
      if (Buffer$1.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value & 0xff);
        this[offset + 1] = (value >>> 8);
      } else {
        objectWriteUInt16(this, value, offset, true);
      }
      return offset + 2
    };

    Buffer$1.prototype.writeInt16BE = function writeInt16BE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
      if (Buffer$1.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 8);
        this[offset + 1] = (value & 0xff);
      } else {
        objectWriteUInt16(this, value, offset, false);
      }
      return offset + 2
    };

    Buffer$1.prototype.writeInt32LE = function writeInt32LE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
      if (Buffer$1.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value & 0xff);
        this[offset + 1] = (value >>> 8);
        this[offset + 2] = (value >>> 16);
        this[offset + 3] = (value >>> 24);
      } else {
        objectWriteUInt32(this, value, offset, true);
      }
      return offset + 4
    };

    Buffer$1.prototype.writeInt32BE = function writeInt32BE (value, offset, noAssert) {
      value = +value;
      offset = offset | 0;
      if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
      if (value < 0) value = 0xffffffff + value + 1;
      if (Buffer$1.TYPED_ARRAY_SUPPORT) {
        this[offset] = (value >>> 24);
        this[offset + 1] = (value >>> 16);
        this[offset + 2] = (value >>> 8);
        this[offset + 3] = (value & 0xff);
      } else {
        objectWriteUInt32(this, value, offset, false);
      }
      return offset + 4
    };

    function checkIEEE754 (buf, value, offset, ext, max, min) {
      if (offset + ext > buf.length) throw new RangeError('Index out of range')
      if (offset < 0) throw new RangeError('Index out of range')
    }

    function writeFloat (buf, value, offset, littleEndian, noAssert) {
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
      }
      write(buf, value, offset, littleEndian, 23, 4);
      return offset + 4
    }

    Buffer$1.prototype.writeFloatLE = function writeFloatLE (value, offset, noAssert) {
      return writeFloat(this, value, offset, true, noAssert)
    };

    Buffer$1.prototype.writeFloatBE = function writeFloatBE (value, offset, noAssert) {
      return writeFloat(this, value, offset, false, noAssert)
    };

    function writeDouble (buf, value, offset, littleEndian, noAssert) {
      if (!noAssert) {
        checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
      }
      write(buf, value, offset, littleEndian, 52, 8);
      return offset + 8
    }

    Buffer$1.prototype.writeDoubleLE = function writeDoubleLE (value, offset, noAssert) {
      return writeDouble(this, value, offset, true, noAssert)
    };

    Buffer$1.prototype.writeDoubleBE = function writeDoubleBE (value, offset, noAssert) {
      return writeDouble(this, value, offset, false, noAssert)
    };

    // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
    Buffer$1.prototype.copy = function copy (target, targetStart, start, end) {
      if (!start) start = 0;
      if (!end && end !== 0) end = this.length;
      if (targetStart >= target.length) targetStart = target.length;
      if (!targetStart) targetStart = 0;
      if (end > 0 && end < start) end = start;

      // Copy 0 bytes; we're done
      if (end === start) return 0
      if (target.length === 0 || this.length === 0) return 0

      // Fatal error conditions
      if (targetStart < 0) {
        throw new RangeError('targetStart out of bounds')
      }
      if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds')
      if (end < 0) throw new RangeError('sourceEnd out of bounds')

      // Are we oob?
      if (end > this.length) end = this.length;
      if (target.length - targetStart < end - start) {
        end = target.length - targetStart + start;
      }

      var len = end - start;
      var i;

      if (this === target && start < targetStart && targetStart < end) {
        // descending copy from end
        for (i = len - 1; i >= 0; --i) {
          target[i + targetStart] = this[i + start];
        }
      } else if (len < 1000 || !Buffer$1.TYPED_ARRAY_SUPPORT) {
        // ascending copy from start
        for (i = 0; i < len; ++i) {
          target[i + targetStart] = this[i + start];
        }
      } else {
        Uint8Array.prototype.set.call(
          target,
          this.subarray(start, start + len),
          targetStart
        );
      }

      return len
    };

    // Usage:
    //    buffer.fill(number[, offset[, end]])
    //    buffer.fill(buffer[, offset[, end]])
    //    buffer.fill(string[, offset[, end]][, encoding])
    Buffer$1.prototype.fill = function fill (val, start, end, encoding) {
      // Handle string cases:
      if (typeof val === 'string') {
        if (typeof start === 'string') {
          encoding = start;
          start = 0;
          end = this.length;
        } else if (typeof end === 'string') {
          encoding = end;
          end = this.length;
        }
        if (val.length === 1) {
          var code = val.charCodeAt(0);
          if (code < 256) {
            val = code;
          }
        }
        if (encoding !== undefined && typeof encoding !== 'string') {
          throw new TypeError('encoding must be a string')
        }
        if (typeof encoding === 'string' && !Buffer$1.isEncoding(encoding)) {
          throw new TypeError('Unknown encoding: ' + encoding)
        }
      } else if (typeof val === 'number') {
        val = val & 255;
      }

      // Invalid ranges are not set to a default, so can range check early.
      if (start < 0 || this.length < start || this.length < end) {
        throw new RangeError('Out of range index')
      }

      if (end <= start) {
        return this
      }

      start = start >>> 0;
      end = end === undefined ? this.length : end >>> 0;

      if (!val) val = 0;

      var i;
      if (typeof val === 'number') {
        for (i = start; i < end; ++i) {
          this[i] = val;
        }
      } else {
        var bytes = internalIsBuffer(val)
          ? val
          : utf8ToBytes(new Buffer$1(val, encoding).toString());
        var len = bytes.length;
        for (i = 0; i < end - start; ++i) {
          this[i + start] = bytes[i % len];
        }
      }

      return this
    };

    // HELPER FUNCTIONS
    // ================

    var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

    function base64clean (str) {
      // Node strips out invalid characters like \n and \t from the string, base64-js does not
      str = stringtrim(str).replace(INVALID_BASE64_RE, '');
      // Node converts strings with length < 2 to ''
      if (str.length < 2) return ''
      // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
      while (str.length % 4 !== 0) {
        str = str + '=';
      }
      return str
    }

    function stringtrim (str) {
      if (str.trim) return str.trim()
      return str.replace(/^\s+|\s+$/g, '')
    }

    function toHex (n) {
      if (n < 16) return '0' + n.toString(16)
      return n.toString(16)
    }

    function utf8ToBytes (string, units) {
      units = units || Infinity;
      var codePoint;
      var length = string.length;
      var leadSurrogate = null;
      var bytes = [];

      for (var i = 0; i < length; ++i) {
        codePoint = string.charCodeAt(i);

        // is surrogate component
        if (codePoint > 0xD7FF && codePoint < 0xE000) {
          // last char was a lead
          if (!leadSurrogate) {
            // no lead yet
            if (codePoint > 0xDBFF) {
              // unexpected trail
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
              continue
            } else if (i + 1 === length) {
              // unpaired lead
              if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
              continue
            }

            // valid lead
            leadSurrogate = codePoint;

            continue
          }

          // 2 leads in a row
          if (codePoint < 0xDC00) {
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            leadSurrogate = codePoint;
            continue
          }

          // valid surrogate pair
          codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
        } else if (leadSurrogate) {
          // valid bmp char, but last char was a lead
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
        }

        leadSurrogate = null;

        // encode utf8
        if (codePoint < 0x80) {
          if ((units -= 1) < 0) break
          bytes.push(codePoint);
        } else if (codePoint < 0x800) {
          if ((units -= 2) < 0) break
          bytes.push(
            codePoint >> 0x6 | 0xC0,
            codePoint & 0x3F | 0x80
          );
        } else if (codePoint < 0x10000) {
          if ((units -= 3) < 0) break
          bytes.push(
            codePoint >> 0xC | 0xE0,
            codePoint >> 0x6 & 0x3F | 0x80,
            codePoint & 0x3F | 0x80
          );
        } else if (codePoint < 0x110000) {
          if ((units -= 4) < 0) break
          bytes.push(
            codePoint >> 0x12 | 0xF0,
            codePoint >> 0xC & 0x3F | 0x80,
            codePoint >> 0x6 & 0x3F | 0x80,
            codePoint & 0x3F | 0x80
          );
        } else {
          throw new Error('Invalid code point')
        }
      }

      return bytes
    }

    function asciiToBytes (str) {
      var byteArray = [];
      for (var i = 0; i < str.length; ++i) {
        // Node's code seems to be doing this and not & 0x7F..
        byteArray.push(str.charCodeAt(i) & 0xFF);
      }
      return byteArray
    }

    function utf16leToBytes (str, units) {
      var c, hi, lo;
      var byteArray = [];
      for (var i = 0; i < str.length; ++i) {
        if ((units -= 2) < 0) break

        c = str.charCodeAt(i);
        hi = c >> 8;
        lo = c % 256;
        byteArray.push(lo);
        byteArray.push(hi);
      }

      return byteArray
    }


    function base64ToBytes (str) {
      return toByteArray(base64clean(str))
    }

    function blitBuffer (src, dst, offset, length) {
      for (var i = 0; i < length; ++i) {
        if ((i + offset >= dst.length) || (i >= src.length)) break
        dst[i + offset] = src[i];
      }
      return i
    }

    function isnan (val) {
      return val !== val // eslint-disable-line no-self-compare
    }


    // the following is from is-buffer, also by Feross Aboukhadijeh and with same lisence
    // The _isBuffer check is for Safari 5-7 support, because it's missing
    // Object.prototype.constructor. Remove this eventually
    function isBuffer$1(obj) {
      return obj != null && (!!obj._isBuffer || isFastBuffer(obj) || isSlowBuffer(obj))
    }

    function isFastBuffer (obj) {
      return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
    }

    // For Node v0.10 support. Remove this eventually.
    function isSlowBuffer (obj) {
      return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isFastBuffer(obj.slice(0, 0))
    }

    var bufferEs6 = /*#__PURE__*/Object.freeze({
        INSPECT_MAX_BYTES: INSPECT_MAX_BYTES,
        kMaxLength: _kMaxLength,
        Buffer: Buffer$1,
        SlowBuffer: SlowBuffer,
        isBuffer: isBuffer$1
    });

    function BufferList() {
      this.head = null;
      this.tail = null;
      this.length = 0;
    }

    BufferList.prototype.push = function (v) {
      var entry = { data: v, next: null };
      if (this.length > 0) this.tail.next = entry;else this.head = entry;
      this.tail = entry;
      ++this.length;
    };

    BufferList.prototype.unshift = function (v) {
      var entry = { data: v, next: this.head };
      if (this.length === 0) this.tail = entry;
      this.head = entry;
      ++this.length;
    };

    BufferList.prototype.shift = function () {
      if (this.length === 0) return;
      var ret = this.head.data;
      if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
      --this.length;
      return ret;
    };

    BufferList.prototype.clear = function () {
      this.head = this.tail = null;
      this.length = 0;
    };

    BufferList.prototype.join = function (s) {
      if (this.length === 0) return '';
      var p = this.head;
      var ret = '' + p.data;
      while (p = p.next) {
        ret += s + p.data;
      }return ret;
    };

    BufferList.prototype.concat = function (n) {
      if (this.length === 0) return Buffer$1.alloc(0);
      if (this.length === 1) return this.head.data;
      var ret = Buffer$1.allocUnsafe(n >>> 0);
      var p = this.head;
      var i = 0;
      while (p) {
        p.data.copy(ret, i);
        i += p.data.length;
        p = p.next;
      }
      return ret;
    };

    // Copyright Joyent, Inc. and other Node contributors.
    var isBufferEncoding = Buffer$1.isEncoding
      || function(encoding) {
           switch (encoding && encoding.toLowerCase()) {
             case 'hex': case 'utf8': case 'utf-8': case 'ascii': case 'binary': case 'base64': case 'ucs2': case 'ucs-2': case 'utf16le': case 'utf-16le': case 'raw': return true;
             default: return false;
           }
         };


    function assertEncoding(encoding) {
      if (encoding && !isBufferEncoding(encoding)) {
        throw new Error('Unknown encoding: ' + encoding);
      }
    }

    // StringDecoder provides an interface for efficiently splitting a series of
    // buffers into a series of JS strings without breaking apart multi-byte
    // characters. CESU-8 is handled as part of the UTF-8 encoding.
    //
    // @TODO Handling all encodings inside a single object makes it very difficult
    // to reason about this code, so it should be split up in the future.
    // @TODO There should be a utf8-strict encoding that rejects invalid UTF-8 code
    // points as used by CESU-8.
    function StringDecoder(encoding) {
      this.encoding = (encoding || 'utf8').toLowerCase().replace(/[-_]/, '');
      assertEncoding(encoding);
      switch (this.encoding) {
        case 'utf8':
          // CESU-8 represents each of Surrogate Pair by 3-bytes
          this.surrogateSize = 3;
          break;
        case 'ucs2':
        case 'utf16le':
          // UTF-16 represents each of Surrogate Pair by 2-bytes
          this.surrogateSize = 2;
          this.detectIncompleteChar = utf16DetectIncompleteChar;
          break;
        case 'base64':
          // Base-64 stores 3 bytes in 4 chars, and pads the remainder.
          this.surrogateSize = 3;
          this.detectIncompleteChar = base64DetectIncompleteChar;
          break;
        default:
          this.write = passThroughWrite;
          return;
      }

      // Enough space to store all bytes of a single character. UTF-8 needs 4
      // bytes, but CESU-8 may require up to 6 (3 bytes per surrogate).
      this.charBuffer = new Buffer$1(6);
      // Number of bytes received for the current incomplete multi-byte character.
      this.charReceived = 0;
      // Number of bytes expected for the current incomplete multi-byte character.
      this.charLength = 0;
    }

    // write decodes the given buffer and returns it as JS string that is
    // guaranteed to not contain any partial multi-byte characters. Any partial
    // character found at the end of the buffer is buffered up, and will be
    // returned when calling write again with the remaining bytes.
    //
    // Note: Converting a Buffer containing an orphan surrogate to a String
    // currently works, but converting a String to a Buffer (via `new Buffer`, or
    // Buffer#write) will replace incomplete surrogates with the unicode
    // replacement character. See https://codereview.chromium.org/121173009/ .
    StringDecoder.prototype.write = function(buffer) {
      var charStr = '';
      // if our last write ended with an incomplete multibyte character
      while (this.charLength) {
        // determine how many remaining bytes this buffer has to offer for this char
        var available = (buffer.length >= this.charLength - this.charReceived) ?
            this.charLength - this.charReceived :
            buffer.length;

        // add the new bytes to the char buffer
        buffer.copy(this.charBuffer, this.charReceived, 0, available);
        this.charReceived += available;

        if (this.charReceived < this.charLength) {
          // still not enough chars in this buffer? wait for more ...
          return '';
        }

        // remove bytes belonging to the current character from the buffer
        buffer = buffer.slice(available, buffer.length);

        // get the character that was split
        charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);

        // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
        var charCode = charStr.charCodeAt(charStr.length - 1);
        if (charCode >= 0xD800 && charCode <= 0xDBFF) {
          this.charLength += this.surrogateSize;
          charStr = '';
          continue;
        }
        this.charReceived = this.charLength = 0;

        // if there are no more bytes in this buffer, just emit our char
        if (buffer.length === 0) {
          return charStr;
        }
        break;
      }

      // determine and set charLength / charReceived
      this.detectIncompleteChar(buffer);

      var end = buffer.length;
      if (this.charLength) {
        // buffer the incomplete character bytes we got
        buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
        end -= this.charReceived;
      }

      charStr += buffer.toString(this.encoding, 0, end);

      var end = charStr.length - 1;
      var charCode = charStr.charCodeAt(end);
      // CESU-8: lead surrogate (D800-DBFF) is also the incomplete character
      if (charCode >= 0xD800 && charCode <= 0xDBFF) {
        var size = this.surrogateSize;
        this.charLength += size;
        this.charReceived += size;
        this.charBuffer.copy(this.charBuffer, size, 0, size);
        buffer.copy(this.charBuffer, 0, 0, size);
        return charStr.substring(0, end);
      }

      // or just emit the charStr
      return charStr;
    };

    // detectIncompleteChar determines if there is an incomplete UTF-8 character at
    // the end of the given buffer. If so, it sets this.charLength to the byte
    // length that character, and sets this.charReceived to the number of bytes
    // that are available for this character.
    StringDecoder.prototype.detectIncompleteChar = function(buffer) {
      // determine how many bytes we have to check at the end of this buffer
      var i = (buffer.length >= 3) ? 3 : buffer.length;

      // Figure out if one of the last i bytes of our buffer announces an
      // incomplete char.
      for (; i > 0; i--) {
        var c = buffer[buffer.length - i];

        // See http://en.wikipedia.org/wiki/UTF-8#Description

        // 110XXXXX
        if (i == 1 && c >> 5 == 0x06) {
          this.charLength = 2;
          break;
        }

        // 1110XXXX
        if (i <= 2 && c >> 4 == 0x0E) {
          this.charLength = 3;
          break;
        }

        // 11110XXX
        if (i <= 3 && c >> 3 == 0x1E) {
          this.charLength = 4;
          break;
        }
      }
      this.charReceived = i;
    };

    StringDecoder.prototype.end = function(buffer) {
      var res = '';
      if (buffer && buffer.length)
        res = this.write(buffer);

      if (this.charReceived) {
        var cr = this.charReceived;
        var buf = this.charBuffer;
        var enc = this.encoding;
        res += buf.slice(0, cr).toString(enc);
      }

      return res;
    };

    function passThroughWrite(buffer) {
      return buffer.toString(this.encoding);
    }

    function utf16DetectIncompleteChar(buffer) {
      this.charReceived = buffer.length % 2;
      this.charLength = this.charReceived ? 2 : 0;
    }

    function base64DetectIncompleteChar(buffer) {
      this.charReceived = buffer.length % 3;
      this.charLength = this.charReceived ? 3 : 0;
    }

    Readable.ReadableState = ReadableState;

    var debug = debuglog('stream');
    inherits$1(Readable, EventEmitter);

    function prependListener(emitter, event, fn) {
      // Sadly this is not cacheable as some libraries bundle their own
      // event emitter implementation with them.
      if (typeof emitter.prependListener === 'function') {
        return emitter.prependListener(event, fn);
      } else {
        // This is a hack to make sure that our error handler is attached before any
        // userland ones.  NEVER DO THIS. This is here only because this code needs
        // to continue to work with older versions of Node.js that do not include
        // the prependListener() method. The goal is to eventually remove this hack.
        if (!emitter._events || !emitter._events[event])
          emitter.on(event, fn);
        else if (Array.isArray(emitter._events[event]))
          emitter._events[event].unshift(fn);
        else
          emitter._events[event] = [fn, emitter._events[event]];
      }
    }
    function listenerCount$1 (emitter, type) {
      return emitter.listeners(type).length;
    }
    function ReadableState(options, stream) {

      options = options || {};

      // object stream flag. Used to make read(n) ignore n and to
      // make all the buffer merging and length checks go away
      this.objectMode = !!options.objectMode;

      if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

      // the point at which it stops calling _read() to fill the buffer
      // Note: 0 is a valid value, means "don't call _read preemptively ever"
      var hwm = options.highWaterMark;
      var defaultHwm = this.objectMode ? 16 : 16 * 1024;
      this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

      // cast to ints.
      this.highWaterMark = ~ ~this.highWaterMark;

      // A linked list is used to store data chunks instead of an array because the
      // linked list can remove elements from the beginning faster than
      // array.shift()
      this.buffer = new BufferList();
      this.length = 0;
      this.pipes = null;
      this.pipesCount = 0;
      this.flowing = null;
      this.ended = false;
      this.endEmitted = false;
      this.reading = false;

      // a flag to be able to tell if the onwrite cb is called immediately,
      // or on a later tick.  We set this to true at first, because any
      // actions that shouldn't happen until "later" should generally also
      // not happen before the first write call.
      this.sync = true;

      // whenever we return null, then we set a flag to say
      // that we're awaiting a 'readable' event emission.
      this.needReadable = false;
      this.emittedReadable = false;
      this.readableListening = false;
      this.resumeScheduled = false;

      // Crypto is kind of old and crusty.  Historically, its default string
      // encoding is 'binary' so we have to make this configurable.
      // Everything else in the universe uses 'utf8', though.
      this.defaultEncoding = options.defaultEncoding || 'utf8';

      // when piping, we only care about 'readable' events that happen
      // after read()ing all the bytes and not getting any pushback.
      this.ranOut = false;

      // the number of writers that are awaiting a drain event in .pipe()s
      this.awaitDrain = 0;

      // if true, a maybeReadMore has been scheduled
      this.readingMore = false;

      this.decoder = null;
      this.encoding = null;
      if (options.encoding) {
        this.decoder = new StringDecoder(options.encoding);
        this.encoding = options.encoding;
      }
    }
    function Readable(options) {

      if (!(this instanceof Readable)) return new Readable(options);

      this._readableState = new ReadableState(options, this);

      // legacy
      this.readable = true;

      if (options && typeof options.read === 'function') this._read = options.read;

      EventEmitter.call(this);
    }

    // Manually shove something into the read() buffer.
    // This returns true if the highWaterMark has not been hit yet,
    // similar to how Writable.write() returns true if you should
    // write() some more.
    Readable.prototype.push = function (chunk, encoding) {
      var state = this._readableState;

      if (!state.objectMode && typeof chunk === 'string') {
        encoding = encoding || state.defaultEncoding;
        if (encoding !== state.encoding) {
          chunk = Buffer.from(chunk, encoding);
          encoding = '';
        }
      }

      return readableAddChunk(this, state, chunk, encoding, false);
    };

    // Unshift should *always* be something directly out of read()
    Readable.prototype.unshift = function (chunk) {
      var state = this._readableState;
      return readableAddChunk(this, state, chunk, '', true);
    };

    Readable.prototype.isPaused = function () {
      return this._readableState.flowing === false;
    };

    function readableAddChunk(stream, state, chunk, encoding, addToFront) {
      var er = chunkInvalid(state, chunk);
      if (er) {
        stream.emit('error', er);
      } else if (chunk === null) {
        state.reading = false;
        onEofChunk(stream, state);
      } else if (state.objectMode || chunk && chunk.length > 0) {
        if (state.ended && !addToFront) {
          var e = new Error('stream.push() after EOF');
          stream.emit('error', e);
        } else if (state.endEmitted && addToFront) {
          var _e = new Error('stream.unshift() after end event');
          stream.emit('error', _e);
        } else {
          var skipAdd;
          if (state.decoder && !addToFront && !encoding) {
            chunk = state.decoder.write(chunk);
            skipAdd = !state.objectMode && chunk.length === 0;
          }

          if (!addToFront) state.reading = false;

          // Don't add to the buffer if we've decoded to an empty string chunk and
          // we're not in object mode
          if (!skipAdd) {
            // if we want the data now, just emit it.
            if (state.flowing && state.length === 0 && !state.sync) {
              stream.emit('data', chunk);
              stream.read(0);
            } else {
              // update the buffer info.
              state.length += state.objectMode ? 1 : chunk.length;
              if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

              if (state.needReadable) emitReadable(stream);
            }
          }

          maybeReadMore(stream, state);
        }
      } else if (!addToFront) {
        state.reading = false;
      }

      return needMoreData(state);
    }

    // if it's past the high water mark, we can push in some more.
    // Also, if we have no data yet, we can stand some
    // more bytes.  This is to work around cases where hwm=0,
    // such as the repl.  Also, if the push() triggered a
    // readable event, and the user called read(largeNumber) such that
    // needReadable was set, then we ought to push more, so that another
    // 'readable' event will be triggered.
    function needMoreData(state) {
      return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
    }

    // backwards compatibility.
    Readable.prototype.setEncoding = function (enc) {
      this._readableState.decoder = new StringDecoder(enc);
      this._readableState.encoding = enc;
      return this;
    };

    // Don't raise the hwm > 8MB
    var MAX_HWM = 0x800000;
    function computeNewHighWaterMark(n) {
      if (n >= MAX_HWM) {
        n = MAX_HWM;
      } else {
        // Get the next highest power of 2 to prevent increasing hwm excessively in
        // tiny amounts
        n--;
        n |= n >>> 1;
        n |= n >>> 2;
        n |= n >>> 4;
        n |= n >>> 8;
        n |= n >>> 16;
        n++;
      }
      return n;
    }

    // This function is designed to be inlinable, so please take care when making
    // changes to the function body.
    function howMuchToRead(n, state) {
      if (n <= 0 || state.length === 0 && state.ended) return 0;
      if (state.objectMode) return 1;
      if (n !== n) {
        // Only flow one buffer at a time
        if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
      }
      // If we're asking for more than the current hwm, then raise the hwm.
      if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
      if (n <= state.length) return n;
      // Don't have enough
      if (!state.ended) {
        state.needReadable = true;
        return 0;
      }
      return state.length;
    }

    // you can override either this method, or the async _read(n) below.
    Readable.prototype.read = function (n) {
      debug('read', n);
      n = parseInt(n, 10);
      var state = this._readableState;
      var nOrig = n;

      if (n !== 0) state.emittedReadable = false;

      // if we're doing read(0) to trigger a readable event, but we
      // already have a bunch of data in the buffer, then just trigger
      // the 'readable' event and move on.
      if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
        debug('read: emitReadable', state.length, state.ended);
        if (state.length === 0 && state.ended) endReadable(this);else emitReadable(this);
        return null;
      }

      n = howMuchToRead(n, state);

      // if we've ended, and we're now clear, then finish it up.
      if (n === 0 && state.ended) {
        if (state.length === 0) endReadable(this);
        return null;
      }

      // All the actual chunk generation logic needs to be
      // *below* the call to _read.  The reason is that in certain
      // synthetic stream cases, such as passthrough streams, _read
      // may be a completely synchronous operation which may change
      // the state of the read buffer, providing enough data when
      // before there was *not* enough.
      //
      // So, the steps are:
      // 1. Figure out what the state of things will be after we do
      // a read from the buffer.
      //
      // 2. If that resulting state will trigger a _read, then call _read.
      // Note that this may be asynchronous, or synchronous.  Yes, it is
      // deeply ugly to write APIs this way, but that still doesn't mean
      // that the Readable class should behave improperly, as streams are
      // designed to be sync/async agnostic.
      // Take note if the _read call is sync or async (ie, if the read call
      // has returned yet), so that we know whether or not it's safe to emit
      // 'readable' etc.
      //
      // 3. Actually pull the requested chunks out of the buffer and return.

      // if we need a readable event, then we need to do some reading.
      var doRead = state.needReadable;
      debug('need readable', doRead);

      // if we currently have less than the highWaterMark, then also read some
      if (state.length === 0 || state.length - n < state.highWaterMark) {
        doRead = true;
        debug('length less than watermark', doRead);
      }

      // however, if we've ended, then there's no point, and if we're already
      // reading, then it's unnecessary.
      if (state.ended || state.reading) {
        doRead = false;
        debug('reading or ended', doRead);
      } else if (doRead) {
        debug('do read');
        state.reading = true;
        state.sync = true;
        // if the length is currently zero, then we *need* a readable event.
        if (state.length === 0) state.needReadable = true;
        // call internal read method
        this._read(state.highWaterMark);
        state.sync = false;
        // If _read pushed data synchronously, then `reading` will be false,
        // and we need to re-evaluate how much data we can return to the user.
        if (!state.reading) n = howMuchToRead(nOrig, state);
      }

      var ret;
      if (n > 0) ret = fromList(n, state);else ret = null;

      if (ret === null) {
        state.needReadable = true;
        n = 0;
      } else {
        state.length -= n;
      }

      if (state.length === 0) {
        // If we have nothing in the buffer, then we want to know
        // as soon as we *do* get something into the buffer.
        if (!state.ended) state.needReadable = true;

        // If we tried to read() past the EOF, then emit end on the next tick.
        if (nOrig !== n && state.ended) endReadable(this);
      }

      if (ret !== null) this.emit('data', ret);

      return ret;
    };

    function chunkInvalid(state, chunk) {
      var er = null;
      if (!Buffer.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== null && chunk !== undefined && !state.objectMode) {
        er = new TypeError('Invalid non-string/buffer chunk');
      }
      return er;
    }

    function onEofChunk(stream, state) {
      if (state.ended) return;
      if (state.decoder) {
        var chunk = state.decoder.end();
        if (chunk && chunk.length) {
          state.buffer.push(chunk);
          state.length += state.objectMode ? 1 : chunk.length;
        }
      }
      state.ended = true;

      // emit 'readable' now to make sure it gets picked up.
      emitReadable(stream);
    }

    // Don't emit readable right away in sync mode, because this can trigger
    // another read() call => stack overflow.  This way, it might trigger
    // a nextTick recursion warning, but that's not so bad.
    function emitReadable(stream) {
      var state = stream._readableState;
      state.needReadable = false;
      if (!state.emittedReadable) {
        debug('emitReadable', state.flowing);
        state.emittedReadable = true;
        if (state.sync) nextTick(emitReadable_, stream);else emitReadable_(stream);
      }
    }

    function emitReadable_(stream) {
      debug('emit readable');
      stream.emit('readable');
      flow(stream);
    }

    // at this point, the user has presumably seen the 'readable' event,
    // and called read() to consume some data.  that may have triggered
    // in turn another _read(n) call, in which case reading = true if
    // it's in progress.
    // However, if we're not ended, or reading, and the length < hwm,
    // then go ahead and try to read some more preemptively.
    function maybeReadMore(stream, state) {
      if (!state.readingMore) {
        state.readingMore = true;
        nextTick(maybeReadMore_, stream, state);
      }
    }

    function maybeReadMore_(stream, state) {
      var len = state.length;
      while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
        debug('maybeReadMore read 0');
        stream.read(0);
        if (len === state.length)
          // didn't get any data, stop spinning.
          break;else len = state.length;
      }
      state.readingMore = false;
    }

    // abstract method.  to be overridden in specific implementation classes.
    // call cb(er, data) where data is <= n in length.
    // for virtual (non-string, non-buffer) streams, "length" is somewhat
    // arbitrary, and perhaps not very meaningful.
    Readable.prototype._read = function (n) {
      this.emit('error', new Error('not implemented'));
    };

    Readable.prototype.pipe = function (dest, pipeOpts) {
      var src = this;
      var state = this._readableState;

      switch (state.pipesCount) {
        case 0:
          state.pipes = dest;
          break;
        case 1:
          state.pipes = [state.pipes, dest];
          break;
        default:
          state.pipes.push(dest);
          break;
      }
      state.pipesCount += 1;
      debug('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

      var doEnd = (!pipeOpts || pipeOpts.end !== false);

      var endFn = doEnd ? onend : cleanup;
      if (state.endEmitted) nextTick(endFn);else src.once('end', endFn);

      dest.on('unpipe', onunpipe);
      function onunpipe(readable) {
        debug('onunpipe');
        if (readable === src) {
          cleanup();
        }
      }

      function onend() {
        debug('onend');
        dest.end();
      }

      // when the dest drains, it reduces the awaitDrain counter
      // on the source.  This would be more elegant with a .once()
      // handler in flow(), but adding and removing repeatedly is
      // too slow.
      var ondrain = pipeOnDrain(src);
      dest.on('drain', ondrain);

      var cleanedUp = false;
      function cleanup() {
        debug('cleanup');
        // cleanup event handlers once the pipe is broken
        dest.removeListener('close', onclose);
        dest.removeListener('finish', onfinish);
        dest.removeListener('drain', ondrain);
        dest.removeListener('error', onerror);
        dest.removeListener('unpipe', onunpipe);
        src.removeListener('end', onend);
        src.removeListener('end', cleanup);
        src.removeListener('data', ondata);

        cleanedUp = true;

        // if the reader is waiting for a drain event from this
        // specific writer, then it would cause it to never start
        // flowing again.
        // So, if this is awaiting a drain, then we just call it now.
        // If we don't know, then assume that we are waiting for one.
        if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
      }

      // If the user pushes more data while we're writing to dest then we'll end up
      // in ondata again. However, we only want to increase awaitDrain once because
      // dest will only emit one 'drain' event for the multiple writes.
      // => Introduce a guard on increasing awaitDrain.
      var increasedAwaitDrain = false;
      src.on('data', ondata);
      function ondata(chunk) {
        debug('ondata');
        increasedAwaitDrain = false;
        var ret = dest.write(chunk);
        if (false === ret && !increasedAwaitDrain) {
          // If the user unpiped during `dest.write()`, it is possible
          // to get stuck in a permanently paused state if that write
          // also returned false.
          // => Check whether `dest` is still a piping destination.
          if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
            debug('false write response, pause', src._readableState.awaitDrain);
            src._readableState.awaitDrain++;
            increasedAwaitDrain = true;
          }
          src.pause();
        }
      }

      // if the dest has an error, then stop piping into it.
      // however, don't suppress the throwing behavior for this.
      function onerror(er) {
        debug('onerror', er);
        unpipe();
        dest.removeListener('error', onerror);
        if (listenerCount$1(dest, 'error') === 0) dest.emit('error', er);
      }

      // Make sure our error handler is attached before userland ones.
      prependListener(dest, 'error', onerror);

      // Both close and finish should trigger unpipe, but only once.
      function onclose() {
        dest.removeListener('finish', onfinish);
        unpipe();
      }
      dest.once('close', onclose);
      function onfinish() {
        debug('onfinish');
        dest.removeListener('close', onclose);
        unpipe();
      }
      dest.once('finish', onfinish);

      function unpipe() {
        debug('unpipe');
        src.unpipe(dest);
      }

      // tell the dest that it's being piped to
      dest.emit('pipe', src);

      // start the flow if it hasn't been started already.
      if (!state.flowing) {
        debug('pipe resume');
        src.resume();
      }

      return dest;
    };

    function pipeOnDrain(src) {
      return function () {
        var state = src._readableState;
        debug('pipeOnDrain', state.awaitDrain);
        if (state.awaitDrain) state.awaitDrain--;
        if (state.awaitDrain === 0 && src.listeners('data').length) {
          state.flowing = true;
          flow(src);
        }
      };
    }

    Readable.prototype.unpipe = function (dest) {
      var state = this._readableState;

      // if we're not piping anywhere, then do nothing.
      if (state.pipesCount === 0) return this;

      // just one destination.  most common case.
      if (state.pipesCount === 1) {
        // passed in one, but it's not the right one.
        if (dest && dest !== state.pipes) return this;

        if (!dest) dest = state.pipes;

        // got a match.
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;
        if (dest) dest.emit('unpipe', this);
        return this;
      }

      // slow case. multiple pipe destinations.

      if (!dest) {
        // remove all.
        var dests = state.pipes;
        var len = state.pipesCount;
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;

        for (var _i = 0; _i < len; _i++) {
          dests[_i].emit('unpipe', this);
        }return this;
      }

      // try to find the right one.
      var i = indexOf(state.pipes, dest);
      if (i === -1) return this;

      state.pipes.splice(i, 1);
      state.pipesCount -= 1;
      if (state.pipesCount === 1) state.pipes = state.pipes[0];

      dest.emit('unpipe', this);

      return this;
    };

    // set up data events if they are asked for
    // Ensure readable listeners eventually get something
    Readable.prototype.on = function (ev, fn) {
      var res = EventEmitter.prototype.on.call(this, ev, fn);

      if (ev === 'data') {
        // Start flowing on next tick if stream isn't explicitly paused
        if (this._readableState.flowing !== false) this.resume();
      } else if (ev === 'readable') {
        var state = this._readableState;
        if (!state.endEmitted && !state.readableListening) {
          state.readableListening = state.needReadable = true;
          state.emittedReadable = false;
          if (!state.reading) {
            nextTick(nReadingNextTick, this);
          } else if (state.length) {
            emitReadable(this, state);
          }
        }
      }

      return res;
    };
    Readable.prototype.addListener = Readable.prototype.on;

    function nReadingNextTick(self) {
      debug('readable nexttick read 0');
      self.read(0);
    }

    // pause() and resume() are remnants of the legacy readable stream API
    // If the user uses them, then switch into old mode.
    Readable.prototype.resume = function () {
      var state = this._readableState;
      if (!state.flowing) {
        debug('resume');
        state.flowing = true;
        resume(this, state);
      }
      return this;
    };

    function resume(stream, state) {
      if (!state.resumeScheduled) {
        state.resumeScheduled = true;
        nextTick(resume_, stream, state);
      }
    }

    function resume_(stream, state) {
      if (!state.reading) {
        debug('resume read 0');
        stream.read(0);
      }

      state.resumeScheduled = false;
      state.awaitDrain = 0;
      stream.emit('resume');
      flow(stream);
      if (state.flowing && !state.reading) stream.read(0);
    }

    Readable.prototype.pause = function () {
      debug('call pause flowing=%j', this._readableState.flowing);
      if (false !== this._readableState.flowing) {
        debug('pause');
        this._readableState.flowing = false;
        this.emit('pause');
      }
      return this;
    };

    function flow(stream) {
      var state = stream._readableState;
      debug('flow', state.flowing);
      while (state.flowing && stream.read() !== null) {}
    }

    // wrap an old-style stream as the async data source.
    // This is *not* part of the readable stream interface.
    // It is an ugly unfortunate mess of history.
    Readable.prototype.wrap = function (stream) {
      var state = this._readableState;
      var paused = false;

      var self = this;
      stream.on('end', function () {
        debug('wrapped end');
        if (state.decoder && !state.ended) {
          var chunk = state.decoder.end();
          if (chunk && chunk.length) self.push(chunk);
        }

        self.push(null);
      });

      stream.on('data', function (chunk) {
        debug('wrapped data');
        if (state.decoder) chunk = state.decoder.write(chunk);

        // don't skip over falsy values in objectMode
        if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

        var ret = self.push(chunk);
        if (!ret) {
          paused = true;
          stream.pause();
        }
      });

      // proxy all the other methods.
      // important when wrapping filters and duplexes.
      for (var i in stream) {
        if (this[i] === undefined && typeof stream[i] === 'function') {
          this[i] = function (method) {
            return function () {
              return stream[method].apply(stream, arguments);
            };
          }(i);
        }
      }

      // proxy certain important events.
      var events = ['error', 'close', 'destroy', 'pause', 'resume'];
      forEach(events, function (ev) {
        stream.on(ev, self.emit.bind(self, ev));
      });

      // when we try to consume some more bytes, simply unpause the
      // underlying stream.
      self._read = function (n) {
        debug('wrapped _read', n);
        if (paused) {
          paused = false;
          stream.resume();
        }
      };

      return self;
    };

    // exposed for testing purposes only.
    Readable._fromList = fromList;

    // Pluck off n bytes from an array of buffers.
    // Length is the combined lengths of all the buffers in the list.
    // This function is designed to be inlinable, so please take care when making
    // changes to the function body.
    function fromList(n, state) {
      // nothing buffered
      if (state.length === 0) return null;

      var ret;
      if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
        // read it all, truncate the list
        if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
        state.buffer.clear();
      } else {
        // read part of list
        ret = fromListPartial(n, state.buffer, state.decoder);
      }

      return ret;
    }

    // Extracts only enough buffered data to satisfy the amount requested.
    // This function is designed to be inlinable, so please take care when making
    // changes to the function body.
    function fromListPartial(n, list, hasStrings) {
      var ret;
      if (n < list.head.data.length) {
        // slice is the same for buffers and strings
        ret = list.head.data.slice(0, n);
        list.head.data = list.head.data.slice(n);
      } else if (n === list.head.data.length) {
        // first chunk is a perfect match
        ret = list.shift();
      } else {
        // result spans more than one buffer
        ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
      }
      return ret;
    }

    // Copies a specified amount of characters from the list of buffered data
    // chunks.
    // This function is designed to be inlinable, so please take care when making
    // changes to the function body.
    function copyFromBufferString(n, list) {
      var p = list.head;
      var c = 1;
      var ret = p.data;
      n -= ret.length;
      while (p = p.next) {
        var str = p.data;
        var nb = n > str.length ? str.length : n;
        if (nb === str.length) ret += str;else ret += str.slice(0, n);
        n -= nb;
        if (n === 0) {
          if (nb === str.length) {
            ++c;
            if (p.next) list.head = p.next;else list.head = list.tail = null;
          } else {
            list.head = p;
            p.data = str.slice(nb);
          }
          break;
        }
        ++c;
      }
      list.length -= c;
      return ret;
    }

    // Copies a specified amount of bytes from the list of buffered data chunks.
    // This function is designed to be inlinable, so please take care when making
    // changes to the function body.
    function copyFromBuffer(n, list) {
      var ret = Buffer.allocUnsafe(n);
      var p = list.head;
      var c = 1;
      p.data.copy(ret);
      n -= p.data.length;
      while (p = p.next) {
        var buf = p.data;
        var nb = n > buf.length ? buf.length : n;
        buf.copy(ret, ret.length - n, 0, nb);
        n -= nb;
        if (n === 0) {
          if (nb === buf.length) {
            ++c;
            if (p.next) list.head = p.next;else list.head = list.tail = null;
          } else {
            list.head = p;
            p.data = buf.slice(nb);
          }
          break;
        }
        ++c;
      }
      list.length -= c;
      return ret;
    }

    function endReadable(stream) {
      var state = stream._readableState;

      // If we get here before consuming all the bytes, then that is a
      // bug in node.  Should never happen.
      if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

      if (!state.endEmitted) {
        state.ended = true;
        nextTick(endReadableNT, state, stream);
      }
    }

    function endReadableNT(state, stream) {
      // Check that we didn't get one last unshift.
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream.readable = false;
        stream.emit('end');
      }
    }

    function forEach(xs, f) {
      for (var i = 0, l = xs.length; i < l; i++) {
        f(xs[i], i);
      }
    }

    function indexOf(xs, x) {
      for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) return i;
      }
      return -1;
    }

    // A bit simpler than readable streams.
    Writable.WritableState = WritableState;
    inherits$1(Writable, EventEmitter);

    function nop() {}

    function WriteReq(chunk, encoding, cb) {
      this.chunk = chunk;
      this.encoding = encoding;
      this.callback = cb;
      this.next = null;
    }

    function WritableState(options, stream) {
      Object.defineProperty(this, 'buffer', {
        get: deprecate(function () {
          return this.getBuffer();
        }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.')
      });
      options = options || {};

      // object stream flag to indicate whether or not this stream
      // contains buffers or objects.
      this.objectMode = !!options.objectMode;

      if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

      // the point at which write() starts returning false
      // Note: 0 is a valid value, means that we always return false if
      // the entire buffer is not flushed immediately on write()
      var hwm = options.highWaterMark;
      var defaultHwm = this.objectMode ? 16 : 16 * 1024;
      this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;

      // cast to ints.
      this.highWaterMark = ~ ~this.highWaterMark;

      this.needDrain = false;
      // at the start of calling end()
      this.ending = false;
      // when end() has been called, and returned
      this.ended = false;
      // when 'finish' is emitted
      this.finished = false;

      // should we decode strings into buffers before passing to _write?
      // this is here so that some node-core streams can optimize string
      // handling at a lower level.
      var noDecode = options.decodeStrings === false;
      this.decodeStrings = !noDecode;

      // Crypto is kind of old and crusty.  Historically, its default string
      // encoding is 'binary' so we have to make this configurable.
      // Everything else in the universe uses 'utf8', though.
      this.defaultEncoding = options.defaultEncoding || 'utf8';

      // not an actual buffer we keep track of, but a measurement
      // of how much we're waiting to get pushed to some underlying
      // socket or file.
      this.length = 0;

      // a flag to see when we're in the middle of a write.
      this.writing = false;

      // when true all writes will be buffered until .uncork() call
      this.corked = 0;

      // a flag to be able to tell if the onwrite cb is called immediately,
      // or on a later tick.  We set this to true at first, because any
      // actions that shouldn't happen until "later" should generally also
      // not happen before the first write call.
      this.sync = true;

      // a flag to know if we're processing previously buffered items, which
      // may call the _write() callback in the same tick, so that we don't
      // end up in an overlapped onwrite situation.
      this.bufferProcessing = false;

      // the callback that's passed to _write(chunk,cb)
      this.onwrite = function (er) {
        onwrite(stream, er);
      };

      // the callback that the user supplies to write(chunk,encoding,cb)
      this.writecb = null;

      // the amount that is being written when _write is called.
      this.writelen = 0;

      this.bufferedRequest = null;
      this.lastBufferedRequest = null;

      // number of pending user-supplied write callbacks
      // this must be 0 before 'finish' can be emitted
      this.pendingcb = 0;

      // emit prefinish if the only thing we're waiting for is _write cbs
      // This is relevant for synchronous Transform streams
      this.prefinished = false;

      // True if the error was already emitted and should not be thrown again
      this.errorEmitted = false;

      // count buffered requests
      this.bufferedRequestCount = 0;

      // allocate the first CorkedRequest, there is always
      // one allocated and free to use, and we maintain at most two
      this.corkedRequestsFree = new CorkedRequest(this);
    }

    WritableState.prototype.getBuffer = function writableStateGetBuffer() {
      var current = this.bufferedRequest;
      var out = [];
      while (current) {
        out.push(current);
        current = current.next;
      }
      return out;
    };
    function Writable(options) {

      // Writable ctor is applied to Duplexes, though they're not
      // instanceof Writable, they're instanceof Readable.
      if (!(this instanceof Writable) && !(this instanceof Duplex)) return new Writable(options);

      this._writableState = new WritableState(options, this);

      // legacy.
      this.writable = true;

      if (options) {
        if (typeof options.write === 'function') this._write = options.write;

        if (typeof options.writev === 'function') this._writev = options.writev;
      }

      EventEmitter.call(this);
    }

    // Otherwise people can pipe Writable streams, which is just wrong.
    Writable.prototype.pipe = function () {
      this.emit('error', new Error('Cannot pipe, not readable'));
    };

    function writeAfterEnd(stream, cb) {
      var er = new Error('write after end');
      // TODO: defer error events consistently everywhere, not just the cb
      stream.emit('error', er);
      nextTick(cb, er);
    }

    // If we get something that is not a buffer, string, null, or undefined,
    // and we're not in objectMode, then that's an error.
    // Otherwise stream chunks are all considered to be of length=1, and the
    // watermarks determine how many objects to keep in the buffer, rather than
    // how many bytes or characters.
    function validChunk(stream, state, chunk, cb) {
      var valid = true;
      var er = false;
      // Always throw error if a null is written
      // if we are not in object mode then throw
      // if it is not a buffer, string, or undefined.
      if (chunk === null) {
        er = new TypeError('May not write null values to stream');
      } else if (!Buffer$1.isBuffer(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
        er = new TypeError('Invalid non-string/buffer chunk');
      }
      if (er) {
        stream.emit('error', er);
        nextTick(cb, er);
        valid = false;
      }
      return valid;
    }

    Writable.prototype.write = function (chunk, encoding, cb) {
      var state = this._writableState;
      var ret = false;

      if (typeof encoding === 'function') {
        cb = encoding;
        encoding = null;
      }

      if (Buffer$1.isBuffer(chunk)) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

      if (typeof cb !== 'function') cb = nop;

      if (state.ended) writeAfterEnd(this, cb);else if (validChunk(this, state, chunk, cb)) {
        state.pendingcb++;
        ret = writeOrBuffer(this, state, chunk, encoding, cb);
      }

      return ret;
    };

    Writable.prototype.cork = function () {
      var state = this._writableState;

      state.corked++;
    };

    Writable.prototype.uncork = function () {
      var state = this._writableState;

      if (state.corked) {
        state.corked--;

        if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
      }
    };

    Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
      // node::ParseEncoding() requires lower case.
      if (typeof encoding === 'string') encoding = encoding.toLowerCase();
      if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
      this._writableState.defaultEncoding = encoding;
      return this;
    };

    function decodeChunk(state, chunk, encoding) {
      if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
        chunk = Buffer$1.from(chunk, encoding);
      }
      return chunk;
    }

    // if we're already writing something, then just put this
    // in the queue, and wait our turn.  Otherwise, call _write
    // If we return false, then we need a drain event, so set that flag.
    function writeOrBuffer(stream, state, chunk, encoding, cb) {
      chunk = decodeChunk(state, chunk, encoding);

      if (Buffer$1.isBuffer(chunk)) encoding = 'buffer';
      var len = state.objectMode ? 1 : chunk.length;

      state.length += len;

      var ret = state.length < state.highWaterMark;
      // we must ensure that previous needDrain will not be reset to false.
      if (!ret) state.needDrain = true;

      if (state.writing || state.corked) {
        var last = state.lastBufferedRequest;
        state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
        if (last) {
          last.next = state.lastBufferedRequest;
        } else {
          state.bufferedRequest = state.lastBufferedRequest;
        }
        state.bufferedRequestCount += 1;
      } else {
        doWrite(stream, state, false, len, chunk, encoding, cb);
      }

      return ret;
    }

    function doWrite(stream, state, writev, len, chunk, encoding, cb) {
      state.writelen = len;
      state.writecb = cb;
      state.writing = true;
      state.sync = true;
      if (writev) stream._writev(chunk, state.onwrite);else stream._write(chunk, encoding, state.onwrite);
      state.sync = false;
    }

    function onwriteError(stream, state, sync, er, cb) {
      --state.pendingcb;
      if (sync) nextTick(cb, er);else cb(er);

      stream._writableState.errorEmitted = true;
      stream.emit('error', er);
    }

    function onwriteStateUpdate(state) {
      state.writing = false;
      state.writecb = null;
      state.length -= state.writelen;
      state.writelen = 0;
    }

    function onwrite(stream, er) {
      var state = stream._writableState;
      var sync = state.sync;
      var cb = state.writecb;

      onwriteStateUpdate(state);

      if (er) onwriteError(stream, state, sync, er, cb);else {
        // Check if we're actually ready to finish, but don't emit yet
        var finished = needFinish(state);

        if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
          clearBuffer(stream, state);
        }

        if (sync) {
          /*<replacement>*/
            nextTick(afterWrite, stream, state, finished, cb);
          /*</replacement>*/
        } else {
            afterWrite(stream, state, finished, cb);
          }
      }
    }

    function afterWrite(stream, state, finished, cb) {
      if (!finished) onwriteDrain(stream, state);
      state.pendingcb--;
      cb();
      finishMaybe(stream, state);
    }

    // Must force callback to be called on nextTick, so that we don't
    // emit 'drain' before the write() consumer gets the 'false' return
    // value, and has a chance to attach a 'drain' listener.
    function onwriteDrain(stream, state) {
      if (state.length === 0 && state.needDrain) {
        state.needDrain = false;
        stream.emit('drain');
      }
    }

    // if there's something in the buffer waiting, then process it
    function clearBuffer(stream, state) {
      state.bufferProcessing = true;
      var entry = state.bufferedRequest;

      if (stream._writev && entry && entry.next) {
        // Fast case, write everything using _writev()
        var l = state.bufferedRequestCount;
        var buffer = new Array(l);
        var holder = state.corkedRequestsFree;
        holder.entry = entry;

        var count = 0;
        while (entry) {
          buffer[count] = entry;
          entry = entry.next;
          count += 1;
        }

        doWrite(stream, state, true, state.length, buffer, '', holder.finish);

        // doWrite is almost always async, defer these to save a bit of time
        // as the hot path ends with doWrite
        state.pendingcb++;
        state.lastBufferedRequest = null;
        if (holder.next) {
          state.corkedRequestsFree = holder.next;
          holder.next = null;
        } else {
          state.corkedRequestsFree = new CorkedRequest(state);
        }
      } else {
        // Slow case, write chunks one-by-one
        while (entry) {
          var chunk = entry.chunk;
          var encoding = entry.encoding;
          var cb = entry.callback;
          var len = state.objectMode ? 1 : chunk.length;

          doWrite(stream, state, false, len, chunk, encoding, cb);
          entry = entry.next;
          // if we didn't call the onwrite immediately, then
          // it means that we need to wait until it does.
          // also, that means that the chunk and cb are currently
          // being processed, so move the buffer counter past them.
          if (state.writing) {
            break;
          }
        }

        if (entry === null) state.lastBufferedRequest = null;
      }

      state.bufferedRequestCount = 0;
      state.bufferedRequest = entry;
      state.bufferProcessing = false;
    }

    Writable.prototype._write = function (chunk, encoding, cb) {
      cb(new Error('not implemented'));
    };

    Writable.prototype._writev = null;

    Writable.prototype.end = function (chunk, encoding, cb) {
      var state = this._writableState;

      if (typeof chunk === 'function') {
        cb = chunk;
        chunk = null;
        encoding = null;
      } else if (typeof encoding === 'function') {
        cb = encoding;
        encoding = null;
      }

      if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

      // .end() fully uncorks
      if (state.corked) {
        state.corked = 1;
        this.uncork();
      }

      // ignore unnecessary end() calls.
      if (!state.ending && !state.finished) endWritable(this, state, cb);
    };

    function needFinish(state) {
      return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
    }

    function prefinish(stream, state) {
      if (!state.prefinished) {
        state.prefinished = true;
        stream.emit('prefinish');
      }
    }

    function finishMaybe(stream, state) {
      var need = needFinish(state);
      if (need) {
        if (state.pendingcb === 0) {
          prefinish(stream, state);
          state.finished = true;
          stream.emit('finish');
        } else {
          prefinish(stream, state);
        }
      }
      return need;
    }

    function endWritable(stream, state, cb) {
      state.ending = true;
      finishMaybe(stream, state);
      if (cb) {
        if (state.finished) nextTick(cb);else stream.once('finish', cb);
      }
      state.ended = true;
      stream.writable = false;
    }

    // It seems a linked list but it is not
    // there will be only 2 of these for each stream
    function CorkedRequest(state) {
      var _this = this;

      this.next = null;
      this.entry = null;

      this.finish = function (err) {
        var entry = _this.entry;
        _this.entry = null;
        while (entry) {
          var cb = entry.callback;
          state.pendingcb--;
          cb(err);
          entry = entry.next;
        }
        if (state.corkedRequestsFree) {
          state.corkedRequestsFree.next = _this;
        } else {
          state.corkedRequestsFree = _this;
        }
      };
    }

    inherits$1(Duplex, Readable);

    var keys = Object.keys(Writable.prototype);
    for (var v = 0; v < keys.length; v++) {
      var method = keys[v];
      if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
    }
    function Duplex(options) {
      if (!(this instanceof Duplex)) return new Duplex(options);

      Readable.call(this, options);
      Writable.call(this, options);

      if (options && options.readable === false) this.readable = false;

      if (options && options.writable === false) this.writable = false;

      this.allowHalfOpen = true;
      if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

      this.once('end', onend);
    }

    // the no-half-open enforcer
    function onend() {
      // if we allow half-open state, or if the writable side ended,
      // then we're ok.
      if (this.allowHalfOpen || this._writableState.ended) return;

      // no more data can be written.
      // But allow more writes to happen in this tick.
      nextTick(onEndNT, this);
    }

    function onEndNT(self) {
      self.end();
    }

    // a transform stream is a readable/writable stream where you do
    inherits$1(Transform, Duplex);

    function TransformState(stream) {
      this.afterTransform = function (er, data) {
        return afterTransform(stream, er, data);
      };

      this.needTransform = false;
      this.transforming = false;
      this.writecb = null;
      this.writechunk = null;
      this.writeencoding = null;
    }

    function afterTransform(stream, er, data) {
      var ts = stream._transformState;
      ts.transforming = false;

      var cb = ts.writecb;

      if (!cb) return stream.emit('error', new Error('no writecb in Transform class'));

      ts.writechunk = null;
      ts.writecb = null;

      if (data !== null && data !== undefined) stream.push(data);

      cb(er);

      var rs = stream._readableState;
      rs.reading = false;
      if (rs.needReadable || rs.length < rs.highWaterMark) {
        stream._read(rs.highWaterMark);
      }
    }
    function Transform(options) {
      if (!(this instanceof Transform)) return new Transform(options);

      Duplex.call(this, options);

      this._transformState = new TransformState(this);

      // when the writable side finishes, then flush out anything remaining.
      var stream = this;

      // start out asking for a readable event once data is transformed.
      this._readableState.needReadable = true;

      // we have implemented the _read method, and done the other things
      // that Readable wants before the first _read call, so unset the
      // sync guard flag.
      this._readableState.sync = false;

      if (options) {
        if (typeof options.transform === 'function') this._transform = options.transform;

        if (typeof options.flush === 'function') this._flush = options.flush;
      }

      this.once('prefinish', function () {
        if (typeof this._flush === 'function') this._flush(function (er) {
          done(stream, er);
        });else done(stream);
      });
    }

    Transform.prototype.push = function (chunk, encoding) {
      this._transformState.needTransform = false;
      return Duplex.prototype.push.call(this, chunk, encoding);
    };

    // This is the part where you do stuff!
    // override this function in implementation classes.
    // 'chunk' is an input chunk.
    //
    // Call `push(newChunk)` to pass along transformed output
    // to the readable side.  You may call 'push' zero or more times.
    //
    // Call `cb(err)` when you are done with this chunk.  If you pass
    // an error, then that'll put the hurt on the whole operation.  If you
    // never call cb(), then you'll never get another chunk.
    Transform.prototype._transform = function (chunk, encoding, cb) {
      throw new Error('Not implemented');
    };

    Transform.prototype._write = function (chunk, encoding, cb) {
      var ts = this._transformState;
      ts.writecb = cb;
      ts.writechunk = chunk;
      ts.writeencoding = encoding;
      if (!ts.transforming) {
        var rs = this._readableState;
        if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
      }
    };

    // Doesn't matter what the args are here.
    // _transform does all the work.
    // That we got here means that the readable side wants more data.
    Transform.prototype._read = function (n) {
      var ts = this._transformState;

      if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
        ts.transforming = true;
        this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
      } else {
        // mark that we need a transform, so that any data that comes in
        // will get processed, now that we've asked for it.
        ts.needTransform = true;
      }
    };

    function done(stream, er) {
      if (er) return stream.emit('error', er);

      // if there's nothing in the write buffer, then that means
      // that nothing more will ever be provided
      var ws = stream._writableState;
      var ts = stream._transformState;

      if (ws.length) throw new Error('Calling transform done when ws.length != 0');

      if (ts.transforming) throw new Error('Calling transform done when still transforming');

      return stream.push(null);
    }

    inherits$1(PassThrough, Transform);
    function PassThrough(options) {
      if (!(this instanceof PassThrough)) return new PassThrough(options);

      Transform.call(this, options);
    }

    PassThrough.prototype._transform = function (chunk, encoding, cb) {
      cb(null, chunk);
    };

    inherits$1(Stream, EventEmitter);
    Stream.Readable = Readable;
    Stream.Writable = Writable;
    Stream.Duplex = Duplex;
    Stream.Transform = Transform;
    Stream.PassThrough = PassThrough;

    // Backwards-compat with node 0.4.x
    Stream.Stream = Stream;

    // old-style streams.  Note that the pipe method (the only relevant
    // part of this class) is overridden in the Readable class.

    function Stream() {
      EventEmitter.call(this);
    }

    Stream.prototype.pipe = function(dest, options) {
      var source = this;

      function ondata(chunk) {
        if (dest.writable) {
          if (false === dest.write(chunk) && source.pause) {
            source.pause();
          }
        }
      }

      source.on('data', ondata);

      function ondrain() {
        if (source.readable && source.resume) {
          source.resume();
        }
      }

      dest.on('drain', ondrain);

      // If the 'end' option is not supplied, dest.end() will be called when
      // source gets the 'end' or 'close' events.  Only dest.end() once.
      if (!dest._isStdio && (!options || options.end !== false)) {
        source.on('end', onend);
        source.on('close', onclose);
      }

      var didOnEnd = false;
      function onend() {
        if (didOnEnd) return;
        didOnEnd = true;

        dest.end();
      }


      function onclose() {
        if (didOnEnd) return;
        didOnEnd = true;

        if (typeof dest.destroy === 'function') dest.destroy();
      }

      // don't leave dangling pipes when there are errors.
      function onerror(er) {
        cleanup();
        if (EventEmitter.listenerCount(this, 'error') === 0) {
          throw er; // Unhandled stream error in pipe.
        }
      }

      source.on('error', onerror);
      dest.on('error', onerror);

      // remove all the event listeners that were added.
      function cleanup() {
        source.removeListener('data', ondata);
        dest.removeListener('drain', ondrain);

        source.removeListener('end', onend);
        source.removeListener('close', onclose);

        source.removeListener('error', onerror);
        dest.removeListener('error', onerror);

        source.removeListener('end', cleanup);
        source.removeListener('close', cleanup);

        dest.removeListener('close', cleanup);
      }

      source.on('end', cleanup);
      source.on('close', cleanup);

      dest.on('close', cleanup);

      dest.emit('pipe', source);

      // Allow for unix-like usage: A.pipe(B).pipe(C)
      return dest;
    };

    var processNextickArgs = createCommonjsModule(function (module) {

    if (!process.version ||
        process.version.indexOf('v0.') === 0 ||
        process.version.indexOf('v1.') === 0 && process.version.indexOf('v1.8.') !== 0) {
      module.exports = { nextTick: nextTick };
    } else {
      module.exports = process;
    }

    function nextTick(fn, arg1, arg2, arg3) {
      if (typeof fn !== 'function') {
        throw new TypeError('"callback" argument must be a function');
      }
      var len = arguments.length;
      var args, i;
      switch (len) {
      case 0:
      case 1:
        return process.nextTick(fn);
      case 2:
        return process.nextTick(function afterTickOne() {
          fn.call(null, arg1);
        });
      case 3:
        return process.nextTick(function afterTickTwo() {
          fn.call(null, arg1, arg2);
        });
      case 4:
        return process.nextTick(function afterTickThree() {
          fn.call(null, arg1, arg2, arg3);
        });
      default:
        args = new Array(len - 1);
        i = 0;
        while (i < args.length) {
          args[i++] = arguments[i];
        }
        return process.nextTick(function afterTick() {
          fn.apply(null, args);
        });
      }
    }
    });
    var processNextickArgs_1 = processNextickArgs.nextTick;

    var toString$1 = {}.toString;

    var isarray = Array.isArray || function (arr) {
      return toString$1.call(arr) == '[object Array]';
    };

    var stream = Stream;

    var safeBuffer = createCommonjsModule(function (module, exports) {
    /* eslint-disable node/no-deprecated-api */

    var Buffer = bufferEs6.Buffer;

    // alternative to using Object.keys for old browsers
    function copyProps (src, dst) {
      for (var key in src) {
        dst[key] = src[key];
      }
    }
    if (Buffer.from && Buffer.alloc && Buffer.allocUnsafe && Buffer.allocUnsafeSlow) {
      module.exports = bufferEs6;
    } else {
      // Copy properties from require('buffer')
      copyProps(bufferEs6, exports);
      exports.Buffer = SafeBuffer;
    }

    function SafeBuffer (arg, encodingOrOffset, length) {
      return Buffer(arg, encodingOrOffset, length)
    }

    // Copy static methods from Buffer
    copyProps(Buffer, SafeBuffer);

    SafeBuffer.from = function (arg, encodingOrOffset, length) {
      if (typeof arg === 'number') {
        throw new TypeError('Argument must not be a number')
      }
      return Buffer(arg, encodingOrOffset, length)
    };

    SafeBuffer.alloc = function (size, fill, encoding) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number')
      }
      var buf = Buffer(size);
      if (fill !== undefined) {
        if (typeof encoding === 'string') {
          buf.fill(fill, encoding);
        } else {
          buf.fill(fill);
        }
      } else {
        buf.fill(0);
      }
      return buf
    };

    SafeBuffer.allocUnsafe = function (size) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number')
      }
      return Buffer(size)
    };

    SafeBuffer.allocUnsafeSlow = function (size) {
      if (typeof size !== 'number') {
        throw new TypeError('Argument must be a number')
      }
      return bufferEs6.SlowBuffer(size)
    };
    });
    var safeBuffer_1 = safeBuffer.Buffer;

    // Copyright Joyent, Inc. and other Node contributors.
    //
    // Permission is hereby granted, free of charge, to any person obtaining a
    // copy of this software and associated documentation files (the
    // "Software"), to deal in the Software without restriction, including
    // without limitation the rights to use, copy, modify, merge, publish,
    // distribute, sublicense, and/or sell copies of the Software, and to permit
    // persons to whom the Software is furnished to do so, subject to the
    // following conditions:
    //
    // The above copyright notice and this permission notice shall be included
    // in all copies or substantial portions of the Software.
    //
    // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
    // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
    // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
    // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
    // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
    // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
    // USE OR OTHER DEALINGS IN THE SOFTWARE.

    // NOTE: These type checking functions intentionally don't use `instanceof`
    // because it is fragile and can be easily faked with `Object.create()`.

    function isArray$2(arg) {
      if (Array.isArray) {
        return Array.isArray(arg);
      }
      return objectToString$1(arg) === '[object Array]';
    }
    var isArray_1 = isArray$2;

    function isBoolean$1(arg) {
      return typeof arg === 'boolean';
    }
    var isBoolean_1 = isBoolean$1;

    function isNull$1(arg) {
      return arg === null;
    }
    var isNull_1 = isNull$1;

    function isNullOrUndefined$1(arg) {
      return arg == null;
    }
    var isNullOrUndefined_1 = isNullOrUndefined$1;

    function isNumber$1(arg) {
      return typeof arg === 'number';
    }
    var isNumber_1 = isNumber$1;

    function isString$1(arg) {
      return typeof arg === 'string';
    }
    var isString_1 = isString$1;

    function isSymbol$1(arg) {
      return typeof arg === 'symbol';
    }
    var isSymbol_1 = isSymbol$1;

    function isUndefined$1(arg) {
      return arg === void 0;
    }
    var isUndefined_1 = isUndefined$1;

    function isRegExp$1(re) {
      return objectToString$1(re) === '[object RegExp]';
    }
    var isRegExp_1 = isRegExp$1;

    function isObject$1(arg) {
      return typeof arg === 'object' && arg !== null;
    }
    var isObject_1 = isObject$1;

    function isDate$1(d) {
      return objectToString$1(d) === '[object Date]';
    }
    var isDate_1 = isDate$1;

    function isError$1(e) {
      return (objectToString$1(e) === '[object Error]' || e instanceof Error);
    }
    var isError_1 = isError$1;

    function isFunction$1(arg) {
      return typeof arg === 'function';
    }
    var isFunction_1 = isFunction$1;

    function isPrimitive$1(arg) {
      return arg === null ||
             typeof arg === 'boolean' ||
             typeof arg === 'number' ||
             typeof arg === 'string' ||
             typeof arg === 'symbol' ||  // ES6 symbol
             typeof arg === 'undefined';
    }
    var isPrimitive_1 = isPrimitive$1;

    var isBuffer$2 = Buffer.isBuffer;

    function objectToString$1(o) {
      return Object.prototype.toString.call(o);
    }

    var util = {
    	isArray: isArray_1,
    	isBoolean: isBoolean_1,
    	isNull: isNull_1,
    	isNullOrUndefined: isNullOrUndefined_1,
    	isNumber: isNumber_1,
    	isString: isString_1,
    	isSymbol: isSymbol_1,
    	isUndefined: isUndefined_1,
    	isRegExp: isRegExp_1,
    	isObject: isObject_1,
    	isDate: isDate_1,
    	isError: isError_1,
    	isFunction: isFunction_1,
    	isPrimitive: isPrimitive_1,
    	isBuffer: isBuffer$2
    };

    var BufferList$1 = createCommonjsModule(function (module) {

    function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

    var Buffer = safeBuffer.Buffer;


    function copyBuffer(src, target, offset) {
      src.copy(target, offset);
    }

    module.exports = function () {
      function BufferList() {
        _classCallCheck(this, BufferList);

        this.head = null;
        this.tail = null;
        this.length = 0;
      }

      BufferList.prototype.push = function push(v) {
        var entry = { data: v, next: null };
        if (this.length > 0) this.tail.next = entry;else this.head = entry;
        this.tail = entry;
        ++this.length;
      };

      BufferList.prototype.unshift = function unshift(v) {
        var entry = { data: v, next: this.head };
        if (this.length === 0) this.tail = entry;
        this.head = entry;
        ++this.length;
      };

      BufferList.prototype.shift = function shift() {
        if (this.length === 0) return;
        var ret = this.head.data;
        if (this.length === 1) this.head = this.tail = null;else this.head = this.head.next;
        --this.length;
        return ret;
      };

      BufferList.prototype.clear = function clear() {
        this.head = this.tail = null;
        this.length = 0;
      };

      BufferList.prototype.join = function join(s) {
        if (this.length === 0) return '';
        var p = this.head;
        var ret = '' + p.data;
        while (p = p.next) {
          ret += s + p.data;
        }return ret;
      };

      BufferList.prototype.concat = function concat(n) {
        if (this.length === 0) return Buffer.alloc(0);
        if (this.length === 1) return this.head.data;
        var ret = Buffer.allocUnsafe(n >>> 0);
        var p = this.head;
        var i = 0;
        while (p) {
          copyBuffer(p.data, ret, i);
          i += p.data.length;
          p = p.next;
        }
        return ret;
      };

      return BufferList;
    }();

    if (require$$0 && require$$0.inspect && require$$0.inspect.custom) {
      module.exports.prototype[require$$0.inspect.custom] = function () {
        var obj = require$$0.inspect({ length: this.length });
        return this.constructor.name + ' ' + obj;
      };
    }
    });

    /*<replacement>*/


    /*</replacement>*/

    // undocumented cb() API, needed for core, not for public API
    function destroy(err, cb) {
      var _this = this;

      var readableDestroyed = this._readableState && this._readableState.destroyed;
      var writableDestroyed = this._writableState && this._writableState.destroyed;

      if (readableDestroyed || writableDestroyed) {
        if (cb) {
          cb(err);
        } else if (err && (!this._writableState || !this._writableState.errorEmitted)) {
          processNextickArgs.nextTick(emitErrorNT, this, err);
        }
        return this;
      }

      // we set destroyed to true before firing error callbacks in order
      // to make it re-entrance safe in case destroy() is called within callbacks

      if (this._readableState) {
        this._readableState.destroyed = true;
      }

      // if this is a duplex stream mark the writable part as destroyed as well
      if (this._writableState) {
        this._writableState.destroyed = true;
      }

      this._destroy(err || null, function (err) {
        if (!cb && err) {
          processNextickArgs.nextTick(emitErrorNT, _this, err);
          if (_this._writableState) {
            _this._writableState.errorEmitted = true;
          }
        } else if (cb) {
          cb(err);
        }
      });

      return this;
    }

    function undestroy() {
      if (this._readableState) {
        this._readableState.destroyed = false;
        this._readableState.reading = false;
        this._readableState.ended = false;
        this._readableState.endEmitted = false;
      }

      if (this._writableState) {
        this._writableState.destroyed = false;
        this._writableState.ended = false;
        this._writableState.ending = false;
        this._writableState.finished = false;
        this._writableState.errorEmitted = false;
      }
    }

    function emitErrorNT(self, err) {
      self.emit('error', err);
    }

    var destroy_1 = {
      destroy: destroy,
      undestroy: undestroy
    };

    /**
     * For Node.js, simply re-export the core `util.deprecate` function.
     */

    var node = require$$0.deprecate;

    /*<replacement>*/


    /*</replacement>*/

    var _stream_writable = Writable$1;

    // It seems a linked list but it is not
    // there will be only 2 of these for each stream
    function CorkedRequest$1(state) {
      var _this = this;

      this.next = null;
      this.entry = null;
      this.finish = function () {
        onCorkedFinish(_this, state);
      };
    }
    /* </replacement> */

    /*<replacement>*/
    var asyncWrite = !process.browser && ['v0.10', 'v0.9.'].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextickArgs.nextTick;
    /*</replacement>*/

    /*<replacement>*/
    var Duplex$1;
    /*</replacement>*/

    Writable$1.WritableState = WritableState$1;

    /*<replacement>*/

    util.inherits = inherits$3;
    /*</replacement>*/

    /*<replacement>*/
    var internalUtil = {
      deprecate: node
    };
    /*</replacement>*/

    /*<replacement>*/

    /*</replacement>*/

    /*<replacement>*/

    var Buffer$2 = safeBuffer.Buffer;
    var OurUint8Array = commonjsGlobal.Uint8Array || function () {};
    function _uint8ArrayToBuffer(chunk) {
      return Buffer$2.from(chunk);
    }
    function _isUint8Array(obj) {
      return Buffer$2.isBuffer(obj) || obj instanceof OurUint8Array;
    }

    /*</replacement>*/



    util.inherits(Writable$1, stream);

    function nop$1() {}

    function WritableState$1(options, stream$$1) {
      Duplex$1 = Duplex$1 || _stream_duplex;

      options = options || {};

      // Duplex streams are both readable and writable, but share
      // the same options object.
      // However, some cases require setting options to different
      // values for the readable and the writable sides of the duplex stream.
      // These options can be provided separately as readableXXX and writableXXX.
      var isDuplex = stream$$1 instanceof Duplex$1;

      // object stream flag to indicate whether or not this stream
      // contains buffers or objects.
      this.objectMode = !!options.objectMode;

      if (isDuplex) this.objectMode = this.objectMode || !!options.writableObjectMode;

      // the point at which write() starts returning false
      // Note: 0 is a valid value, means that we always return false if
      // the entire buffer is not flushed immediately on write()
      var hwm = options.highWaterMark;
      var writableHwm = options.writableHighWaterMark;
      var defaultHwm = this.objectMode ? 16 : 16 * 1024;

      if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (writableHwm || writableHwm === 0)) this.highWaterMark = writableHwm;else this.highWaterMark = defaultHwm;

      // cast to ints.
      this.highWaterMark = Math.floor(this.highWaterMark);

      // if _final has been called
      this.finalCalled = false;

      // drain event flag.
      this.needDrain = false;
      // at the start of calling end()
      this.ending = false;
      // when end() has been called, and returned
      this.ended = false;
      // when 'finish' is emitted
      this.finished = false;

      // has it been destroyed
      this.destroyed = false;

      // should we decode strings into buffers before passing to _write?
      // this is here so that some node-core streams can optimize string
      // handling at a lower level.
      var noDecode = options.decodeStrings === false;
      this.decodeStrings = !noDecode;

      // Crypto is kind of old and crusty.  Historically, its default string
      // encoding is 'binary' so we have to make this configurable.
      // Everything else in the universe uses 'utf8', though.
      this.defaultEncoding = options.defaultEncoding || 'utf8';

      // not an actual buffer we keep track of, but a measurement
      // of how much we're waiting to get pushed to some underlying
      // socket or file.
      this.length = 0;

      // a flag to see when we're in the middle of a write.
      this.writing = false;

      // when true all writes will be buffered until .uncork() call
      this.corked = 0;

      // a flag to be able to tell if the onwrite cb is called immediately,
      // or on a later tick.  We set this to true at first, because any
      // actions that shouldn't happen until "later" should generally also
      // not happen before the first write call.
      this.sync = true;

      // a flag to know if we're processing previously buffered items, which
      // may call the _write() callback in the same tick, so that we don't
      // end up in an overlapped onwrite situation.
      this.bufferProcessing = false;

      // the callback that's passed to _write(chunk,cb)
      this.onwrite = function (er) {
        onwrite$1(stream$$1, er);
      };

      // the callback that the user supplies to write(chunk,encoding,cb)
      this.writecb = null;

      // the amount that is being written when _write is called.
      this.writelen = 0;

      this.bufferedRequest = null;
      this.lastBufferedRequest = null;

      // number of pending user-supplied write callbacks
      // this must be 0 before 'finish' can be emitted
      this.pendingcb = 0;

      // emit prefinish if the only thing we're waiting for is _write cbs
      // This is relevant for synchronous Transform streams
      this.prefinished = false;

      // True if the error was already emitted and should not be thrown again
      this.errorEmitted = false;

      // count buffered requests
      this.bufferedRequestCount = 0;

      // allocate the first CorkedRequest, there is always
      // one allocated and free to use, and we maintain at most two
      this.corkedRequestsFree = new CorkedRequest$1(this);
    }

    WritableState$1.prototype.getBuffer = function getBuffer() {
      var current = this.bufferedRequest;
      var out = [];
      while (current) {
        out.push(current);
        current = current.next;
      }
      return out;
    };

    (function () {
      try {
        Object.defineProperty(WritableState$1.prototype, 'buffer', {
          get: internalUtil.deprecate(function () {
            return this.getBuffer();
          }, '_writableState.buffer is deprecated. Use _writableState.getBuffer ' + 'instead.', 'DEP0003')
        });
      } catch (_) {}
    })();

    // Test _writableState for inheritance to account for Duplex streams,
    // whose prototype chain only points to Readable.
    var realHasInstance;
    if (typeof Symbol === 'function' && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === 'function') {
      realHasInstance = Function.prototype[Symbol.hasInstance];
      Object.defineProperty(Writable$1, Symbol.hasInstance, {
        value: function (object) {
          if (realHasInstance.call(this, object)) return true;
          if (this !== Writable$1) return false;

          return object && object._writableState instanceof WritableState$1;
        }
      });
    } else {
      realHasInstance = function (object) {
        return object instanceof this;
      };
    }

    function Writable$1(options) {
      Duplex$1 = Duplex$1 || _stream_duplex;

      // Writable ctor is applied to Duplexes, too.
      // `realHasInstance` is necessary because using plain `instanceof`
      // would return false, as no `_writableState` property is attached.

      // Trying to use the custom `instanceof` for Writable here will also break the
      // Node.js LazyTransform implementation, which has a non-trivial getter for
      // `_writableState` that would lead to infinite recursion.
      if (!realHasInstance.call(Writable$1, this) && !(this instanceof Duplex$1)) {
        return new Writable$1(options);
      }

      this._writableState = new WritableState$1(options, this);

      // legacy.
      this.writable = true;

      if (options) {
        if (typeof options.write === 'function') this._write = options.write;

        if (typeof options.writev === 'function') this._writev = options.writev;

        if (typeof options.destroy === 'function') this._destroy = options.destroy;

        if (typeof options.final === 'function') this._final = options.final;
      }

      stream.call(this);
    }

    // Otherwise people can pipe Writable streams, which is just wrong.
    Writable$1.prototype.pipe = function () {
      this.emit('error', new Error('Cannot pipe, not readable'));
    };

    function writeAfterEnd$1(stream$$1, cb) {
      var er = new Error('write after end');
      // TODO: defer error events consistently everywhere, not just the cb
      stream$$1.emit('error', er);
      processNextickArgs.nextTick(cb, er);
    }

    // Checks that a user-supplied chunk is valid, especially for the particular
    // mode the stream is in. Currently this means that `null` is never accepted
    // and undefined/non-string values are only allowed in object mode.
    function validChunk$1(stream$$1, state, chunk, cb) {
      var valid = true;
      var er = false;

      if (chunk === null) {
        er = new TypeError('May not write null values to stream');
      } else if (typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
        er = new TypeError('Invalid non-string/buffer chunk');
      }
      if (er) {
        stream$$1.emit('error', er);
        processNextickArgs.nextTick(cb, er);
        valid = false;
      }
      return valid;
    }

    Writable$1.prototype.write = function (chunk, encoding, cb) {
      var state = this._writableState;
      var ret = false;
      var isBuf = !state.objectMode && _isUint8Array(chunk);

      if (isBuf && !Buffer$2.isBuffer(chunk)) {
        chunk = _uint8ArrayToBuffer(chunk);
      }

      if (typeof encoding === 'function') {
        cb = encoding;
        encoding = null;
      }

      if (isBuf) encoding = 'buffer';else if (!encoding) encoding = state.defaultEncoding;

      if (typeof cb !== 'function') cb = nop$1;

      if (state.ended) writeAfterEnd$1(this, cb);else if (isBuf || validChunk$1(this, state, chunk, cb)) {
        state.pendingcb++;
        ret = writeOrBuffer$1(this, state, isBuf, chunk, encoding, cb);
      }

      return ret;
    };

    Writable$1.prototype.cork = function () {
      var state = this._writableState;

      state.corked++;
    };

    Writable$1.prototype.uncork = function () {
      var state = this._writableState;

      if (state.corked) {
        state.corked--;

        if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer$1(this, state);
      }
    };

    Writable$1.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
      // node::ParseEncoding() requires lower case.
      if (typeof encoding === 'string') encoding = encoding.toLowerCase();
      if (!(['hex', 'utf8', 'utf-8', 'ascii', 'binary', 'base64', 'ucs2', 'ucs-2', 'utf16le', 'utf-16le', 'raw'].indexOf((encoding + '').toLowerCase()) > -1)) throw new TypeError('Unknown encoding: ' + encoding);
      this._writableState.defaultEncoding = encoding;
      return this;
    };

    function decodeChunk$1(state, chunk, encoding) {
      if (!state.objectMode && state.decodeStrings !== false && typeof chunk === 'string') {
        chunk = Buffer$2.from(chunk, encoding);
      }
      return chunk;
    }

    Object.defineProperty(Writable$1.prototype, 'writableHighWaterMark', {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function () {
        return this._writableState.highWaterMark;
      }
    });

    // if we're already writing something, then just put this
    // in the queue, and wait our turn.  Otherwise, call _write
    // If we return false, then we need a drain event, so set that flag.
    function writeOrBuffer$1(stream$$1, state, isBuf, chunk, encoding, cb) {
      if (!isBuf) {
        var newChunk = decodeChunk$1(state, chunk, encoding);
        if (chunk !== newChunk) {
          isBuf = true;
          encoding = 'buffer';
          chunk = newChunk;
        }
      }
      var len = state.objectMode ? 1 : chunk.length;

      state.length += len;

      var ret = state.length < state.highWaterMark;
      // we must ensure that previous needDrain will not be reset to false.
      if (!ret) state.needDrain = true;

      if (state.writing || state.corked) {
        var last = state.lastBufferedRequest;
        state.lastBufferedRequest = {
          chunk: chunk,
          encoding: encoding,
          isBuf: isBuf,
          callback: cb,
          next: null
        };
        if (last) {
          last.next = state.lastBufferedRequest;
        } else {
          state.bufferedRequest = state.lastBufferedRequest;
        }
        state.bufferedRequestCount += 1;
      } else {
        doWrite$1(stream$$1, state, false, len, chunk, encoding, cb);
      }

      return ret;
    }

    function doWrite$1(stream$$1, state, writev, len, chunk, encoding, cb) {
      state.writelen = len;
      state.writecb = cb;
      state.writing = true;
      state.sync = true;
      if (writev) stream$$1._writev(chunk, state.onwrite);else stream$$1._write(chunk, encoding, state.onwrite);
      state.sync = false;
    }

    function onwriteError$1(stream$$1, state, sync, er, cb) {
      --state.pendingcb;

      if (sync) {
        // defer the callback if we are being called synchronously
        // to avoid piling up things on the stack
        processNextickArgs.nextTick(cb, er);
        // this can emit finish, and it will always happen
        // after error
        processNextickArgs.nextTick(finishMaybe$1, stream$$1, state);
        stream$$1._writableState.errorEmitted = true;
        stream$$1.emit('error', er);
      } else {
        // the caller expect this to happen before if
        // it is async
        cb(er);
        stream$$1._writableState.errorEmitted = true;
        stream$$1.emit('error', er);
        // this can emit finish, but finish must
        // always follow error
        finishMaybe$1(stream$$1, state);
      }
    }

    function onwriteStateUpdate$1(state) {
      state.writing = false;
      state.writecb = null;
      state.length -= state.writelen;
      state.writelen = 0;
    }

    function onwrite$1(stream$$1, er) {
      var state = stream$$1._writableState;
      var sync = state.sync;
      var cb = state.writecb;

      onwriteStateUpdate$1(state);

      if (er) onwriteError$1(stream$$1, state, sync, er, cb);else {
        // Check if we're actually ready to finish, but don't emit yet
        var finished = needFinish$1(state);

        if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
          clearBuffer$1(stream$$1, state);
        }

        if (sync) {
          /*<replacement>*/
          asyncWrite(afterWrite$1, stream$$1, state, finished, cb);
          /*</replacement>*/
        } else {
          afterWrite$1(stream$$1, state, finished, cb);
        }
      }
    }

    function afterWrite$1(stream$$1, state, finished, cb) {
      if (!finished) onwriteDrain$1(stream$$1, state);
      state.pendingcb--;
      cb();
      finishMaybe$1(stream$$1, state);
    }

    // Must force callback to be called on nextTick, so that we don't
    // emit 'drain' before the write() consumer gets the 'false' return
    // value, and has a chance to attach a 'drain' listener.
    function onwriteDrain$1(stream$$1, state) {
      if (state.length === 0 && state.needDrain) {
        state.needDrain = false;
        stream$$1.emit('drain');
      }
    }

    // if there's something in the buffer waiting, then process it
    function clearBuffer$1(stream$$1, state) {
      state.bufferProcessing = true;
      var entry = state.bufferedRequest;

      if (stream$$1._writev && entry && entry.next) {
        // Fast case, write everything using _writev()
        var l = state.bufferedRequestCount;
        var buffer = new Array(l);
        var holder = state.corkedRequestsFree;
        holder.entry = entry;

        var count = 0;
        var allBuffers = true;
        while (entry) {
          buffer[count] = entry;
          if (!entry.isBuf) allBuffers = false;
          entry = entry.next;
          count += 1;
        }
        buffer.allBuffers = allBuffers;

        doWrite$1(stream$$1, state, true, state.length, buffer, '', holder.finish);

        // doWrite is almost always async, defer these to save a bit of time
        // as the hot path ends with doWrite
        state.pendingcb++;
        state.lastBufferedRequest = null;
        if (holder.next) {
          state.corkedRequestsFree = holder.next;
          holder.next = null;
        } else {
          state.corkedRequestsFree = new CorkedRequest$1(state);
        }
        state.bufferedRequestCount = 0;
      } else {
        // Slow case, write chunks one-by-one
        while (entry) {
          var chunk = entry.chunk;
          var encoding = entry.encoding;
          var cb = entry.callback;
          var len = state.objectMode ? 1 : chunk.length;

          doWrite$1(stream$$1, state, false, len, chunk, encoding, cb);
          entry = entry.next;
          state.bufferedRequestCount--;
          // if we didn't call the onwrite immediately, then
          // it means that we need to wait until it does.
          // also, that means that the chunk and cb are currently
          // being processed, so move the buffer counter past them.
          if (state.writing) {
            break;
          }
        }

        if (entry === null) state.lastBufferedRequest = null;
      }

      state.bufferedRequest = entry;
      state.bufferProcessing = false;
    }

    Writable$1.prototype._write = function (chunk, encoding, cb) {
      cb(new Error('_write() is not implemented'));
    };

    Writable$1.prototype._writev = null;

    Writable$1.prototype.end = function (chunk, encoding, cb) {
      var state = this._writableState;

      if (typeof chunk === 'function') {
        cb = chunk;
        chunk = null;
        encoding = null;
      } else if (typeof encoding === 'function') {
        cb = encoding;
        encoding = null;
      }

      if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);

      // .end() fully uncorks
      if (state.corked) {
        state.corked = 1;
        this.uncork();
      }

      // ignore unnecessary end() calls.
      if (!state.ending && !state.finished) endWritable$1(this, state, cb);
    };

    function needFinish$1(state) {
      return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
    }
    function callFinal(stream$$1, state) {
      stream$$1._final(function (err) {
        state.pendingcb--;
        if (err) {
          stream$$1.emit('error', err);
        }
        state.prefinished = true;
        stream$$1.emit('prefinish');
        finishMaybe$1(stream$$1, state);
      });
    }
    function prefinish$1(stream$$1, state) {
      if (!state.prefinished && !state.finalCalled) {
        if (typeof stream$$1._final === 'function') {
          state.pendingcb++;
          state.finalCalled = true;
          processNextickArgs.nextTick(callFinal, stream$$1, state);
        } else {
          state.prefinished = true;
          stream$$1.emit('prefinish');
        }
      }
    }

    function finishMaybe$1(stream$$1, state) {
      var need = needFinish$1(state);
      if (need) {
        prefinish$1(stream$$1, state);
        if (state.pendingcb === 0) {
          state.finished = true;
          stream$$1.emit('finish');
        }
      }
      return need;
    }

    function endWritable$1(stream$$1, state, cb) {
      state.ending = true;
      finishMaybe$1(stream$$1, state);
      if (cb) {
        if (state.finished) processNextickArgs.nextTick(cb);else stream$$1.once('finish', cb);
      }
      state.ended = true;
      stream$$1.writable = false;
    }

    function onCorkedFinish(corkReq, state, err) {
      var entry = corkReq.entry;
      corkReq.entry = null;
      while (entry) {
        var cb = entry.callback;
        state.pendingcb--;
        cb(err);
        entry = entry.next;
      }
      if (state.corkedRequestsFree) {
        state.corkedRequestsFree.next = corkReq;
      } else {
        state.corkedRequestsFree = corkReq;
      }
    }

    Object.defineProperty(Writable$1.prototype, 'destroyed', {
      get: function () {
        if (this._writableState === undefined) {
          return false;
        }
        return this._writableState.destroyed;
      },
      set: function (value) {
        // we ignore the value if the stream
        // has not been initialized yet
        if (!this._writableState) {
          return;
        }

        // backward compatibility, the user is explicitly
        // managing destroyed
        this._writableState.destroyed = value;
      }
    });

    Writable$1.prototype.destroy = destroy_1.destroy;
    Writable$1.prototype._undestroy = destroy_1.undestroy;
    Writable$1.prototype._destroy = function (err, cb) {
      this.end();
      cb(err);
    };

    /*<replacement>*/


    /*</replacement>*/

    /*<replacement>*/
    var objectKeys = Object.keys || function (obj) {
      var keys = [];
      for (var key in obj) {
        keys.push(key);
      }return keys;
    };
    /*</replacement>*/

    var _stream_duplex = Duplex$2;

    /*<replacement>*/

    util.inherits = inherits$3;
    /*</replacement>*/




    util.inherits(Duplex$2, _stream_readable);

    {
      // avoid scope creep, the keys array can then be collected
      var keys$1 = objectKeys(_stream_writable.prototype);
      for (var v$1 = 0; v$1 < keys$1.length; v$1++) {
        var method$1 = keys$1[v$1];
        if (!Duplex$2.prototype[method$1]) Duplex$2.prototype[method$1] = _stream_writable.prototype[method$1];
      }
    }

    function Duplex$2(options) {
      if (!(this instanceof Duplex$2)) return new Duplex$2(options);

      _stream_readable.call(this, options);
      _stream_writable.call(this, options);

      if (options && options.readable === false) this.readable = false;

      if (options && options.writable === false) this.writable = false;

      this.allowHalfOpen = true;
      if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;

      this.once('end', onend$1);
    }

    Object.defineProperty(Duplex$2.prototype, 'writableHighWaterMark', {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function () {
        return this._writableState.highWaterMark;
      }
    });

    // the no-half-open enforcer
    function onend$1() {
      // if we allow half-open state, or if the writable side ended,
      // then we're ok.
      if (this.allowHalfOpen || this._writableState.ended) return;

      // no more data can be written.
      // But allow more writes to happen in this tick.
      processNextickArgs.nextTick(onEndNT$1, this);
    }

    function onEndNT$1(self) {
      self.end();
    }

    Object.defineProperty(Duplex$2.prototype, 'destroyed', {
      get: function () {
        if (this._readableState === undefined || this._writableState === undefined) {
          return false;
        }
        return this._readableState.destroyed && this._writableState.destroyed;
      },
      set: function (value) {
        // we ignore the value if the stream
        // has not been initialized yet
        if (this._readableState === undefined || this._writableState === undefined) {
          return;
        }

        // backward compatibility, the user is explicitly
        // managing destroyed
        this._readableState.destroyed = value;
        this._writableState.destroyed = value;
      }
    });

    Duplex$2.prototype._destroy = function (err, cb) {
      this.push(null);
      this.end();

      processNextickArgs.nextTick(cb, err);
    };

    /*<replacement>*/

    var Buffer$3 = safeBuffer.Buffer;
    /*</replacement>*/

    var isEncoding = Buffer$3.isEncoding || function (encoding) {
      encoding = '' + encoding;
      switch (encoding && encoding.toLowerCase()) {
        case 'hex':case 'utf8':case 'utf-8':case 'ascii':case 'binary':case 'base64':case 'ucs2':case 'ucs-2':case 'utf16le':case 'utf-16le':case 'raw':
          return true;
        default:
          return false;
      }
    };

    function _normalizeEncoding(enc) {
      if (!enc) return 'utf8';
      var retried;
      while (true) {
        switch (enc) {
          case 'utf8':
          case 'utf-8':
            return 'utf8';
          case 'ucs2':
          case 'ucs-2':
          case 'utf16le':
          case 'utf-16le':
            return 'utf16le';
          case 'latin1':
          case 'binary':
            return 'latin1';
          case 'base64':
          case 'ascii':
          case 'hex':
            return enc;
          default:
            if (retried) return; // undefined
            enc = ('' + enc).toLowerCase();
            retried = true;
        }
      }
    }
    // Do not cache `Buffer.isEncoding` when checking encoding names as some
    // modules monkey-patch it to support additional encodings
    function normalizeEncoding(enc) {
      var nenc = _normalizeEncoding(enc);
      if (typeof nenc !== 'string' && (Buffer$3.isEncoding === isEncoding || !isEncoding(enc))) throw new Error('Unknown encoding: ' + enc);
      return nenc || enc;
    }

    // StringDecoder provides an interface for efficiently splitting a series of
    // buffers into a series of JS strings without breaking apart multi-byte
    // characters.
    var StringDecoder_1 = StringDecoder$1;
    function StringDecoder$1(encoding) {
      this.encoding = normalizeEncoding(encoding);
      var nb;
      switch (this.encoding) {
        case 'utf16le':
          this.text = utf16Text;
          this.end = utf16End;
          nb = 4;
          break;
        case 'utf8':
          this.fillLast = utf8FillLast;
          nb = 4;
          break;
        case 'base64':
          this.text = base64Text;
          this.end = base64End;
          nb = 3;
          break;
        default:
          this.write = simpleWrite;
          this.end = simpleEnd;
          return;
      }
      this.lastNeed = 0;
      this.lastTotal = 0;
      this.lastChar = Buffer$3.allocUnsafe(nb);
    }

    StringDecoder$1.prototype.write = function (buf) {
      if (buf.length === 0) return '';
      var r;
      var i;
      if (this.lastNeed) {
        r = this.fillLast(buf);
        if (r === undefined) return '';
        i = this.lastNeed;
        this.lastNeed = 0;
      } else {
        i = 0;
      }
      if (i < buf.length) return r ? r + this.text(buf, i) : this.text(buf, i);
      return r || '';
    };

    StringDecoder$1.prototype.end = utf8End;

    // Returns only complete characters in a Buffer
    StringDecoder$1.prototype.text = utf8Text;

    // Attempts to complete a partial non-UTF-8 character using bytes from a Buffer
    StringDecoder$1.prototype.fillLast = function (buf) {
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, this.lastTotal - this.lastNeed, 0, buf.length);
      this.lastNeed -= buf.length;
    };

    // Checks the type of a UTF-8 byte, whether it's ASCII, a leading byte, or a
    // continuation byte. If an invalid byte is detected, -2 is returned.
    function utf8CheckByte(byte) {
      if (byte <= 0x7F) return 0;else if (byte >> 5 === 0x06) return 2;else if (byte >> 4 === 0x0E) return 3;else if (byte >> 3 === 0x1E) return 4;
      return byte >> 6 === 0x02 ? -1 : -2;
    }

    // Checks at most 3 bytes at the end of a Buffer in order to detect an
    // incomplete multi-byte UTF-8 character. The total number of bytes (2, 3, or 4)
    // needed to complete the UTF-8 character (if applicable) are returned.
    function utf8CheckIncomplete(self, buf, i) {
      var j = buf.length - 1;
      if (j < i) return 0;
      var nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) self.lastNeed = nb - 1;
        return nb;
      }
      if (--j < i || nb === -2) return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) self.lastNeed = nb - 2;
        return nb;
      }
      if (--j < i || nb === -2) return 0;
      nb = utf8CheckByte(buf[j]);
      if (nb >= 0) {
        if (nb > 0) {
          if (nb === 2) nb = 0;else self.lastNeed = nb - 3;
        }
        return nb;
      }
      return 0;
    }

    // Validates as many continuation bytes for a multi-byte UTF-8 character as
    // needed or are available. If we see a non-continuation byte where we expect
    // one, we "replace" the validated continuation bytes we've seen so far with
    // a single UTF-8 replacement character ('\ufffd'), to match v8's UTF-8 decoding
    // behavior. The continuation byte check is included three times in the case
    // where all of the continuation bytes for a character exist in the same buffer.
    // It is also done this way as a slight performance increase instead of using a
    // loop.
    function utf8CheckExtraBytes(self, buf, p) {
      if ((buf[0] & 0xC0) !== 0x80) {
        self.lastNeed = 0;
        return '\ufffd';
      }
      if (self.lastNeed > 1 && buf.length > 1) {
        if ((buf[1] & 0xC0) !== 0x80) {
          self.lastNeed = 1;
          return '\ufffd';
        }
        if (self.lastNeed > 2 && buf.length > 2) {
          if ((buf[2] & 0xC0) !== 0x80) {
            self.lastNeed = 2;
            return '\ufffd';
          }
        }
      }
    }

    // Attempts to complete a multi-byte UTF-8 character using bytes from a Buffer.
    function utf8FillLast(buf) {
      var p = this.lastTotal - this.lastNeed;
      var r = utf8CheckExtraBytes(this, buf, p);
      if (r !== undefined) return r;
      if (this.lastNeed <= buf.length) {
        buf.copy(this.lastChar, p, 0, this.lastNeed);
        return this.lastChar.toString(this.encoding, 0, this.lastTotal);
      }
      buf.copy(this.lastChar, p, 0, buf.length);
      this.lastNeed -= buf.length;
    }

    // Returns all complete UTF-8 characters in a Buffer. If the Buffer ended on a
    // partial character, the character's bytes are buffered until the required
    // number of bytes are available.
    function utf8Text(buf, i) {
      var total = utf8CheckIncomplete(this, buf, i);
      if (!this.lastNeed) return buf.toString('utf8', i);
      this.lastTotal = total;
      var end = buf.length - (total - this.lastNeed);
      buf.copy(this.lastChar, 0, end);
      return buf.toString('utf8', i, end);
    }

    // For UTF-8, a replacement character is added when ending on a partial
    // character.
    function utf8End(buf) {
      var r = buf && buf.length ? this.write(buf) : '';
      if (this.lastNeed) return r + '\ufffd';
      return r;
    }

    // UTF-16LE typically needs two bytes per character, but even if we have an even
    // number of bytes available, we need to check if we end on a leading/high
    // surrogate. In that case, we need to wait for the next two bytes in order to
    // decode the last character properly.
    function utf16Text(buf, i) {
      if ((buf.length - i) % 2 === 0) {
        var r = buf.toString('utf16le', i);
        if (r) {
          var c = r.charCodeAt(r.length - 1);
          if (c >= 0xD800 && c <= 0xDBFF) {
            this.lastNeed = 2;
            this.lastTotal = 4;
            this.lastChar[0] = buf[buf.length - 2];
            this.lastChar[1] = buf[buf.length - 1];
            return r.slice(0, -1);
          }
        }
        return r;
      }
      this.lastNeed = 1;
      this.lastTotal = 2;
      this.lastChar[0] = buf[buf.length - 1];
      return buf.toString('utf16le', i, buf.length - 1);
    }

    // For UTF-16LE we do not explicitly append special replacement characters if we
    // end on a partial character, we simply let v8 handle that.
    function utf16End(buf) {
      var r = buf && buf.length ? this.write(buf) : '';
      if (this.lastNeed) {
        var end = this.lastTotal - this.lastNeed;
        return r + this.lastChar.toString('utf16le', 0, end);
      }
      return r;
    }

    function base64Text(buf, i) {
      var n = (buf.length - i) % 3;
      if (n === 0) return buf.toString('base64', i);
      this.lastNeed = 3 - n;
      this.lastTotal = 3;
      if (n === 1) {
        this.lastChar[0] = buf[buf.length - 1];
      } else {
        this.lastChar[0] = buf[buf.length - 2];
        this.lastChar[1] = buf[buf.length - 1];
      }
      return buf.toString('base64', i, buf.length - n);
    }

    function base64End(buf) {
      var r = buf && buf.length ? this.write(buf) : '';
      if (this.lastNeed) return r + this.lastChar.toString('base64', 0, 3 - this.lastNeed);
      return r;
    }

    // Pass bytes on through for single-byte encodings (e.g. ascii, latin1, hex)
    function simpleWrite(buf) {
      return buf.toString(this.encoding);
    }

    function simpleEnd(buf) {
      return buf && buf.length ? this.write(buf) : '';
    }

    var string_decoder = {
    	StringDecoder: StringDecoder_1
    };

    /*<replacement>*/


    /*</replacement>*/

    var _stream_readable = Readable$1;

    /*<replacement>*/

    /*</replacement>*/

    /*<replacement>*/
    var Duplex$3;
    /*</replacement>*/

    Readable$1.ReadableState = ReadableState$1;

    var EElistenerCount = function (emitter, type) {
      return emitter.listeners(type).length;
    };
    /*</replacement>*/

    /*<replacement>*/

    /*</replacement>*/

    /*<replacement>*/

    var Buffer$4 = safeBuffer.Buffer;
    var OurUint8Array$1 = commonjsGlobal.Uint8Array || function () {};
    function _uint8ArrayToBuffer$1(chunk) {
      return Buffer$4.from(chunk);
    }
    function _isUint8Array$1(obj) {
      return Buffer$4.isBuffer(obj) || obj instanceof OurUint8Array$1;
    }

    /*</replacement>*/

    /*<replacement>*/

    util.inherits = inherits$3;
    /*</replacement>*/

    /*<replacement>*/

    var debug$1 = void 0;
    if (require$$0 && require$$0.debuglog) {
      debug$1 = require$$0.debuglog('stream');
    } else {
      debug$1 = function () {};
    }
    /*</replacement>*/



    var StringDecoder$2;

    util.inherits(Readable$1, stream);

    var kProxyEvents = ['error', 'close', 'destroy', 'pause', 'resume'];

    function prependListener$1(emitter, event, fn) {
      // Sadly this is not cacheable as some libraries bundle their own
      // event emitter implementation with them.
      if (typeof emitter.prependListener === 'function') return emitter.prependListener(event, fn);

      // This is a hack to make sure that our error handler is attached before any
      // userland ones.  NEVER DO THIS. This is here only because this code needs
      // to continue to work with older versions of Node.js that do not include
      // the prependListener() method. The goal is to eventually remove this hack.
      if (!emitter._events || !emitter._events[event]) emitter.on(event, fn);else if (isarray(emitter._events[event])) emitter._events[event].unshift(fn);else emitter._events[event] = [fn, emitter._events[event]];
    }

    function ReadableState$1(options, stream$$1) {
      Duplex$3 = Duplex$3 || _stream_duplex;

      options = options || {};

      // Duplex streams are both readable and writable, but share
      // the same options object.
      // However, some cases require setting options to different
      // values for the readable and the writable sides of the duplex stream.
      // These options can be provided separately as readableXXX and writableXXX.
      var isDuplex = stream$$1 instanceof Duplex$3;

      // object stream flag. Used to make read(n) ignore n and to
      // make all the buffer merging and length checks go away
      this.objectMode = !!options.objectMode;

      if (isDuplex) this.objectMode = this.objectMode || !!options.readableObjectMode;

      // the point at which it stops calling _read() to fill the buffer
      // Note: 0 is a valid value, means "don't call _read preemptively ever"
      var hwm = options.highWaterMark;
      var readableHwm = options.readableHighWaterMark;
      var defaultHwm = this.objectMode ? 16 : 16 * 1024;

      if (hwm || hwm === 0) this.highWaterMark = hwm;else if (isDuplex && (readableHwm || readableHwm === 0)) this.highWaterMark = readableHwm;else this.highWaterMark = defaultHwm;

      // cast to ints.
      this.highWaterMark = Math.floor(this.highWaterMark);

      // A linked list is used to store data chunks instead of an array because the
      // linked list can remove elements from the beginning faster than
      // array.shift()
      this.buffer = new BufferList$1();
      this.length = 0;
      this.pipes = null;
      this.pipesCount = 0;
      this.flowing = null;
      this.ended = false;
      this.endEmitted = false;
      this.reading = false;

      // a flag to be able to tell if the event 'readable'/'data' is emitted
      // immediately, or on a later tick.  We set this to true at first, because
      // any actions that shouldn't happen until "later" should generally also
      // not happen before the first read call.
      this.sync = true;

      // whenever we return null, then we set a flag to say
      // that we're awaiting a 'readable' event emission.
      this.needReadable = false;
      this.emittedReadable = false;
      this.readableListening = false;
      this.resumeScheduled = false;

      // has it been destroyed
      this.destroyed = false;

      // Crypto is kind of old and crusty.  Historically, its default string
      // encoding is 'binary' so we have to make this configurable.
      // Everything else in the universe uses 'utf8', though.
      this.defaultEncoding = options.defaultEncoding || 'utf8';

      // the number of writers that are awaiting a drain event in .pipe()s
      this.awaitDrain = 0;

      // if true, a maybeReadMore has been scheduled
      this.readingMore = false;

      this.decoder = null;
      this.encoding = null;
      if (options.encoding) {
        if (!StringDecoder$2) StringDecoder$2 = string_decoder.StringDecoder;
        this.decoder = new StringDecoder$2(options.encoding);
        this.encoding = options.encoding;
      }
    }

    function Readable$1(options) {
      Duplex$3 = Duplex$3 || _stream_duplex;

      if (!(this instanceof Readable$1)) return new Readable$1(options);

      this._readableState = new ReadableState$1(options, this);

      // legacy
      this.readable = true;

      if (options) {
        if (typeof options.read === 'function') this._read = options.read;

        if (typeof options.destroy === 'function') this._destroy = options.destroy;
      }

      stream.call(this);
    }

    Object.defineProperty(Readable$1.prototype, 'destroyed', {
      get: function () {
        if (this._readableState === undefined) {
          return false;
        }
        return this._readableState.destroyed;
      },
      set: function (value) {
        // we ignore the value if the stream
        // has not been initialized yet
        if (!this._readableState) {
          return;
        }

        // backward compatibility, the user is explicitly
        // managing destroyed
        this._readableState.destroyed = value;
      }
    });

    Readable$1.prototype.destroy = destroy_1.destroy;
    Readable$1.prototype._undestroy = destroy_1.undestroy;
    Readable$1.prototype._destroy = function (err, cb) {
      this.push(null);
      cb(err);
    };

    // Manually shove something into the read() buffer.
    // This returns true if the highWaterMark has not been hit yet,
    // similar to how Writable.write() returns true if you should
    // write() some more.
    Readable$1.prototype.push = function (chunk, encoding) {
      var state = this._readableState;
      var skipChunkCheck;

      if (!state.objectMode) {
        if (typeof chunk === 'string') {
          encoding = encoding || state.defaultEncoding;
          if (encoding !== state.encoding) {
            chunk = Buffer$4.from(chunk, encoding);
            encoding = '';
          }
          skipChunkCheck = true;
        }
      } else {
        skipChunkCheck = true;
      }

      return readableAddChunk$1(this, chunk, encoding, false, skipChunkCheck);
    };

    // Unshift should *always* be something directly out of read()
    Readable$1.prototype.unshift = function (chunk) {
      return readableAddChunk$1(this, chunk, null, true, false);
    };

    function readableAddChunk$1(stream$$1, chunk, encoding, addToFront, skipChunkCheck) {
      var state = stream$$1._readableState;
      if (chunk === null) {
        state.reading = false;
        onEofChunk$1(stream$$1, state);
      } else {
        var er;
        if (!skipChunkCheck) er = chunkInvalid$1(state, chunk);
        if (er) {
          stream$$1.emit('error', er);
        } else if (state.objectMode || chunk && chunk.length > 0) {
          if (typeof chunk !== 'string' && !state.objectMode && Object.getPrototypeOf(chunk) !== Buffer$4.prototype) {
            chunk = _uint8ArrayToBuffer$1(chunk);
          }

          if (addToFront) {
            if (state.endEmitted) stream$$1.emit('error', new Error('stream.unshift() after end event'));else addChunk(stream$$1, state, chunk, true);
          } else if (state.ended) {
            stream$$1.emit('error', new Error('stream.push() after EOF'));
          } else {
            state.reading = false;
            if (state.decoder && !encoding) {
              chunk = state.decoder.write(chunk);
              if (state.objectMode || chunk.length !== 0) addChunk(stream$$1, state, chunk, false);else maybeReadMore$1(stream$$1, state);
            } else {
              addChunk(stream$$1, state, chunk, false);
            }
          }
        } else if (!addToFront) {
          state.reading = false;
        }
      }

      return needMoreData$1(state);
    }

    function addChunk(stream$$1, state, chunk, addToFront) {
      if (state.flowing && state.length === 0 && !state.sync) {
        stream$$1.emit('data', chunk);
        stream$$1.read(0);
      } else {
        // update the buffer info.
        state.length += state.objectMode ? 1 : chunk.length;
        if (addToFront) state.buffer.unshift(chunk);else state.buffer.push(chunk);

        if (state.needReadable) emitReadable$1(stream$$1);
      }
      maybeReadMore$1(stream$$1, state);
    }

    function chunkInvalid$1(state, chunk) {
      var er;
      if (!_isUint8Array$1(chunk) && typeof chunk !== 'string' && chunk !== undefined && !state.objectMode) {
        er = new TypeError('Invalid non-string/buffer chunk');
      }
      return er;
    }

    // if it's past the high water mark, we can push in some more.
    // Also, if we have no data yet, we can stand some
    // more bytes.  This is to work around cases where hwm=0,
    // such as the repl.  Also, if the push() triggered a
    // readable event, and the user called read(largeNumber) such that
    // needReadable was set, then we ought to push more, so that another
    // 'readable' event will be triggered.
    function needMoreData$1(state) {
      return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
    }

    Readable$1.prototype.isPaused = function () {
      return this._readableState.flowing === false;
    };

    // backwards compatibility.
    Readable$1.prototype.setEncoding = function (enc) {
      if (!StringDecoder$2) StringDecoder$2 = string_decoder.StringDecoder;
      this._readableState.decoder = new StringDecoder$2(enc);
      this._readableState.encoding = enc;
      return this;
    };

    // Don't raise the hwm > 8MB
    var MAX_HWM$1 = 0x800000;
    function computeNewHighWaterMark$1(n) {
      if (n >= MAX_HWM$1) {
        n = MAX_HWM$1;
      } else {
        // Get the next highest power of 2 to prevent increasing hwm excessively in
        // tiny amounts
        n--;
        n |= n >>> 1;
        n |= n >>> 2;
        n |= n >>> 4;
        n |= n >>> 8;
        n |= n >>> 16;
        n++;
      }
      return n;
    }

    // This function is designed to be inlinable, so please take care when making
    // changes to the function body.
    function howMuchToRead$1(n, state) {
      if (n <= 0 || state.length === 0 && state.ended) return 0;
      if (state.objectMode) return 1;
      if (n !== n) {
        // Only flow one buffer at a time
        if (state.flowing && state.length) return state.buffer.head.data.length;else return state.length;
      }
      // If we're asking for more than the current hwm, then raise the hwm.
      if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark$1(n);
      if (n <= state.length) return n;
      // Don't have enough
      if (!state.ended) {
        state.needReadable = true;
        return 0;
      }
      return state.length;
    }

    // you can override either this method, or the async _read(n) below.
    Readable$1.prototype.read = function (n) {
      debug$1('read', n);
      n = parseInt(n, 10);
      var state = this._readableState;
      var nOrig = n;

      if (n !== 0) state.emittedReadable = false;

      // if we're doing read(0) to trigger a readable event, but we
      // already have a bunch of data in the buffer, then just trigger
      // the 'readable' event and move on.
      if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
        debug$1('read: emitReadable', state.length, state.ended);
        if (state.length === 0 && state.ended) endReadable$1(this);else emitReadable$1(this);
        return null;
      }

      n = howMuchToRead$1(n, state);

      // if we've ended, and we're now clear, then finish it up.
      if (n === 0 && state.ended) {
        if (state.length === 0) endReadable$1(this);
        return null;
      }

      // All the actual chunk generation logic needs to be
      // *below* the call to _read.  The reason is that in certain
      // synthetic stream cases, such as passthrough streams, _read
      // may be a completely synchronous operation which may change
      // the state of the read buffer, providing enough data when
      // before there was *not* enough.
      //
      // So, the steps are:
      // 1. Figure out what the state of things will be after we do
      // a read from the buffer.
      //
      // 2. If that resulting state will trigger a _read, then call _read.
      // Note that this may be asynchronous, or synchronous.  Yes, it is
      // deeply ugly to write APIs this way, but that still doesn't mean
      // that the Readable class should behave improperly, as streams are
      // designed to be sync/async agnostic.
      // Take note if the _read call is sync or async (ie, if the read call
      // has returned yet), so that we know whether or not it's safe to emit
      // 'readable' etc.
      //
      // 3. Actually pull the requested chunks out of the buffer and return.

      // if we need a readable event, then we need to do some reading.
      var doRead = state.needReadable;
      debug$1('need readable', doRead);

      // if we currently have less than the highWaterMark, then also read some
      if (state.length === 0 || state.length - n < state.highWaterMark) {
        doRead = true;
        debug$1('length less than watermark', doRead);
      }

      // however, if we've ended, then there's no point, and if we're already
      // reading, then it's unnecessary.
      if (state.ended || state.reading) {
        doRead = false;
        debug$1('reading or ended', doRead);
      } else if (doRead) {
        debug$1('do read');
        state.reading = true;
        state.sync = true;
        // if the length is currently zero, then we *need* a readable event.
        if (state.length === 0) state.needReadable = true;
        // call internal read method
        this._read(state.highWaterMark);
        state.sync = false;
        // If _read pushed data synchronously, then `reading` will be false,
        // and we need to re-evaluate how much data we can return to the user.
        if (!state.reading) n = howMuchToRead$1(nOrig, state);
      }

      var ret;
      if (n > 0) ret = fromList$1(n, state);else ret = null;

      if (ret === null) {
        state.needReadable = true;
        n = 0;
      } else {
        state.length -= n;
      }

      if (state.length === 0) {
        // If we have nothing in the buffer, then we want to know
        // as soon as we *do* get something into the buffer.
        if (!state.ended) state.needReadable = true;

        // If we tried to read() past the EOF, then emit end on the next tick.
        if (nOrig !== n && state.ended) endReadable$1(this);
      }

      if (ret !== null) this.emit('data', ret);

      return ret;
    };

    function onEofChunk$1(stream$$1, state) {
      if (state.ended) return;
      if (state.decoder) {
        var chunk = state.decoder.end();
        if (chunk && chunk.length) {
          state.buffer.push(chunk);
          state.length += state.objectMode ? 1 : chunk.length;
        }
      }
      state.ended = true;

      // emit 'readable' now to make sure it gets picked up.
      emitReadable$1(stream$$1);
    }

    // Don't emit readable right away in sync mode, because this can trigger
    // another read() call => stack overflow.  This way, it might trigger
    // a nextTick recursion warning, but that's not so bad.
    function emitReadable$1(stream$$1) {
      var state = stream$$1._readableState;
      state.needReadable = false;
      if (!state.emittedReadable) {
        debug$1('emitReadable', state.flowing);
        state.emittedReadable = true;
        if (state.sync) processNextickArgs.nextTick(emitReadable_$1, stream$$1);else emitReadable_$1(stream$$1);
      }
    }

    function emitReadable_$1(stream$$1) {
      debug$1('emit readable');
      stream$$1.emit('readable');
      flow$1(stream$$1);
    }

    // at this point, the user has presumably seen the 'readable' event,
    // and called read() to consume some data.  that may have triggered
    // in turn another _read(n) call, in which case reading = true if
    // it's in progress.
    // However, if we're not ended, or reading, and the length < hwm,
    // then go ahead and try to read some more preemptively.
    function maybeReadMore$1(stream$$1, state) {
      if (!state.readingMore) {
        state.readingMore = true;
        processNextickArgs.nextTick(maybeReadMore_$1, stream$$1, state);
      }
    }

    function maybeReadMore_$1(stream$$1, state) {
      var len = state.length;
      while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
        debug$1('maybeReadMore read 0');
        stream$$1.read(0);
        if (len === state.length)
          // didn't get any data, stop spinning.
          break;else len = state.length;
      }
      state.readingMore = false;
    }

    // abstract method.  to be overridden in specific implementation classes.
    // call cb(er, data) where data is <= n in length.
    // for virtual (non-string, non-buffer) streams, "length" is somewhat
    // arbitrary, and perhaps not very meaningful.
    Readable$1.prototype._read = function (n) {
      this.emit('error', new Error('_read() is not implemented'));
    };

    Readable$1.prototype.pipe = function (dest, pipeOpts) {
      var src = this;
      var state = this._readableState;

      switch (state.pipesCount) {
        case 0:
          state.pipes = dest;
          break;
        case 1:
          state.pipes = [state.pipes, dest];
          break;
        default:
          state.pipes.push(dest);
          break;
      }
      state.pipesCount += 1;
      debug$1('pipe count=%d opts=%j', state.pipesCount, pipeOpts);

      var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;

      var endFn = doEnd ? onend : unpipe;
      if (state.endEmitted) processNextickArgs.nextTick(endFn);else src.once('end', endFn);

      dest.on('unpipe', onunpipe);
      function onunpipe(readable, unpipeInfo) {
        debug$1('onunpipe');
        if (readable === src) {
          if (unpipeInfo && unpipeInfo.hasUnpiped === false) {
            unpipeInfo.hasUnpiped = true;
            cleanup();
          }
        }
      }

      function onend() {
        debug$1('onend');
        dest.end();
      }

      // when the dest drains, it reduces the awaitDrain counter
      // on the source.  This would be more elegant with a .once()
      // handler in flow(), but adding and removing repeatedly is
      // too slow.
      var ondrain = pipeOnDrain$1(src);
      dest.on('drain', ondrain);

      var cleanedUp = false;
      function cleanup() {
        debug$1('cleanup');
        // cleanup event handlers once the pipe is broken
        dest.removeListener('close', onclose);
        dest.removeListener('finish', onfinish);
        dest.removeListener('drain', ondrain);
        dest.removeListener('error', onerror);
        dest.removeListener('unpipe', onunpipe);
        src.removeListener('end', onend);
        src.removeListener('end', unpipe);
        src.removeListener('data', ondata);

        cleanedUp = true;

        // if the reader is waiting for a drain event from this
        // specific writer, then it would cause it to never start
        // flowing again.
        // So, if this is awaiting a drain, then we just call it now.
        // If we don't know, then assume that we are waiting for one.
        if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
      }

      // If the user pushes more data while we're writing to dest then we'll end up
      // in ondata again. However, we only want to increase awaitDrain once because
      // dest will only emit one 'drain' event for the multiple writes.
      // => Introduce a guard on increasing awaitDrain.
      var increasedAwaitDrain = false;
      src.on('data', ondata);
      function ondata(chunk) {
        debug$1('ondata');
        increasedAwaitDrain = false;
        var ret = dest.write(chunk);
        if (false === ret && !increasedAwaitDrain) {
          // If the user unpiped during `dest.write()`, it is possible
          // to get stuck in a permanently paused state if that write
          // also returned false.
          // => Check whether `dest` is still a piping destination.
          if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf$1(state.pipes, dest) !== -1) && !cleanedUp) {
            debug$1('false write response, pause', src._readableState.awaitDrain);
            src._readableState.awaitDrain++;
            increasedAwaitDrain = true;
          }
          src.pause();
        }
      }

      // if the dest has an error, then stop piping into it.
      // however, don't suppress the throwing behavior for this.
      function onerror(er) {
        debug$1('onerror', er);
        unpipe();
        dest.removeListener('error', onerror);
        if (EElistenerCount(dest, 'error') === 0) dest.emit('error', er);
      }

      // Make sure our error handler is attached before userland ones.
      prependListener$1(dest, 'error', onerror);

      // Both close and finish should trigger unpipe, but only once.
      function onclose() {
        dest.removeListener('finish', onfinish);
        unpipe();
      }
      dest.once('close', onclose);
      function onfinish() {
        debug$1('onfinish');
        dest.removeListener('close', onclose);
        unpipe();
      }
      dest.once('finish', onfinish);

      function unpipe() {
        debug$1('unpipe');
        src.unpipe(dest);
      }

      // tell the dest that it's being piped to
      dest.emit('pipe', src);

      // start the flow if it hasn't been started already.
      if (!state.flowing) {
        debug$1('pipe resume');
        src.resume();
      }

      return dest;
    };

    function pipeOnDrain$1(src) {
      return function () {
        var state = src._readableState;
        debug$1('pipeOnDrain', state.awaitDrain);
        if (state.awaitDrain) state.awaitDrain--;
        if (state.awaitDrain === 0 && EElistenerCount(src, 'data')) {
          state.flowing = true;
          flow$1(src);
        }
      };
    }

    Readable$1.prototype.unpipe = function (dest) {
      var state = this._readableState;
      var unpipeInfo = { hasUnpiped: false };

      // if we're not piping anywhere, then do nothing.
      if (state.pipesCount === 0) return this;

      // just one destination.  most common case.
      if (state.pipesCount === 1) {
        // passed in one, but it's not the right one.
        if (dest && dest !== state.pipes) return this;

        if (!dest) dest = state.pipes;

        // got a match.
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;
        if (dest) dest.emit('unpipe', this, unpipeInfo);
        return this;
      }

      // slow case. multiple pipe destinations.

      if (!dest) {
        // remove all.
        var dests = state.pipes;
        var len = state.pipesCount;
        state.pipes = null;
        state.pipesCount = 0;
        state.flowing = false;

        for (var i = 0; i < len; i++) {
          dests[i].emit('unpipe', this, unpipeInfo);
        }return this;
      }

      // try to find the right one.
      var index = indexOf$1(state.pipes, dest);
      if (index === -1) return this;

      state.pipes.splice(index, 1);
      state.pipesCount -= 1;
      if (state.pipesCount === 1) state.pipes = state.pipes[0];

      dest.emit('unpipe', this, unpipeInfo);

      return this;
    };

    // set up data events if they are asked for
    // Ensure readable listeners eventually get something
    Readable$1.prototype.on = function (ev, fn) {
      var res = stream.prototype.on.call(this, ev, fn);

      if (ev === 'data') {
        // Start flowing on next tick if stream isn't explicitly paused
        if (this._readableState.flowing !== false) this.resume();
      } else if (ev === 'readable') {
        var state = this._readableState;
        if (!state.endEmitted && !state.readableListening) {
          state.readableListening = state.needReadable = true;
          state.emittedReadable = false;
          if (!state.reading) {
            processNextickArgs.nextTick(nReadingNextTick$1, this);
          } else if (state.length) {
            emitReadable$1(this);
          }
        }
      }

      return res;
    };
    Readable$1.prototype.addListener = Readable$1.prototype.on;

    function nReadingNextTick$1(self) {
      debug$1('readable nexttick read 0');
      self.read(0);
    }

    // pause() and resume() are remnants of the legacy readable stream API
    // If the user uses them, then switch into old mode.
    Readable$1.prototype.resume = function () {
      var state = this._readableState;
      if (!state.flowing) {
        debug$1('resume');
        state.flowing = true;
        resume$1(this, state);
      }
      return this;
    };

    function resume$1(stream$$1, state) {
      if (!state.resumeScheduled) {
        state.resumeScheduled = true;
        processNextickArgs.nextTick(resume_$1, stream$$1, state);
      }
    }

    function resume_$1(stream$$1, state) {
      if (!state.reading) {
        debug$1('resume read 0');
        stream$$1.read(0);
      }

      state.resumeScheduled = false;
      state.awaitDrain = 0;
      stream$$1.emit('resume');
      flow$1(stream$$1);
      if (state.flowing && !state.reading) stream$$1.read(0);
    }

    Readable$1.prototype.pause = function () {
      debug$1('call pause flowing=%j', this._readableState.flowing);
      if (false !== this._readableState.flowing) {
        debug$1('pause');
        this._readableState.flowing = false;
        this.emit('pause');
      }
      return this;
    };

    function flow$1(stream$$1) {
      var state = stream$$1._readableState;
      debug$1('flow', state.flowing);
      while (state.flowing && stream$$1.read() !== null) {}
    }

    // wrap an old-style stream as the async data source.
    // This is *not* part of the readable stream interface.
    // It is an ugly unfortunate mess of history.
    Readable$1.prototype.wrap = function (stream$$1) {
      var _this = this;

      var state = this._readableState;
      var paused = false;

      stream$$1.on('end', function () {
        debug$1('wrapped end');
        if (state.decoder && !state.ended) {
          var chunk = state.decoder.end();
          if (chunk && chunk.length) _this.push(chunk);
        }

        _this.push(null);
      });

      stream$$1.on('data', function (chunk) {
        debug$1('wrapped data');
        if (state.decoder) chunk = state.decoder.write(chunk);

        // don't skip over falsy values in objectMode
        if (state.objectMode && (chunk === null || chunk === undefined)) return;else if (!state.objectMode && (!chunk || !chunk.length)) return;

        var ret = _this.push(chunk);
        if (!ret) {
          paused = true;
          stream$$1.pause();
        }
      });

      // proxy all the other methods.
      // important when wrapping filters and duplexes.
      for (var i in stream$$1) {
        if (this[i] === undefined && typeof stream$$1[i] === 'function') {
          this[i] = function (method) {
            return function () {
              return stream$$1[method].apply(stream$$1, arguments);
            };
          }(i);
        }
      }

      // proxy certain important events.
      for (var n = 0; n < kProxyEvents.length; n++) {
        stream$$1.on(kProxyEvents[n], this.emit.bind(this, kProxyEvents[n]));
      }

      // when we try to consume some more bytes, simply unpause the
      // underlying stream.
      this._read = function (n) {
        debug$1('wrapped _read', n);
        if (paused) {
          paused = false;
          stream$$1.resume();
        }
      };

      return this;
    };

    Object.defineProperty(Readable$1.prototype, 'readableHighWaterMark', {
      // making it explicit this property is not enumerable
      // because otherwise some prototype manipulation in
      // userland will fail
      enumerable: false,
      get: function () {
        return this._readableState.highWaterMark;
      }
    });

    // exposed for testing purposes only.
    Readable$1._fromList = fromList$1;

    // Pluck off n bytes from an array of buffers.
    // Length is the combined lengths of all the buffers in the list.
    // This function is designed to be inlinable, so please take care when making
    // changes to the function body.
    function fromList$1(n, state) {
      // nothing buffered
      if (state.length === 0) return null;

      var ret;
      if (state.objectMode) ret = state.buffer.shift();else if (!n || n >= state.length) {
        // read it all, truncate the list
        if (state.decoder) ret = state.buffer.join('');else if (state.buffer.length === 1) ret = state.buffer.head.data;else ret = state.buffer.concat(state.length);
        state.buffer.clear();
      } else {
        // read part of list
        ret = fromListPartial$1(n, state.buffer, state.decoder);
      }

      return ret;
    }

    // Extracts only enough buffered data to satisfy the amount requested.
    // This function is designed to be inlinable, so please take care when making
    // changes to the function body.
    function fromListPartial$1(n, list, hasStrings) {
      var ret;
      if (n < list.head.data.length) {
        // slice is the same for buffers and strings
        ret = list.head.data.slice(0, n);
        list.head.data = list.head.data.slice(n);
      } else if (n === list.head.data.length) {
        // first chunk is a perfect match
        ret = list.shift();
      } else {
        // result spans more than one buffer
        ret = hasStrings ? copyFromBufferString$1(n, list) : copyFromBuffer$1(n, list);
      }
      return ret;
    }

    // Copies a specified amount of characters from the list of buffered data
    // chunks.
    // This function is designed to be inlinable, so please take care when making
    // changes to the function body.
    function copyFromBufferString$1(n, list) {
      var p = list.head;
      var c = 1;
      var ret = p.data;
      n -= ret.length;
      while (p = p.next) {
        var str = p.data;
        var nb = n > str.length ? str.length : n;
        if (nb === str.length) ret += str;else ret += str.slice(0, n);
        n -= nb;
        if (n === 0) {
          if (nb === str.length) {
            ++c;
            if (p.next) list.head = p.next;else list.head = list.tail = null;
          } else {
            list.head = p;
            p.data = str.slice(nb);
          }
          break;
        }
        ++c;
      }
      list.length -= c;
      return ret;
    }

    // Copies a specified amount of bytes from the list of buffered data chunks.
    // This function is designed to be inlinable, so please take care when making
    // changes to the function body.
    function copyFromBuffer$1(n, list) {
      var ret = Buffer$4.allocUnsafe(n);
      var p = list.head;
      var c = 1;
      p.data.copy(ret);
      n -= p.data.length;
      while (p = p.next) {
        var buf = p.data;
        var nb = n > buf.length ? buf.length : n;
        buf.copy(ret, ret.length - n, 0, nb);
        n -= nb;
        if (n === 0) {
          if (nb === buf.length) {
            ++c;
            if (p.next) list.head = p.next;else list.head = list.tail = null;
          } else {
            list.head = p;
            p.data = buf.slice(nb);
          }
          break;
        }
        ++c;
      }
      list.length -= c;
      return ret;
    }

    function endReadable$1(stream$$1) {
      var state = stream$$1._readableState;

      // If we get here before consuming all the bytes, then that is a
      // bug in node.  Should never happen.
      if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');

      if (!state.endEmitted) {
        state.ended = true;
        processNextickArgs.nextTick(endReadableNT$1, state, stream$$1);
      }
    }

    function endReadableNT$1(state, stream$$1) {
      // Check that we didn't get one last unshift.
      if (!state.endEmitted && state.length === 0) {
        state.endEmitted = true;
        stream$$1.readable = false;
        stream$$1.emit('end');
      }
    }

    function indexOf$1(xs, x) {
      for (var i = 0, l = xs.length; i < l; i++) {
        if (xs[i] === x) return i;
      }
      return -1;
    }

    var _stream_transform = Transform$1;



    /*<replacement>*/

    util.inherits = inherits$3;
    /*</replacement>*/

    util.inherits(Transform$1, _stream_duplex);

    function afterTransform$1(er, data) {
      var ts = this._transformState;
      ts.transforming = false;

      var cb = ts.writecb;

      if (!cb) {
        return this.emit('error', new Error('write callback called multiple times'));
      }

      ts.writechunk = null;
      ts.writecb = null;

      if (data != null) // single equals check for both `null` and `undefined`
        this.push(data);

      cb(er);

      var rs = this._readableState;
      rs.reading = false;
      if (rs.needReadable || rs.length < rs.highWaterMark) {
        this._read(rs.highWaterMark);
      }
    }

    function Transform$1(options) {
      if (!(this instanceof Transform$1)) return new Transform$1(options);

      _stream_duplex.call(this, options);

      this._transformState = {
        afterTransform: afterTransform$1.bind(this),
        needTransform: false,
        transforming: false,
        writecb: null,
        writechunk: null,
        writeencoding: null
      };

      // start out asking for a readable event once data is transformed.
      this._readableState.needReadable = true;

      // we have implemented the _read method, and done the other things
      // that Readable wants before the first _read call, so unset the
      // sync guard flag.
      this._readableState.sync = false;

      if (options) {
        if (typeof options.transform === 'function') this._transform = options.transform;

        if (typeof options.flush === 'function') this._flush = options.flush;
      }

      // When the writable side finishes, then flush out anything remaining.
      this.on('prefinish', prefinish$2);
    }

    function prefinish$2() {
      var _this = this;

      if (typeof this._flush === 'function') {
        this._flush(function (er, data) {
          done$1(_this, er, data);
        });
      } else {
        done$1(this, null, null);
      }
    }

    Transform$1.prototype.push = function (chunk, encoding) {
      this._transformState.needTransform = false;
      return _stream_duplex.prototype.push.call(this, chunk, encoding);
    };

    // This is the part where you do stuff!
    // override this function in implementation classes.
    // 'chunk' is an input chunk.
    //
    // Call `push(newChunk)` to pass along transformed output
    // to the readable side.  You may call 'push' zero or more times.
    //
    // Call `cb(err)` when you are done with this chunk.  If you pass
    // an error, then that'll put the hurt on the whole operation.  If you
    // never call cb(), then you'll never get another chunk.
    Transform$1.prototype._transform = function (chunk, encoding, cb) {
      throw new Error('_transform() is not implemented');
    };

    Transform$1.prototype._write = function (chunk, encoding, cb) {
      var ts = this._transformState;
      ts.writecb = cb;
      ts.writechunk = chunk;
      ts.writeencoding = encoding;
      if (!ts.transforming) {
        var rs = this._readableState;
        if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
      }
    };

    // Doesn't matter what the args are here.
    // _transform does all the work.
    // That we got here means that the readable side wants more data.
    Transform$1.prototype._read = function (n) {
      var ts = this._transformState;

      if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
        ts.transforming = true;
        this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
      } else {
        // mark that we need a transform, so that any data that comes in
        // will get processed, now that we've asked for it.
        ts.needTransform = true;
      }
    };

    Transform$1.prototype._destroy = function (err, cb) {
      var _this2 = this;

      _stream_duplex.prototype._destroy.call(this, err, function (err2) {
        cb(err2);
        _this2.emit('close');
      });
    };

    function done$1(stream, er, data) {
      if (er) return stream.emit('error', er);

      if (data != null) // single equals check for both `null` and `undefined`
        stream.push(data);

      // if there's nothing in the write buffer, then that means
      // that nothing more will ever be provided
      if (stream._writableState.length) throw new Error('Calling transform done when ws.length != 0');

      if (stream._transformState.transforming) throw new Error('Calling transform done when still transforming');

      return stream.push(null);
    }

    var _stream_passthrough = PassThrough$1;



    /*<replacement>*/

    util.inherits = inherits$3;
    /*</replacement>*/

    util.inherits(PassThrough$1, _stream_transform);

    function PassThrough$1(options) {
      if (!(this instanceof PassThrough$1)) return new PassThrough$1(options);

      _stream_transform.call(this, options);
    }

    PassThrough$1.prototype._transform = function (chunk, encoding, cb) {
      cb(null, chunk);
    };

    var readable = createCommonjsModule(function (module, exports) {
    if (process.env.READABLE_STREAM === 'disable' && Stream) {
      module.exports = Stream;
      exports = module.exports = Stream.Readable;
      exports.Readable = Stream.Readable;
      exports.Writable = Stream.Writable;
      exports.Duplex = Stream.Duplex;
      exports.Transform = Stream.Transform;
      exports.PassThrough = Stream.PassThrough;
      exports.Stream = Stream;
    } else {
      exports = module.exports = _stream_readable;
      exports.Stream = Stream || exports;
      exports.Readable = exports;
      exports.Writable = _stream_writable;
      exports.Duplex = _stream_duplex;
      exports.Transform = _stream_transform;
      exports.PassThrough = _stream_passthrough;
    }
    });
    var readable_1 = readable.Readable;
    var readable_2 = readable.Writable;
    var readable_3 = readable.Duplex;
    var readable_4 = readable.Transform;
    var readable_5 = readable.PassThrough;
    var readable_6 = readable.Stream;

    var Readable$2 = readable.Readable;


    var levelIteratorStream = ReadStream;
    inherits$3(ReadStream, Readable$2);

    function ReadStream (iterator, options) {
      if (!(this instanceof ReadStream)) return new ReadStream(iterator, options)
      options = options || {};
      Readable$2.call(this, immutable(options, {
        objectMode: true
      }));
      this._iterator = iterator;
      this._options = options;
      this.on('end', this.destroy.bind(this, null, null));
    }

    ReadStream.prototype._read = function () {
      var self = this;
      var options = this._options;
      if (this.destroyed) return

      this._iterator.next(function (err, key, value) {
        if (self.destroyed) return
        if (err) return self.destroy(err)

        if (key === undefined && value === undefined) {
          self.push(null);
        } else if (options.keys !== false && options.values === false) {
          self.push(key);
        } else if (options.keys === false && options.values !== false) {
          self.push(value);
        } else {
          self.push({ key: key, value: value });
        }
      });
    };

    ReadStream.prototype._destroy = function (err, callback) {
      var self = this;

      this._iterator.end(function (err2) {
        callback(err || err2);

        // TODO when the next readable-stream (mirroring node v10) is out:
        // remove this. Since nodejs/node#19836, streams always emit close.
        process.nextTick(function () {
          self.emit('close');
        });
      });
    };

    /* Copyright (c) 2012-2017 LevelUP contributors
     * See list at <https://github.com/rvagg/node-levelup#contributing>
     * MIT License
     * <https://github.com/rvagg/node-levelup/blob/master/LICENSE.md>
     */

    var createError$2 = errno.create;
    var LevelUPError$1 = createError$2('LevelUPError');
    var NotFoundError$1 = createError$2('NotFoundError', LevelUPError$1);

    NotFoundError$1.prototype.notFound = true;
    NotFoundError$1.prototype.status = 404;

    var errors$1 = {
      LevelUPError: LevelUPError$1,
      InitializationError: createError$2('InitializationError', LevelUPError$1),
      OpenError: createError$2('OpenError', LevelUPError$1),
      ReadError: createError$2('ReadError', LevelUPError$1),
      WriteError: createError$2('WriteError', LevelUPError$1),
      NotFoundError: NotFoundError$1,
      EncodingError: createError$2('EncodingError', LevelUPError$1)
    };

    function promisify () {
      var callback;
      var promise = new Promise(function (resolve, reject) {
        callback = function callback (err, value) {
          if (err) reject(err);
          else resolve(value);
        };
      });
      callback.promise = promise;
      return callback
    }

    var promisify_1 = promisify;

    var getCallback = function (options, callback) {
      return typeof options === 'function' ? options : callback
    };

    var getOptions = function (options) {
      return typeof options === 'object' && options !== null ? options : {}
    };

    var common = {
    	getCallback: getCallback,
    	getOptions: getOptions
    };

    var WriteError = errors$1.WriteError;

    var getCallback$1 = common.getCallback;
    var getOptions$1 = common.getOptions;

    function Batch$1 (levelup) {
      this._levelup = levelup;
      this.batch = levelup.db.batch();
      this.ops = [];
      this.length = 0;
    }

    Batch$1.prototype.put = function (key, value) {
      try {
        this.batch.put(key, value);
      } catch (e) {
        throw new WriteError(e)
      }

      this.ops.push({ type: 'put', key: key, value: value });
      this.length++;

      return this
    };

    Batch$1.prototype.del = function (key) {
      try {
        this.batch.del(key);
      } catch (err) {
        throw new WriteError(err)
      }

      this.ops.push({ type: 'del', key: key });
      this.length++;

      return this
    };

    Batch$1.prototype.clear = function () {
      try {
        this.batch.clear();
      } catch (err) {
        throw new WriteError(err)
      }

      this.ops = [];
      this.length = 0;

      return this
    };

    Batch$1.prototype.write = function (options, callback) {
      var levelup = this._levelup;
      var ops = this.ops;
      var promise;

      callback = getCallback$1(options, callback);

      if (!callback) {
        callback = promisify_1();
        promise = callback.promise;
      }

      options = getOptions$1(options);

      try {
        this.batch.write(options, function (err) {
          if (err) { return callback(new WriteError(err)) }
          levelup.emit('batch', ops);
          callback();
        });
      } catch (err) {
        throw new WriteError(err)
      }

      return promise
    };

    var batch = Batch$1;

    function compare(a, b) {
      if (a === b) {
        return 0;
      }

      var x = a.length;
      var y = b.length;

      for (var i = 0, len = Math.min(x, y); i < len; ++i) {
        if (a[i] !== b[i]) {
          x = a[i];
          y = b[i];
          break;
        }
      }

      if (x < y) {
        return -1;
      }
      if (y < x) {
        return 1;
      }
      return 0;
    }
    var hasOwn = Object.prototype.hasOwnProperty;

    var objectKeys$1 = Object.keys || function (obj) {
      var keys = [];
      for (var key in obj) {
        if (hasOwn.call(obj, key)) keys.push(key);
      }
      return keys;
    };
    var pSlice = Array.prototype.slice;
    var _functionsHaveNames;
    function functionsHaveNames() {
      if (typeof _functionsHaveNames !== 'undefined') {
        return _functionsHaveNames;
      }
      return _functionsHaveNames = (function () {
        return function foo() {}.name === 'foo';
      }());
    }
    function pToString (obj) {
      return Object.prototype.toString.call(obj);
    }
    function isView(arrbuf) {
      if (isBuffer$1(arrbuf)) {
        return false;
      }
      if (typeof global.ArrayBuffer !== 'function') {
        return false;
      }
      if (typeof ArrayBuffer.isView === 'function') {
        return ArrayBuffer.isView(arrbuf);
      }
      if (!arrbuf) {
        return false;
      }
      if (arrbuf instanceof DataView) {
        return true;
      }
      if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
        return true;
      }
      return false;
    }
    // 1. The assert module provides functions that throw
    // AssertionError's when particular conditions are not met. The
    // assert module must conform to the following interface.

    function assert(value, message) {
      if (!value) fail(value, true, message, '==', ok);
    }

    // 2. The AssertionError is defined in assert.
    // new assert.AssertionError({ message: message,
    //                             actual: actual,
    //                             expected: expected })

    var regex = /\s*function\s+([^\(\s]*)\s*/;
    // based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
    function getName(func) {
      if (!isFunction(func)) {
        return;
      }
      if (functionsHaveNames()) {
        return func.name;
      }
      var str = func.toString();
      var match = str.match(regex);
      return match && match[1];
    }
    assert.AssertionError = AssertionError;
    function AssertionError(options) {
      this.name = 'AssertionError';
      this.actual = options.actual;
      this.expected = options.expected;
      this.operator = options.operator;
      if (options.message) {
        this.message = options.message;
        this.generatedMessage = false;
      } else {
        this.message = getMessage(this);
        this.generatedMessage = true;
      }
      var stackStartFunction = options.stackStartFunction || fail;
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, stackStartFunction);
      } else {
        // non v8 browsers so we can have a stacktrace
        var err = new Error();
        if (err.stack) {
          var out = err.stack;

          // try to strip useless frames
          var fn_name = getName(stackStartFunction);
          var idx = out.indexOf('\n' + fn_name);
          if (idx >= 0) {
            // once we have located the function frame
            // we need to strip out everything before it (and its line)
            var next_line = out.indexOf('\n', idx + 1);
            out = out.substring(next_line + 1);
          }

          this.stack = out;
        }
      }
    }

    // assert.AssertionError instanceof Error
    inherits$1(AssertionError, Error);

    function truncate(s, n) {
      if (typeof s === 'string') {
        return s.length < n ? s : s.slice(0, n);
      } else {
        return s;
      }
    }
    function inspect$1(something) {
      if (functionsHaveNames() || !isFunction(something)) {
        return inspect(something);
      }
      var rawname = getName(something);
      var name = rawname ? ': ' + rawname : '';
      return '[Function' +  name + ']';
    }
    function getMessage(self) {
      return truncate(inspect$1(self.actual), 128) + ' ' +
             self.operator + ' ' +
             truncate(inspect$1(self.expected), 128);
    }

    // At present only the three keys mentioned above are used and
    // understood by the spec. Implementations or sub modules can pass
    // other keys to the AssertionError's constructor - they will be
    // ignored.

    // 3. All of the following functions must throw an AssertionError
    // when a corresponding condition is not met, with a message that
    // may be undefined if not provided.  All assertion methods provide
    // both the actual and expected values to the assertion error for
    // display purposes.

    function fail(actual, expected, message, operator, stackStartFunction) {
      throw new AssertionError({
        message: message,
        actual: actual,
        expected: expected,
        operator: operator,
        stackStartFunction: stackStartFunction
      });
    }

    // EXTENSION! allows for well behaved errors defined elsewhere.
    assert.fail = fail;

    // 4. Pure assertion tests whether a value is truthy, as determined
    // by !!guard.
    // assert.ok(guard, message_opt);
    // This statement is equivalent to assert.equal(true, !!guard,
    // message_opt);. To test strictly for the value true, use
    // assert.strictEqual(true, guard, message_opt);.

    function ok(value, message) {
      if (!value) fail(value, true, message, '==', ok);
    }
    assert.ok = ok;

    // 5. The equality assertion tests shallow, coercive equality with
    // ==.
    // assert.equal(actual, expected, message_opt);
    assert.equal = equal;
    function equal(actual, expected, message) {
      if (actual != expected) fail(actual, expected, message, '==', equal);
    }

    // 6. The non-equality assertion tests for whether two objects are not equal
    // with != assert.notEqual(actual, expected, message_opt);
    assert.notEqual = notEqual;
    function notEqual(actual, expected, message) {
      if (actual == expected) {
        fail(actual, expected, message, '!=', notEqual);
      }
    }

    // 7. The equivalence assertion tests a deep equality relation.
    // assert.deepEqual(actual, expected, message_opt);
    assert.deepEqual = deepEqual;
    function deepEqual(actual, expected, message) {
      if (!_deepEqual(actual, expected, false)) {
        fail(actual, expected, message, 'deepEqual', deepEqual);
      }
    }
    assert.deepStrictEqual = deepStrictEqual;
    function deepStrictEqual(actual, expected, message) {
      if (!_deepEqual(actual, expected, true)) {
        fail(actual, expected, message, 'deepStrictEqual', deepStrictEqual);
      }
    }

    function _deepEqual(actual, expected, strict, memos) {
      // 7.1. All identical values are equivalent, as determined by ===.
      if (actual === expected) {
        return true;
      } else if (isBuffer$1(actual) && isBuffer$1(expected)) {
        return compare(actual, expected) === 0;

      // 7.2. If the expected value is a Date object, the actual value is
      // equivalent if it is also a Date object that refers to the same time.
      } else if (isDate(actual) && isDate(expected)) {
        return actual.getTime() === expected.getTime();

      // 7.3 If the expected value is a RegExp object, the actual value is
      // equivalent if it is also a RegExp object with the same source and
      // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
      } else if (isRegExp(actual) && isRegExp(expected)) {
        return actual.source === expected.source &&
               actual.global === expected.global &&
               actual.multiline === expected.multiline &&
               actual.lastIndex === expected.lastIndex &&
               actual.ignoreCase === expected.ignoreCase;

      // 7.4. Other pairs that do not both pass typeof value == 'object',
      // equivalence is determined by ==.
      } else if ((actual === null || typeof actual !== 'object') &&
                 (expected === null || typeof expected !== 'object')) {
        return strict ? actual === expected : actual == expected;

      // If both values are instances of typed arrays, wrap their underlying
      // ArrayBuffers in a Buffer each to increase performance
      // This optimization requires the arrays to have the same type as checked by
      // Object.prototype.toString (aka pToString). Never perform binary
      // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
      // bit patterns are not identical.
      } else if (isView(actual) && isView(expected) &&
                 pToString(actual) === pToString(expected) &&
                 !(actual instanceof Float32Array ||
                   actual instanceof Float64Array)) {
        return compare(new Uint8Array(actual.buffer),
                       new Uint8Array(expected.buffer)) === 0;

      // 7.5 For all other Object pairs, including Array objects, equivalence is
      // determined by having the same number of owned properties (as verified
      // with Object.prototype.hasOwnProperty.call), the same set of keys
      // (although not necessarily the same order), equivalent values for every
      // corresponding key, and an identical 'prototype' property. Note: this
      // accounts for both named and indexed properties on Arrays.
      } else if (isBuffer$1(actual) !== isBuffer$1(expected)) {
        return false;
      } else {
        memos = memos || {actual: [], expected: []};

        var actualIndex = memos.actual.indexOf(actual);
        if (actualIndex !== -1) {
          if (actualIndex === memos.expected.indexOf(expected)) {
            return true;
          }
        }

        memos.actual.push(actual);
        memos.expected.push(expected);

        return objEquiv(actual, expected, strict, memos);
      }
    }

    function isArguments(object) {
      return Object.prototype.toString.call(object) == '[object Arguments]';
    }

    function objEquiv(a, b, strict, actualVisitedObjects) {
      if (a === null || a === undefined || b === null || b === undefined)
        return false;
      // if one is a primitive, the other must be same
      if (isPrimitive(a) || isPrimitive(b))
        return a === b;
      if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
        return false;
      var aIsArgs = isArguments(a);
      var bIsArgs = isArguments(b);
      if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
        return false;
      if (aIsArgs) {
        a = pSlice.call(a);
        b = pSlice.call(b);
        return _deepEqual(a, b, strict);
      }
      var ka = objectKeys$1(a);
      var kb = objectKeys$1(b);
      var key, i;
      // having the same number of owned properties (keys incorporates
      // hasOwnProperty)
      if (ka.length !== kb.length)
        return false;
      //the same set of keys (although not necessarily the same order),
      ka.sort();
      kb.sort();
      //~~~cheap key test
      for (i = ka.length - 1; i >= 0; i--) {
        if (ka[i] !== kb[i])
          return false;
      }
      //equivalent values for every corresponding key, and
      //~~~possibly expensive deep test
      for (i = ka.length - 1; i >= 0; i--) {
        key = ka[i];
        if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
          return false;
      }
      return true;
    }

    // 8. The non-equivalence assertion tests for any deep inequality.
    // assert.notDeepEqual(actual, expected, message_opt);
    assert.notDeepEqual = notDeepEqual;
    function notDeepEqual(actual, expected, message) {
      if (_deepEqual(actual, expected, false)) {
        fail(actual, expected, message, 'notDeepEqual', notDeepEqual);
      }
    }

    assert.notDeepStrictEqual = notDeepStrictEqual;
    function notDeepStrictEqual(actual, expected, message) {
      if (_deepEqual(actual, expected, true)) {
        fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
      }
    }


    // 9. The strict equality assertion tests strict equality, as determined by ===.
    // assert.strictEqual(actual, expected, message_opt);
    assert.strictEqual = strictEqual;
    function strictEqual(actual, expected, message) {
      if (actual !== expected) {
        fail(actual, expected, message, '===', strictEqual);
      }
    }

    // 10. The strict non-equality assertion tests for strict inequality, as
    // determined by !==.  assert.notStrictEqual(actual, expected, message_opt);
    assert.notStrictEqual = notStrictEqual;
    function notStrictEqual(actual, expected, message) {
      if (actual === expected) {
        fail(actual, expected, message, '!==', notStrictEqual);
      }
    }

    function expectedException(actual, expected) {
      if (!actual || !expected) {
        return false;
      }

      if (Object.prototype.toString.call(expected) == '[object RegExp]') {
        return expected.test(actual);
      }

      try {
        if (actual instanceof expected) {
          return true;
        }
      } catch (e) {
        // Ignore.  The instanceof check doesn't work for arrow functions.
      }

      if (Error.isPrototypeOf(expected)) {
        return false;
      }

      return expected.call({}, actual) === true;
    }

    function _tryBlock(block) {
      var error;
      try {
        block();
      } catch (e) {
        error = e;
      }
      return error;
    }

    function _throws(shouldThrow, block, expected, message) {
      var actual;

      if (typeof block !== 'function') {
        throw new TypeError('"block" argument must be a function');
      }

      if (typeof expected === 'string') {
        message = expected;
        expected = null;
      }

      actual = _tryBlock(block);

      message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
                (message ? ' ' + message : '.');

      if (shouldThrow && !actual) {
        fail(actual, expected, 'Missing expected exception' + message);
      }

      var userProvidedMessage = typeof message === 'string';
      var isUnwantedException = !shouldThrow && isError(actual);
      var isUnexpectedException = !shouldThrow && actual && !expected;

      if ((isUnwantedException &&
          userProvidedMessage &&
          expectedException(actual, expected)) ||
          isUnexpectedException) {
        fail(actual, expected, 'Got unwanted exception' + message);
      }

      if ((shouldThrow && actual && expected &&
          !expectedException(actual, expected)) || (!shouldThrow && actual)) {
        throw actual;
      }
    }

    // 11. Expected to throw an error:
    // assert.throws(block, Error_opt, message_opt);
    assert.throws = throws;
    function throws(block, /*optional*/error, /*optional*/message) {
      _throws(true, block, error, message);
    }

    // EXTENSION! This is annoying to write outside this module.
    assert.doesNotThrow = doesNotThrow;
    function doesNotThrow(block, /*optional*/error, /*optional*/message) {
      _throws(false, block, error, message);
    }

    assert.ifError = ifError;
    function ifError(err) {
      if (err) throw err;
    }

    var EventEmitter$1 = EventEmitter.EventEmitter;
    var inherits$4 = require$$0.inherits;







    var getCallback$2 = common.getCallback;
    var getOptions$2 = common.getOptions;

    var WriteError$1 = errors$1.WriteError;
    var ReadError = errors$1.ReadError;
    var NotFoundError$2 = errors$1.NotFoundError;
    var OpenError = errors$1.OpenError;
    var InitializationError = errors$1.InitializationError;

    // Possible AbstractLevelDOWN#status values:
    //  - 'new'     - newly created, not opened or closed
    //  - 'opening' - waiting for the database to be opened, post open()
    //  - 'open'    - successfully opened the database, available for use
    //  - 'closing' - waiting for the database to be closed, post close()
    //  - 'closed'  - database has been successfully closed, should not be
    //                 used except for another open() operation

    function LevelUP (db, options, callback) {
      if (!(this instanceof LevelUP)) {
        return new LevelUP(db, options, callback)
      }

      var error;

      EventEmitter$1.call(this);
      this.setMaxListeners(Infinity);

      if (typeof options === 'function') {
        callback = options;
        options = {};
      }

      options = options || {};

      if (!db || typeof db !== 'object') {
        error = new InitializationError('First argument must be an abstract-leveldown compliant store');
        if (typeof callback === 'function') {
          return process.nextTick(callback, error)
        }
        throw error
      }

      assert.equal(typeof db.status, 'string', '.status required, old abstract-leveldown');

      this.options = getOptions$2(options);
      this._db = db;
      this.db = new deferredLeveldown(db);
      this.open(callback);
    }

    LevelUP.prototype.emit = EventEmitter$1.prototype.emit;
    LevelUP.prototype.once = EventEmitter$1.prototype.once;
    inherits$4(LevelUP, EventEmitter$1);

    LevelUP.prototype.open = function (callback) {
      var self = this;
      var promise;

      if (!callback) {
        callback = promisify_1();
        promise = callback.promise;
      }

      if (this.isOpen()) {
        process.nextTick(callback, null, self);
        return promise
      }

      if (this._isOpening()) {
        this.once('open', function () { callback(null, self); });
        return promise
      }

      this.emit('opening');

      this.db.open(this.options, function (err) {
        if (err) {
          return callback(new OpenError(err))
        }
        self.db = self._db;
        callback(null, self);
        self.emit('open');
        self.emit('ready');
      });

      return promise
    };

    LevelUP.prototype.close = function (callback) {
      var self = this;
      var promise;

      if (!callback) {
        callback = promisify_1();
        promise = callback.promise;
      }

      if (this.isOpen()) {
        this.db.close(function () {
          self.emit('closed');
          callback.apply(null, arguments);
        });
        this.emit('closing');
        this.db = new deferredLeveldown(this._db);
      } else if (this.isClosed()) {
        process.nextTick(callback);
      } else if (this.db.status === 'closing') {
        this.once('closed', callback);
      } else if (this._isOpening()) {
        this.once('open', function () {
          self.close(callback);
        });
      }

      return promise
    };

    LevelUP.prototype.isOpen = function () {
      return this.db.status === 'open'
    };

    LevelUP.prototype._isOpening = function () {
      return this.db.status === 'opening'
    };

    LevelUP.prototype.isClosed = function () {
      return (/^clos|new/).test(this.db.status)
    };

    LevelUP.prototype.get = function (key, options, callback) {
      if (key === null || key === undefined) {
        throw new ReadError('get() requires a key argument')
      }

      var promise;

      callback = getCallback$2(options, callback);

      if (!callback) {
        callback = promisify_1();
        promise = callback.promise;
      }

      if (maybeError(this, callback)) { return promise }

      options = getOptions$2(options);

      this.db.get(key, options, function (err, value) {
        if (err) {
          if ((/notfound/i).test(err) || err.notFound) {
            err = new NotFoundError$2('Key not found in database [' + key + ']', err);
          } else {
            err = new ReadError(err);
          }
          return callback(err)
        }
        callback(null, value);
      });

      return promise
    };

    LevelUP.prototype.put = function (key, value, options, callback) {
      if (key === null || key === undefined) {
        throw new WriteError$1('put() requires a key argument')
      }

      var self = this;
      var promise;

      callback = getCallback$2(options, callback);

      if (!callback) {
        callback = promisify_1();
        promise = callback.promise;
      }

      if (maybeError(this, callback)) { return promise }

      options = getOptions$2(options);

      this.db.put(key, value, options, function (err) {
        if (err) {
          return callback(new WriteError$1(err))
        }
        self.emit('put', key, value);
        callback();
      });

      return promise
    };

    LevelUP.prototype.del = function (key, options, callback) {
      if (key === null || key === undefined) {
        throw new WriteError$1('del() requires a key argument')
      }

      var self = this;
      var promise;

      callback = getCallback$2(options, callback);

      if (!callback) {
        callback = promisify_1();
        promise = callback.promise;
      }

      if (maybeError(this, callback)) { return promise }

      options = getOptions$2(options);

      this.db.del(key, options, function (err) {
        if (err) {
          return callback(new WriteError$1(err))
        }
        self.emit('del', key);
        callback();
      });

      return promise
    };

    LevelUP.prototype.batch = function (arr, options, callback) {
      if (!arguments.length) {
        return new batch(this)
      }

      if (!Array.isArray(arr)) {
        throw new WriteError$1('batch() requires an array argument')
      }

      var self = this;
      var promise;

      callback = getCallback$2(options, callback);

      if (!callback) {
        callback = promisify_1();
        promise = callback.promise;
      }

      if (maybeError(this, callback)) { return promise }

      options = getOptions$2(options);

      this.db.batch(arr, options, function (err) {
        if (err) {
          return callback(new WriteError$1(err))
        }
        self.emit('batch', arr);
        callback();
      });

      return promise
    };

    LevelUP.prototype.iterator = function (options) {
      return this.db.iterator(options)
    };

    LevelUP.prototype.readStream =
    LevelUP.prototype.createReadStream = function (options) {
      options = immutable({ keys: true, values: true }, options);
      if (typeof options.limit !== 'number') { options.limit = -1; }
      return new levelIteratorStream(this.db.iterator(options), options)
    };

    LevelUP.prototype.keyStream =
    LevelUP.prototype.createKeyStream = function (options) {
      return this.createReadStream(immutable(options, { keys: true, values: false }))
    };

    LevelUP.prototype.valueStream =
    LevelUP.prototype.createValueStream = function (options) {
      return this.createReadStream(immutable(options, { keys: false, values: true }))
    };

    LevelUP.prototype.toString = function () {
      return 'LevelUP'
    };

    function maybeError (db, callback) {
      if (!db._isOpening() && !db.isOpen()) {
        process.nextTick(callback, new ReadError('Database is not open'));
        return true
      }
    }

    LevelUP.errors = errors$1;
    var levelup = LevelUP.default = LevelUP;

    function init$3(db) {
      return {
        OBJECT: _ids => Promise.all(
          _ids.map(
            id => db.get('￮DOC￮' + id._id + '￮')
          )
        )
      }
    }

    function init$4(db) {
      const MIN = key => {
        var ops = {
          limit: 1,
          gte: key + '!'
        };
        return new Promise((resolve, reject) => {
          db.createKeyStream(ops)
            .on('data', resolve);
        })
      };

      const MAX = key => {
        var ops = {
          limit: 1,
          lte: key + '￮',
          reverse: true
        };
        return new Promise((resolve, reject) => {
          db.createKeyStream(ops)
            .on('data', resolve);
        })
      };

      const DIST = ops => {
        if (typeof ops === 'string') {
          ops = {
            gte: ops,
            lte: ops + '￮'
          };
        }
        const keys = [];
        return new Promise((resolve, reject) => {
          db.createKeyStream(ops)
            .on('data', data => { keys.push(data); })
            .on('end', () => resolve(keys));
        })
      };

      return {
        DIST: DIST,
        MAX: MAX,
        MIN: MIN
      }
    }

    var traverse_1 = createCommonjsModule(function (module) {
    var traverse = module.exports = function (obj) {
        return new Traverse(obj);
    };

    function Traverse (obj) {
        this.value = obj;
    }

    Traverse.prototype.get = function (ps) {
        var node = this.value;
        for (var i = 0; i < ps.length; i ++) {
            var key = ps[i];
            if (!node || !hasOwnProperty.call(node, key)) {
                node = undefined;
                break;
            }
            node = node[key];
        }
        return node;
    };

    Traverse.prototype.has = function (ps) {
        var node = this.value;
        for (var i = 0; i < ps.length; i ++) {
            var key = ps[i];
            if (!node || !hasOwnProperty.call(node, key)) {
                return false;
            }
            node = node[key];
        }
        return true;
    };

    Traverse.prototype.set = function (ps, value) {
        var node = this.value;
        for (var i = 0; i < ps.length - 1; i ++) {
            var key = ps[i];
            if (!hasOwnProperty.call(node, key)) node[key] = {};
            node = node[key];
        }
        node[ps[i]] = value;
        return value;
    };

    Traverse.prototype.map = function (cb) {
        return walk(this.value, cb, true);
    };

    Traverse.prototype.forEach = function (cb) {
        this.value = walk(this.value, cb, false);
        return this.value;
    };

    Traverse.prototype.reduce = function (cb, init) {
        var skip = arguments.length === 1;
        var acc = skip ? this.value : init;
        this.forEach(function (x) {
            if (!this.isRoot || !skip) {
                acc = cb.call(this, acc, x);
            }
        });
        return acc;
    };

    Traverse.prototype.paths = function () {
        var acc = [];
        this.forEach(function (x) {
            acc.push(this.path); 
        });
        return acc;
    };

    Traverse.prototype.nodes = function () {
        var acc = [];
        this.forEach(function (x) {
            acc.push(this.node);
        });
        return acc;
    };

    Traverse.prototype.clone = function () {
        var parents = [], nodes = [];
        
        return (function clone (src) {
            for (var i = 0; i < parents.length; i++) {
                if (parents[i] === src) {
                    return nodes[i];
                }
            }
            
            if (typeof src === 'object' && src !== null) {
                var dst = copy(src);
                
                parents.push(src);
                nodes.push(dst);
                
                forEach(objectKeys(src), function (key) {
                    dst[key] = clone(src[key]);
                });
                
                parents.pop();
                nodes.pop();
                return dst;
            }
            else {
                return src;
            }
        })(this.value);
    };

    function walk (root, cb, immutable) {
        var path = [];
        var parents = [];
        var alive = true;
        
        return (function walker (node_) {
            var node = immutable ? copy(node_) : node_;
            var modifiers = {};
            
            var keepGoing = true;
            
            var state = {
                node : node,
                node_ : node_,
                path : [].concat(path),
                parent : parents[parents.length - 1],
                parents : parents,
                key : path.slice(-1)[0],
                isRoot : path.length === 0,
                level : path.length,
                circular : null,
                update : function (x, stopHere) {
                    if (!state.isRoot) {
                        state.parent.node[state.key] = x;
                    }
                    state.node = x;
                    if (stopHere) keepGoing = false;
                },
                'delete' : function (stopHere) {
                    delete state.parent.node[state.key];
                    if (stopHere) keepGoing = false;
                },
                remove : function (stopHere) {
                    if (isArray(state.parent.node)) {
                        state.parent.node.splice(state.key, 1);
                    }
                    else {
                        delete state.parent.node[state.key];
                    }
                    if (stopHere) keepGoing = false;
                },
                keys : null,
                before : function (f) { modifiers.before = f; },
                after : function (f) { modifiers.after = f; },
                pre : function (f) { modifiers.pre = f; },
                post : function (f) { modifiers.post = f; },
                stop : function () { alive = false; },
                block : function () { keepGoing = false; }
            };
            
            if (!alive) return state;
            
            function updateState() {
                if (typeof state.node === 'object' && state.node !== null) {
                    if (!state.keys || state.node_ !== state.node) {
                        state.keys = objectKeys(state.node);
                    }
                    
                    state.isLeaf = state.keys.length == 0;
                    
                    for (var i = 0; i < parents.length; i++) {
                        if (parents[i].node_ === node_) {
                            state.circular = parents[i];
                            break;
                        }
                    }
                }
                else {
                    state.isLeaf = true;
                    state.keys = null;
                }
                
                state.notLeaf = !state.isLeaf;
                state.notRoot = !state.isRoot;
            }
            
            updateState();
            
            // use return values to update if defined
            var ret = cb.call(state, state.node);
            if (ret !== undefined && state.update) state.update(ret);
            
            if (modifiers.before) modifiers.before.call(state, state.node);
            
            if (!keepGoing) return state;
            
            if (typeof state.node == 'object'
            && state.node !== null && !state.circular) {
                parents.push(state);
                
                updateState();
                
                forEach(state.keys, function (key, i) {
                    path.push(key);
                    
                    if (modifiers.pre) modifiers.pre.call(state, state.node[key], key);
                    
                    var child = walker(state.node[key]);
                    if (immutable && hasOwnProperty.call(state.node, key)) {
                        state.node[key] = child.node;
                    }
                    
                    child.isLast = i == state.keys.length - 1;
                    child.isFirst = i == 0;
                    
                    if (modifiers.post) modifiers.post.call(state, child);
                    
                    path.pop();
                });
                parents.pop();
            }
            
            if (modifiers.after) modifiers.after.call(state, state.node);
            
            return state;
        })(root).node;
    }

    function copy (src) {
        if (typeof src === 'object' && src !== null) {
            var dst;
            
            if (isArray(src)) {
                dst = [];
            }
            else if (isDate(src)) {
                dst = new Date(src.getTime ? src.getTime() : src);
            }
            else if (isRegExp(src)) {
                dst = new RegExp(src);
            }
            else if (isError(src)) {
                dst = { message: src.message };
            }
            else if (isBoolean(src)) {
                dst = new Boolean(src);
            }
            else if (isNumber(src)) {
                dst = new Number(src);
            }
            else if (isString(src)) {
                dst = new String(src);
            }
            else if (Object.create && Object.getPrototypeOf) {
                dst = Object.create(Object.getPrototypeOf(src));
            }
            else if (src.constructor === Object) {
                dst = {};
            }
            else {
                var proto =
                    (src.constructor && src.constructor.prototype)
                    || src.__proto__
                    || {}
                ;
                var T = function () {};
                T.prototype = proto;
                dst = new T;
            }
            
            forEach(objectKeys(src), function (key) {
                dst[key] = src[key];
            });
            return dst;
        }
        else return src;
    }

    var objectKeys = Object.keys || function keys (obj) {
        var res = [];
        for (var key in obj) res.push(key);
        return res;
    };

    function toS (obj) { return Object.prototype.toString.call(obj) }
    function isDate (obj) { return toS(obj) === '[object Date]' }
    function isRegExp (obj) { return toS(obj) === '[object RegExp]' }
    function isError (obj) { return toS(obj) === '[object Error]' }
    function isBoolean (obj) { return toS(obj) === '[object Boolean]' }
    function isNumber (obj) { return toS(obj) === '[object Number]' }
    function isString (obj) { return toS(obj) === '[object String]' }

    var isArray = Array.isArray || function isArray (xs) {
        return Object.prototype.toString.call(xs) === '[object Array]';
    };

    var forEach = function (xs, fn) {
        if (xs.forEach) return xs.forEach(fn)
        else for (var i = 0; i < xs.length; i++) {
            fn(xs[i], i, xs);
        }
    };

    forEach(objectKeys(Traverse.prototype), function (key) {
        traverse[key] = function (obj) {
            var args = [].slice.call(arguments, 1);
            var t = new Traverse(obj);
            return t[key].apply(t, args);
        };
    });

    var hasOwnProperty = Object.hasOwnProperty || function (obj, key) {
        return key in obj;
    };
    });

    // TODO: set reset this to the max value every time the DB is restarted
    var incrementalId = 0;

    // use trav lib to find all leaf nodes with corresponding paths
    const invertDoc = function (obj) {
      var keys = [];
      traverse_1(obj).forEach(function (node) {
        var searchable = true;
        this.path.forEach(item => {
          // make fields beginning with ! non-searchable
          if (item.substring(0, 1) === '!') searchable = false;
          // _id field should not be searchable
          if (item === '_id') searchable = false;
        });
        if (searchable && this.isLeaf) {
          var key = this.path.join('.') + ':' + this.node;
          if (Array.isArray(this.parent.node)) {
            key = this.path.slice(0, this.path.length - 1).join('.') + ':' + this.node;
          }
          keys.push(key);
        }
      });
      return {
        _id: obj._id || ++incrementalId, // generate _id if not present
        keys: keys
      }
    };

    // TODO: merging indexes needs a proper test
    const createMergedReverseIndex = (index, db, mode) => {
      // does a wb.get that simply returns "[]" rather than rejecting the
      // promise so that you can do Promise.all without breaking on keys
      // that dont exist in the db
      const gracefullGet = key => new Promise((resolve, reject) => {
        db.get(key).then(resolve).catch(e => resolve([]));
      });
      const indexKeys = Object.keys(index);
      return Promise.all(
        indexKeys.map(gracefullGet)
      ).then(currentValues => currentValues.map((cur, i) => {
        // set of current values in store
        var curSet = new Set(cur);
        // set of keys in delta index that is being merged in
        var deltaSet = new Set(index[indexKeys[i]]);
        if (mode === 'put') {
          return {
            key: indexKeys[i],
            type: mode,
            value: [...new Set([...curSet, ...deltaSet])].sort() // union
          }
        } else if (mode === 'del') {
          // difference
          var newSet = [...new Set(
            [...curSet].filter(x => !deltaSet.has(x))
          )];
          return {
            key: indexKeys[i],
            type: (newSet.length === 0) ? 'del' : 'put',
            value: newSet
          }
        }
      }))
    };

    const objectIndex = (docs, mode) => docs.map(doc => {
      return {
        key: '￮DOC￮' + doc._id + '￮',
        type: mode,
        value: doc
      }
    });

    const reverseIndex = (acc, cur) => {
      cur.keys.forEach(key => {
        acc[key] = acc[key] || [];
        acc[key].push(cur._id);
      });
      return acc
    };

    const createDeltaReverseIndex = docs => docs
      .map(invertDoc)
      .reduce(reverseIndex, {});

    const checkID = doc => {
      if (typeof doc._id === 'string') return doc
      if (typeof doc._id === 'number') return doc
      // else
      doc._id = incrementalId++;
      return doc
    };

    const writer = (docs, db, mode) => {
      // check for _id field, autogenerate if necessary
      docs = docs.map(checkID);
      return new Promise((resolve, reject) => {
        createMergedReverseIndex(createDeltaReverseIndex(docs), db, mode)
          .then(mergedReverseIndex => {
            db.batch(mergedReverseIndex.concat(objectIndex(docs, mode)), e => resolve(docs));
          });
      })
    };


    function init$5(db) {
      // docs needs to be an array of ids (strings)
      // first do an 'objects' call to get all of the documents to be
      // deleted
      const DELETE = _ids =>
        init$3(db).OBJECT(
          _ids.map(_id => {
            return {
              _id: _id
            }
          })
        ).then(docs => writer(docs, db, 'del'));

      const PUT = docs => writer(docs, db, 'put');

      return {
        DELETE: DELETE,
        PUT: PUT
      }
    }

    // const encode = require('encoding-down')


    const makeAFii = db => {
      return {
        AGGREGATE: init$1(db).AGGREGATE,
        AND: init$1(db).INTERSECTION,
        BUCKET: init$1(db).BUCKET,
        DELETE: init$5(db).DELETE,
        DISTINCT: init$4(db).DIST,
        GET: init$1(db).GET,
        MAX: init$4(db).MAX,
        MIN: init$4(db).MIN,
        NOT: init$1(db).SET_DIFFERENCE,
        OBJECT: init$3(db).OBJECT,
        OR: init$1(db).UNION,
        PUT: init$5(db).PUT,
        STORE: db
      }
    };

    function fii(ops, callback) {
      // todo: make this nicer
      ops = ops || {};
      ops.name = ops.name || 'fii';
      ops = Object.assign({}, {
        down: leveldown(ops.name)
      }, ops);
      // if no callback provided, "lazy load"
      if (!callback) {
        // Is encoding needed?
        let db = levelup(encodingDown(ops.down, { valueEncoding: 'json' }));
        return makeAFii(db)
      } else {
        // use callback to provide a notification that db is opened
        levelup(encodingDown(ops.down, {
          valueEncoding: 'json'
        }), (err, db) => callback(err, makeAFii(db)));
      }
    }

    return fii;

}));
