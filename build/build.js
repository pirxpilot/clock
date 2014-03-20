
/**
 * Require the given path.
 *
 * @param {String} path
 * @return {Object} exports
 * @api public
 */

function require(path, parent, orig) {
  var resolved = require.resolve(path);

  // lookup failed
  if (null == resolved) {
    orig = orig || path;
    parent = parent || 'root';
    var err = new Error('Failed to require "' + orig + '" from "' + parent + '"');
    err.path = orig;
    err.parent = parent;
    err.require = true;
    throw err;
  }

  var module = require.modules[resolved];

  // perform real require()
  // by invoking the module's
  // registered function
  if (!module._resolving && !module.exports) {
    var mod = {};
    mod.exports = {};
    mod.client = mod.component = true;
    module._resolving = true;
    module.call(this, mod.exports, require.relative(resolved), mod);
    delete module._resolving;
    module.exports = mod.exports;
  }

  return module.exports;
}

/**
 * Registered modules.
 */

require.modules = {};

/**
 * Registered aliases.
 */

require.aliases = {};

/**
 * Resolve `path`.
 *
 * Lookup:
 *
 *   - PATH/index.js
 *   - PATH.js
 *   - PATH
 *
 * @param {String} path
 * @return {String} path or null
 * @api private
 */

require.resolve = function(path) {
  if (path.charAt(0) === '/') path = path.slice(1);

  var paths = [
    path,
    path + '.js',
    path + '.json',
    path + '/index.js',
    path + '/index.json'
  ];

  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    if (require.modules.hasOwnProperty(path)) return path;
    if (require.aliases.hasOwnProperty(path)) return require.aliases[path];
  }
};

/**
 * Normalize `path` relative to the current path.
 *
 * @param {String} curr
 * @param {String} path
 * @return {String}
 * @api private
 */

require.normalize = function(curr, path) {
  var segs = [];

  if ('.' != path.charAt(0)) return path;

  curr = curr.split('/');
  path = path.split('/');

  for (var i = 0; i < path.length; ++i) {
    if ('..' == path[i]) {
      curr.pop();
    } else if ('.' != path[i] && '' != path[i]) {
      segs.push(path[i]);
    }
  }

  return curr.concat(segs).join('/');
};

/**
 * Register module at `path` with callback `definition`.
 *
 * @param {String} path
 * @param {Function} definition
 * @api private
 */

require.register = function(path, definition) {
  require.modules[path] = definition;
};

/**
 * Alias a module definition.
 *
 * @param {String} from
 * @param {String} to
 * @api private
 */

require.alias = function(from, to) {
  if (!require.modules.hasOwnProperty(from)) {
    throw new Error('Failed to alias "' + from + '", it does not exist');
  }
  require.aliases[to] = from;
};

/**
 * Return a require function relative to the `parent` path.
 *
 * @param {String} parent
 * @return {Function}
 * @api private
 */

require.relative = function(parent) {
  var p = require.normalize(parent, '..');

  /**
   * lastIndexOf helper.
   */

  function lastIndexOf(arr, obj) {
    var i = arr.length;
    while (i--) {
      if (arr[i] === obj) return i;
    }
    return -1;
  }

  /**
   * The relative require() itself.
   */

  function localRequire(path) {
    var resolved = localRequire.resolve(path);
    return require(resolved, parent, path);
  }

  /**
   * Resolve relative to the parent.
   */

  localRequire.resolve = function(path) {
    var c = path.charAt(0);
    if ('/' == c) return path.slice(1);
    if ('.' == c) return require.normalize(p, path);

    // resolve deps by returning
    // the dep in the nearest "deps"
    // directory
    var segs = parent.split('/');
    var i = lastIndexOf(segs, 'deps') + 1;
    if (!i) i = 0;
    path = segs.slice(0, i + 1).join('/') + '/deps/' + path;
    return path;
  };

  /**
   * Check if module is defined at `path`.
   */

  localRequire.exists = function(path) {
    return require.modules.hasOwnProperty(localRequire.resolve(path));
  };

  return localRequire;
};
require.register("code42day-bounds/index.js", Function("exports, require, module",
"var clone;\n\
\n\
if ('undefined' == typeof window) {\n\
  clone = require('clone-component');\n\
} else {\n\
  clone = require('clone');\n\
}\n\
\n\
module.exports = Bounds;\n\
\n\
\n\
function calculateReversed(self) {\n\
  return self._min\n\
    && self._max\n\
    && self.before(self._max);\n\
}\n\
\n\
function Bounds(obj) {\n\
  if (obj) return mixin(obj);\n\
}\n\
\n\
function mixin(obj) {\n\
  for (var key in Bounds.prototype) {\n\
    obj[key] = Bounds.prototype[key];\n\
  }\n\
  return obj;\n\
}\n\
\n\
Bounds.prototype.compare = function(fn) {\n\
  this._compare = fn;\n\
  return this;\n\
};\n\
\n\
Bounds.prototype.distance = function(fn) {\n\
  this._distance = fn;\n\
  return this;\n\
};\n\
\n\
Bounds.prototype.min = function(v) {\n\
  if (!arguments.length) {\n\
    return this._min;\n\
  }\n\
  this._min = v;\n\
  delete this._reversed;\n\
  return this;\n\
};\n\
\n\
Bounds.prototype.max = function(v) {\n\
  if (!arguments.length) {\n\
    return this._max;\n\
  }\n\
  this._max = v;\n\
  delete this._reversed;\n\
  return this;\n\
};\n\
\n\
Bounds.prototype.before = function(v) {\n\
  return this._min && (this._compare(v, this._min) < 0);\n\
};\n\
\n\
Bounds.prototype.after = function(v) {\n\
  return this._max && (this._compare(v, this._max) > 0);\n\
};\n\
\n\
Bounds.prototype.out = function(v) {\n\
  return this.before(v) || this.after(v);\n\
};\n\
\n\
Bounds.prototype.in = function(v) {\n\
  return !this.out(v);\n\
};\n\
\n\
Bounds.prototype.valid = function(v) {\n\
  if (this.reversed()) {\n\
    return !this.after(v) || !this.before(v);\n\
  }\n\
  return this.in(v);\n\
};\n\
\n\
Bounds.prototype.invalid = function(v) {\n\
  return !this.valid(v);\n\
};\n\
\n\
Bounds.prototype.reversed = function() {\n\
  if (this._reversed === undefined) {\n\
    this._reversed = calculateReversed(this);\n\
  }\n\
  return this._reversed;\n\
};\n\
\n\
Bounds.prototype.restrict = function(v) {\n\
  if (this.reversed()) {\n\
    if(this.after(v) && this.before(v)) {\n\
      // select closer bound\n\
      return (this._distance(this._max, v) < this._distance(v, this._min))\n\
        ? clone(this._max)\n\
        : clone(this._min);\n\
    }\n\
    return v;\n\
  }\n\
  if(this.before(v)) {\n\
    return clone(this._min);\n\
  }\n\
  if(this.after(v)) {\n\
    return clone(this._max);\n\
  }\n\
  return v;\n\
};\n\
//@ sourceURL=code42day-bounds/index.js"
));
require.register("code42day-dataset/index.js", Function("exports, require, module",
"module.exports=dataset;\n\
\n\
/*global document*/\n\
\n\
\n\
// replace namesLikeThis with names-like-this\n\
function toDashed(name) {\n\
  return name.replace(/([A-Z])/g, function(u) {\n\
    return \"-\" + u.toLowerCase();\n\
  });\n\
}\n\
\n\
var fn;\n\
\n\
if (document.head && document.head.dataset) {\n\
  fn = {\n\
    set: function(node, attr, value) {\n\
      node.dataset[attr] = value;\n\
    },\n\
    get: function(node, attr) {\n\
      return node.dataset[attr];\n\
    },\n\
    del: function (node, attr) {\n\
      delete node.dataset[attr];\n\
    }\n\
  };\n\
} else {\n\
  fn = {\n\
    set: function(node, attr, value) {\n\
      node.setAttribute('data-' + toDashed(attr), value);\n\
    },\n\
    get: function(node, attr) {\n\
      return node.getAttribute('data-' + toDashed(attr));\n\
    },\n\
    del: function (node, attr) {\n\
      node.removeAttribute('data-' + toDashed(attr));\n\
    }\n\
  };\n\
}\n\
\n\
function dataset(node, attr, value) {\n\
  var self = {\n\
    set: set,\n\
    get: get,\n\
    del: del\n\
  };\n\
\n\
  function set(attr, value) {\n\
    fn.set(node, attr, value);\n\
    return self;\n\
  }\n\
\n\
  function del(attr) {\n\
    fn.del(node, attr);\n\
    return self;\n\
  }\n\
\n\
  function get(attr) {\n\
    return fn.get(node, attr);\n\
  }\n\
\n\
  if (arguments.length === 3) {\n\
    return set(attr, value);\n\
  }\n\
  if (arguments.length == 2) {\n\
    return get(attr);\n\
  }\n\
\n\
  return self;\n\
}\n\
//@ sourceURL=code42day-dataset/index.js"
));
require.register("component-event/index.js", Function("exports, require, module",
"var bind = window.addEventListener ? 'addEventListener' : 'attachEvent',\n\
    unbind = window.removeEventListener ? 'removeEventListener' : 'detachEvent',\n\
    prefix = bind !== 'addEventListener' ? 'on' : '';\n\
\n\
/**\n\
 * Bind `el` event `type` to `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, type, fn, capture){\n\
  el[bind](prefix + type, fn, capture || false);\n\
\n\
  return fn;\n\
};\n\
\n\
/**\n\
 * Unbind `el` event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  el[unbind](prefix + type, fn, capture || false);\n\
\n\
  return fn;\n\
};//@ sourceURL=component-event/index.js"
));
require.register("component-query/index.js", Function("exports, require, module",
"function one(selector, el) {\n\
  return el.querySelector(selector);\n\
}\n\
\n\
exports = module.exports = function(selector, el){\n\
  el = el || document;\n\
  return one(selector, el);\n\
};\n\
\n\
exports.all = function(selector, el){\n\
  el = el || document;\n\
  return el.querySelectorAll(selector);\n\
};\n\
\n\
exports.engine = function(obj){\n\
  if (!obj.one) throw new Error('.one callback required');\n\
  if (!obj.all) throw new Error('.all callback required');\n\
  one = obj.one;\n\
  exports.all = obj.all;\n\
  return exports;\n\
};\n\
//@ sourceURL=component-query/index.js"
));
require.register("component-matches-selector/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var query = require('query');\n\
\n\
/**\n\
 * Element prototype.\n\
 */\n\
\n\
var proto = Element.prototype;\n\
\n\
/**\n\
 * Vendor function.\n\
 */\n\
\n\
var vendor = proto.matches\n\
  || proto.webkitMatchesSelector\n\
  || proto.mozMatchesSelector\n\
  || proto.msMatchesSelector\n\
  || proto.oMatchesSelector;\n\
\n\
/**\n\
 * Expose `match()`.\n\
 */\n\
\n\
module.exports = match;\n\
\n\
/**\n\
 * Match `el` to `selector`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
function match(el, selector) {\n\
  if (vendor) return vendor.call(el, selector);\n\
  var nodes = query.all(selector, el.parentNode);\n\
  for (var i = 0; i < nodes.length; ++i) {\n\
    if (nodes[i] == el) return true;\n\
  }\n\
  return false;\n\
}\n\
//@ sourceURL=component-matches-selector/index.js"
));
require.register("discore-closest/index.js", Function("exports, require, module",
"var matches = require('matches-selector')\n\
\n\
module.exports = function (element, selector, checkYoSelf, root) {\n\
  element = checkYoSelf ? {parentNode: element} : element\n\
\n\
  root = root || document\n\
\n\
  // Make sure `element !== document` and `element != null`\n\
  // otherwise we get an illegal invocation\n\
  while ((element = element.parentNode) && element !== document) {\n\
    if (matches(element, selector))\n\
      return element\n\
    // After `matches` on the edge case that\n\
    // the selector matches the root\n\
    // (when the root is not the document)\n\
    if (element === root)\n\
      return  \n\
  }\n\
}//@ sourceURL=discore-closest/index.js"
));
require.register("component-delegate/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var closest = require('closest')\n\
  , event = require('event');\n\
\n\
/**\n\
 * Delegate event `type` to `selector`\n\
 * and invoke `fn(e)`. A callback function\n\
 * is returned which may be passed to `.unbind()`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} selector\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @return {Function}\n\
 * @api public\n\
 */\n\
\n\
exports.bind = function(el, selector, type, fn, capture){\n\
  return event.bind(el, type, function(e){\n\
    var target = e.target || e.srcElement;\n\
    e.delegateTarget = closest(target, selector, true, el);\n\
    if (e.delegateTarget) fn.call(el, e);\n\
  }, capture);\n\
};\n\
\n\
/**\n\
 * Unbind event `type`'s callback `fn`.\n\
 *\n\
 * @param {Element} el\n\
 * @param {String} type\n\
 * @param {Function} fn\n\
 * @param {Boolean} capture\n\
 * @api public\n\
 */\n\
\n\
exports.unbind = function(el, type, fn, capture){\n\
  event.unbind(el, type, fn, capture);\n\
};\n\
//@ sourceURL=component-delegate/index.js"
));
require.register("component-events/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var events = require('event');\n\
var delegate = require('delegate');\n\
\n\
/**\n\
 * Expose `Events`.\n\
 */\n\
\n\
module.exports = Events;\n\
\n\
/**\n\
 * Initialize an `Events` with the given\n\
 * `el` object which events will be bound to,\n\
 * and the `obj` which will receive method calls.\n\
 *\n\
 * @param {Object} el\n\
 * @param {Object} obj\n\
 * @api public\n\
 */\n\
\n\
function Events(el, obj) {\n\
  if (!(this instanceof Events)) return new Events(el, obj);\n\
  if (!el) throw new Error('element required');\n\
  if (!obj) throw new Error('object required');\n\
  this.el = el;\n\
  this.obj = obj;\n\
  this._events = {};\n\
}\n\
\n\
/**\n\
 * Subscription helper.\n\
 */\n\
\n\
Events.prototype.sub = function(event, method, cb){\n\
  this._events[event] = this._events[event] || {};\n\
  this._events[event][method] = cb;\n\
};\n\
\n\
/**\n\
 * Bind to `event` with optional `method` name.\n\
 * When `method` is undefined it becomes `event`\n\
 * with the \"on\" prefix.\n\
 *\n\
 * Examples:\n\
 *\n\
 *  Direct event handling:\n\
 *\n\
 *    events.bind('click') // implies \"onclick\"\n\
 *    events.bind('click', 'remove')\n\
 *    events.bind('click', 'sort', 'asc')\n\
 *\n\
 *  Delegated event handling:\n\
 *\n\
 *    events.bind('click li > a')\n\
 *    events.bind('click li > a', 'remove')\n\
 *    events.bind('click a.sort-ascending', 'sort', 'asc')\n\
 *    events.bind('click a.sort-descending', 'sort', 'desc')\n\
 *\n\
 * @param {String} event\n\
 * @param {String|function} [method]\n\
 * @return {Function} callback\n\
 * @api public\n\
 */\n\
\n\
Events.prototype.bind = function(event, method){\n\
  var e = parse(event);\n\
  var el = this.el;\n\
  var obj = this.obj;\n\
  var name = e.name;\n\
  var method = method || 'on' + name;\n\
  var args = [].slice.call(arguments, 2);\n\
\n\
  // callback\n\
  function cb(){\n\
    var a = [].slice.call(arguments).concat(args);\n\
    obj[method].apply(obj, a);\n\
  }\n\
\n\
  // bind\n\
  if (e.selector) {\n\
    cb = delegate.bind(el, e.selector, name, cb);\n\
  } else {\n\
    events.bind(el, name, cb);\n\
  }\n\
\n\
  // subscription for unbinding\n\
  this.sub(name, method, cb);\n\
\n\
  return cb;\n\
};\n\
\n\
/**\n\
 * Unbind a single binding, all bindings for `event`,\n\
 * or all bindings within the manager.\n\
 *\n\
 * Examples:\n\
 *\n\
 *  Unbind direct handlers:\n\
 *\n\
 *     events.unbind('click', 'remove')\n\
 *     events.unbind('click')\n\
 *     events.unbind()\n\
 *\n\
 * Unbind delegate handlers:\n\
 *\n\
 *     events.unbind('click', 'remove')\n\
 *     events.unbind('click')\n\
 *     events.unbind()\n\
 *\n\
 * @param {String|Function} [event]\n\
 * @param {String|Function} [method]\n\
 * @api public\n\
 */\n\
\n\
Events.prototype.unbind = function(event, method){\n\
  if (0 == arguments.length) return this.unbindAll();\n\
  if (1 == arguments.length) return this.unbindAllOf(event);\n\
\n\
  // no bindings for this event\n\
  var bindings = this._events[event];\n\
  if (!bindings) return;\n\
\n\
  // no bindings for this method\n\
  var cb = bindings[method];\n\
  if (!cb) return;\n\
\n\
  events.unbind(this.el, event, cb);\n\
};\n\
\n\
/**\n\
 * Unbind all events.\n\
 *\n\
 * @api private\n\
 */\n\
\n\
Events.prototype.unbindAll = function(){\n\
  for (var event in this._events) {\n\
    this.unbindAllOf(event);\n\
  }\n\
};\n\
\n\
/**\n\
 * Unbind all events for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @api private\n\
 */\n\
\n\
Events.prototype.unbindAllOf = function(event){\n\
  var bindings = this._events[event];\n\
  if (!bindings) return;\n\
\n\
  for (var method in bindings) {\n\
    this.unbind(event, method);\n\
  }\n\
};\n\
\n\
/**\n\
 * Parse `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function parse(event) {\n\
  var parts = event.split(/ +/);\n\
  return {\n\
    name: parts.shift(),\n\
    selector: parts.join(' ')\n\
  }\n\
}\n\
//@ sourceURL=component-events/index.js"
));
require.register("component-indexof/index.js", Function("exports, require, module",
"module.exports = function(arr, obj){\n\
  if (arr.indexOf) return arr.indexOf(obj);\n\
  for (var i = 0; i < arr.length; ++i) {\n\
    if (arr[i] === obj) return i;\n\
  }\n\
  return -1;\n\
};//@ sourceURL=component-indexof/index.js"
));
require.register("component-classes/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var index = require('indexof');\n\
\n\
/**\n\
 * Whitespace regexp.\n\
 */\n\
\n\
var re = /\\s+/;\n\
\n\
/**\n\
 * toString reference.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Wrap `el` in a `ClassList`.\n\
 *\n\
 * @param {Element} el\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(el){\n\
  return new ClassList(el);\n\
};\n\
\n\
/**\n\
 * Initialize a new ClassList for `el`.\n\
 *\n\
 * @param {Element} el\n\
 * @api private\n\
 */\n\
\n\
function ClassList(el) {\n\
  if (!el) throw new Error('A DOM element reference is required');\n\
  this.el = el;\n\
  this.list = el.classList;\n\
}\n\
\n\
/**\n\
 * Add class `name` if not already present.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.add = function(name){\n\
  // classList\n\
  if (this.list) {\n\
    this.list.add(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  var arr = this.array();\n\
  var i = index(arr, name);\n\
  if (!~i) arr.push(name);\n\
  this.el.className = arr.join(' ');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove class `name` when present, or\n\
 * pass a regular expression to remove\n\
 * any which match.\n\
 *\n\
 * @param {String|RegExp} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.remove = function(name){\n\
  if ('[object RegExp]' == toString.call(name)) {\n\
    return this.removeMatching(name);\n\
  }\n\
\n\
  // classList\n\
  if (this.list) {\n\
    this.list.remove(name);\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  var arr = this.array();\n\
  var i = index(arr, name);\n\
  if (~i) arr.splice(i, 1);\n\
  this.el.className = arr.join(' ');\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove all classes matching `re`.\n\
 *\n\
 * @param {RegExp} re\n\
 * @return {ClassList}\n\
 * @api private\n\
 */\n\
\n\
ClassList.prototype.removeMatching = function(re){\n\
  var arr = this.array();\n\
  for (var i = 0; i < arr.length; i++) {\n\
    if (re.test(arr[i])) {\n\
      this.remove(arr[i]);\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Toggle class `name`, can force state via `force`.\n\
 *\n\
 * For browsers that support classList, but do not support `force` yet,\n\
 * the mistake will be detected and corrected.\n\
 *\n\
 * @param {String} name\n\
 * @param {Boolean} force\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.toggle = function(name, force){\n\
  // classList\n\
  if (this.list) {\n\
    if (\"undefined\" !== typeof force) {\n\
      if (force !== this.list.toggle(name, force)) {\n\
        this.list.toggle(name); // toggle again to correct\n\
      }\n\
    } else {\n\
      this.list.toggle(name);\n\
    }\n\
    return this;\n\
  }\n\
\n\
  // fallback\n\
  if (\"undefined\" !== typeof force) {\n\
    if (!force) {\n\
      this.remove(name);\n\
    } else {\n\
      this.add(name);\n\
    }\n\
  } else {\n\
    if (this.has(name)) {\n\
      this.remove(name);\n\
    } else {\n\
      this.add(name);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return an array of classes.\n\
 *\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.array = function(){\n\
  var str = this.el.className.replace(/^\\s+|\\s+$/g, '');\n\
  var arr = str.split(re);\n\
  if ('' === arr[0]) arr.shift();\n\
  return arr;\n\
};\n\
\n\
/**\n\
 * Check if class `name` is present.\n\
 *\n\
 * @param {String} name\n\
 * @return {ClassList}\n\
 * @api public\n\
 */\n\
\n\
ClassList.prototype.has =\n\
ClassList.prototype.contains = function(name){\n\
  return this.list\n\
    ? this.list.contains(name)\n\
    : !! ~index(this.array(), name);\n\
};\n\
//@ sourceURL=component-classes/index.js"
));
require.register("component-type/index.js", Function("exports, require, module",
"/**\n\
 * toString ref.\n\
 */\n\
\n\
var toString = Object.prototype.toString;\n\
\n\
/**\n\
 * Return the type of `val`.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(val){\n\
  switch (toString.call(val)) {\n\
    case '[object Date]': return 'date';\n\
    case '[object RegExp]': return 'regexp';\n\
    case '[object Arguments]': return 'arguments';\n\
    case '[object Array]': return 'array';\n\
    case '[object Error]': return 'error';\n\
  }\n\
\n\
  if (val === null) return 'null';\n\
  if (val === undefined) return 'undefined';\n\
  if (val !== val) return 'nan';\n\
  if (val && val.nodeType === 1) return 'element';\n\
\n\
  return typeof val.valueOf();\n\
};\n\
//@ sourceURL=component-type/index.js"
));
require.register("component-clone/index.js", Function("exports, require, module",
"/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var type;\n\
try {\n\
  type = require('component-type');\n\
} catch (_) {\n\
  type = require('type');\n\
}\n\
\n\
/**\n\
 * Module exports.\n\
 */\n\
\n\
module.exports = clone;\n\
\n\
/**\n\
 * Clones objects.\n\
 *\n\
 * @param {Mixed} any object\n\
 * @api public\n\
 */\n\
\n\
function clone(obj){\n\
  switch (type(obj)) {\n\
    case 'object':\n\
      var copy = {};\n\
      for (var key in obj) {\n\
        if (obj.hasOwnProperty(key)) {\n\
          copy[key] = clone(obj[key]);\n\
        }\n\
      }\n\
      return copy;\n\
\n\
    case 'array':\n\
      var copy = new Array(obj.length);\n\
      for (var i = 0, l = obj.length; i < l; i++) {\n\
        copy[i] = clone(obj[i]);\n\
      }\n\
      return copy;\n\
\n\
    case 'regexp':\n\
      // from millermedeiros/amd-utils - MIT\n\
      var flags = '';\n\
      flags += obj.multiline ? 'm' : '';\n\
      flags += obj.global ? 'g' : '';\n\
      flags += obj.ignoreCase ? 'i' : '';\n\
      return new RegExp(obj.source, flags);\n\
\n\
    case 'date':\n\
      return new Date(obj.getTime());\n\
\n\
    default: // string, number, boolean, …\n\
      return obj;\n\
  }\n\
}\n\
//@ sourceURL=component-clone/index.js"
));
require.register("component-domify/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `parse`.\n\
 */\n\
\n\
module.exports = parse;\n\
\n\
/**\n\
 * Wrap map from jquery.\n\
 */\n\
\n\
var map = {\n\
  legend: [1, '<fieldset>', '</fieldset>'],\n\
  tr: [2, '<table><tbody>', '</tbody></table>'],\n\
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],\n\
  _default: [0, '', '']\n\
};\n\
\n\
map.td =\n\
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];\n\
\n\
map.option =\n\
map.optgroup = [1, '<select multiple=\"multiple\">', '</select>'];\n\
\n\
map.thead =\n\
map.tbody =\n\
map.colgroup =\n\
map.caption =\n\
map.tfoot = [1, '<table>', '</table>'];\n\
\n\
map.text =\n\
map.circle =\n\
map.ellipse =\n\
map.line =\n\
map.path =\n\
map.polygon =\n\
map.polyline =\n\
map.rect = [1, '<svg xmlns=\"http://www.w3.org/2000/svg\" version=\"1.1\">','</svg>'];\n\
\n\
/**\n\
 * Parse `html` and return the children.\n\
 *\n\
 * @param {String} html\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function parse(html) {\n\
  if ('string' != typeof html) throw new TypeError('String expected');\n\
  \n\
  // tag name\n\
  var m = /<([\\w:]+)/.exec(html);\n\
  if (!m) return document.createTextNode(html);\n\
\n\
  html = html.replace(/^\\s+|\\s+$/g, ''); // Remove leading/trailing whitespace\n\
\n\
  var tag = m[1];\n\
\n\
  // body support\n\
  if (tag == 'body') {\n\
    var el = document.createElement('html');\n\
    el.innerHTML = html;\n\
    return el.removeChild(el.lastChild);\n\
  }\n\
\n\
  // wrap map\n\
  var wrap = map[tag] || map._default;\n\
  var depth = wrap[0];\n\
  var prefix = wrap[1];\n\
  var suffix = wrap[2];\n\
  var el = document.createElement('div');\n\
  el.innerHTML = prefix + html + suffix;\n\
  while (depth--) el = el.lastChild;\n\
\n\
  // one element\n\
  if (el.firstChild == el.lastChild) {\n\
    return el.removeChild(el.firstChild);\n\
  }\n\
\n\
  // several elements\n\
  var fragment = document.createDocumentFragment();\n\
  while (el.firstChild) {\n\
    fragment.appendChild(el.removeChild(el.firstChild));\n\
  }\n\
\n\
  return fragment;\n\
}\n\
//@ sourceURL=component-domify/index.js"
));
require.register("component-props/index.js", Function("exports, require, module",
"/**\n\
 * Global Names\n\
 */\n\
\n\
var globals = /\\b(Array|Date|Object|Math|JSON)\\b/g;\n\
\n\
/**\n\
 * Return immediate identifiers parsed from `str`.\n\
 *\n\
 * @param {String} str\n\
 * @param {String|Function} map function or prefix\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
module.exports = function(str, fn){\n\
  var p = unique(props(str));\n\
  if (fn && 'string' == typeof fn) fn = prefixed(fn);\n\
  if (fn) return map(str, p, fn);\n\
  return p;\n\
};\n\
\n\
/**\n\
 * Return immediate identifiers in `str`.\n\
 *\n\
 * @param {String} str\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function props(str) {\n\
  return str\n\
    .replace(/\\.\\w+|\\w+ *\\(|\"[^\"]*\"|'[^']*'|\\/([^/]+)\\//g, '')\n\
    .replace(globals, '')\n\
    .match(/[a-zA-Z_]\\w*/g)\n\
    || [];\n\
}\n\
\n\
/**\n\
 * Return `str` with `props` mapped with `fn`.\n\
 *\n\
 * @param {String} str\n\
 * @param {Array} props\n\
 * @param {Function} fn\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function map(str, props, fn) {\n\
  var re = /\\.\\w+|\\w+ *\\(|\"[^\"]*\"|'[^']*'|\\/([^/]+)\\/|[a-zA-Z_]\\w*/g;\n\
  return str.replace(re, function(_){\n\
    if ('(' == _[_.length - 1]) return fn(_);\n\
    if (!~props.indexOf(_)) return _;\n\
    return fn(_);\n\
  });\n\
}\n\
\n\
/**\n\
 * Return unique array.\n\
 *\n\
 * @param {Array} arr\n\
 * @return {Array}\n\
 * @api private\n\
 */\n\
\n\
function unique(arr) {\n\
  var ret = [];\n\
\n\
  for (var i = 0; i < arr.length; i++) {\n\
    if (~ret.indexOf(arr[i])) continue;\n\
    ret.push(arr[i]);\n\
  }\n\
\n\
  return ret;\n\
}\n\
\n\
/**\n\
 * Map with prefix `str`.\n\
 */\n\
\n\
function prefixed(str) {\n\
  return function(_){\n\
    return str + _;\n\
  };\n\
}\n\
//@ sourceURL=component-props/index.js"
));
require.register("component-to-function/index.js", Function("exports, require, module",
"/**\n\
 * Module Dependencies\n\
 */\n\
\n\
var expr = require('props');\n\
\n\
/**\n\
 * Expose `toFunction()`.\n\
 */\n\
\n\
module.exports = toFunction;\n\
\n\
/**\n\
 * Convert `obj` to a `Function`.\n\
 *\n\
 * @param {Mixed} obj\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function toFunction(obj) {\n\
  switch ({}.toString.call(obj)) {\n\
    case '[object Object]':\n\
      return objectToFunction(obj);\n\
    case '[object Function]':\n\
      return obj;\n\
    case '[object String]':\n\
      return stringToFunction(obj);\n\
    case '[object RegExp]':\n\
      return regexpToFunction(obj);\n\
    default:\n\
      return defaultToFunction(obj);\n\
  }\n\
}\n\
\n\
/**\n\
 * Default to strict equality.\n\
 *\n\
 * @param {Mixed} val\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function defaultToFunction(val) {\n\
  return function(obj){\n\
    return val === obj;\n\
  }\n\
}\n\
\n\
/**\n\
 * Convert `re` to a function.\n\
 *\n\
 * @param {RegExp} re\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function regexpToFunction(re) {\n\
  return function(obj){\n\
    return re.test(obj);\n\
  }\n\
}\n\
\n\
/**\n\
 * Convert property `str` to a function.\n\
 *\n\
 * @param {String} str\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function stringToFunction(str) {\n\
  // immediate such as \"> 20\"\n\
  if (/^ *\\W+/.test(str)) return new Function('_', 'return _ ' + str);\n\
\n\
  // properties such as \"name.first\" or \"age > 18\" or \"age > 18 && age < 36\"\n\
  return new Function('_', 'return ' + get(str));\n\
}\n\
\n\
/**\n\
 * Convert `object` to a function.\n\
 *\n\
 * @param {Object} object\n\
 * @return {Function}\n\
 * @api private\n\
 */\n\
\n\
function objectToFunction(obj) {\n\
  var match = {}\n\
  for (var key in obj) {\n\
    match[key] = typeof obj[key] === 'string'\n\
      ? defaultToFunction(obj[key])\n\
      : toFunction(obj[key])\n\
  }\n\
  return function(val){\n\
    if (typeof val !== 'object') return false;\n\
    for (var key in match) {\n\
      if (!(key in val)) return false;\n\
      if (!match[key](val[key])) return false;\n\
    }\n\
    return true;\n\
  }\n\
}\n\
\n\
/**\n\
 * Built the getter function. Supports getter style functions\n\
 *\n\
 * @param {String} str\n\
 * @return {String}\n\
 * @api private\n\
 */\n\
\n\
function get(str) {\n\
  var props = expr(str);\n\
  if (!props.length) return '_.' + str;\n\
\n\
  var val;\n\
  for(var i = 0, prop; prop = props[i]; i++) {\n\
    val = '_.' + prop;\n\
    val = \"('function' == typeof \" + val + \" ? \" + val + \"() : \" + val + \")\";\n\
    str = str.replace(new RegExp(prop, 'g'), val);\n\
  }\n\
\n\
  return str;\n\
}\n\
//@ sourceURL=component-to-function/index.js"
));
require.register("component-enumerable/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Module dependencies.\n\
 */\n\
\n\
var toFunction = require('to-function')\n\
  , proto = {};\n\
\n\
/**\n\
 * Expose `Enumerable`.\n\
 */\n\
\n\
module.exports = Enumerable;\n\
\n\
/**\n\
 * Mixin to `obj`.\n\
 *\n\
 *    var Enumerable = require('enumerable');\n\
 *    Enumerable(Something.prototype);\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Object} obj\n\
 */\n\
\n\
function mixin(obj){\n\
  for (var key in proto) obj[key] = proto[key];\n\
  obj.__iterate__ = obj.__iterate__ || defaultIterator;\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Initialize a new `Enumerable` with the given `obj`.\n\
 *\n\
 * @param {Object} obj\n\
 * @api private\n\
 */\n\
\n\
function Enumerable(obj) {\n\
  if (!(this instanceof Enumerable)) {\n\
    if (Array.isArray(obj)) return new Enumerable(obj);\n\
    return mixin(obj);\n\
  }\n\
  this.obj = obj;\n\
}\n\
\n\
/*!\n\
 * Default iterator utilizing `.length` and subscripts.\n\
 */\n\
\n\
function defaultIterator() {\n\
  var self = this;\n\
  return {\n\
    length: function(){ return self.length },\n\
    get: function(i){ return self[i] }\n\
  }\n\
}\n\
\n\
/**\n\
 * Return a string representation of this enumerable.\n\
 *\n\
 *    [Enumerable [1,2,3]]\n\
 *\n\
 * @return {String}\n\
 * @api public\n\
 */\n\
\n\
Enumerable.prototype.inspect =\n\
Enumerable.prototype.toString = function(){\n\
  return '[Enumerable ' + JSON.stringify(this.obj) + ']';\n\
};\n\
\n\
/**\n\
 * Iterate enumerable.\n\
 *\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
Enumerable.prototype.__iterate__ = function(){\n\
  var obj = this.obj;\n\
  obj.__iterate__ = obj.__iterate__ || defaultIterator;\n\
  return obj.__iterate__();\n\
};\n\
\n\
/**\n\
 * Iterate each value and invoke `fn(val, i)`.\n\
 *\n\
 *    users.each(function(val, i){\n\
 *\n\
 *    })\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Object} self\n\
 * @api public\n\
 */\n\
\n\
proto.each = function(fn){\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
  for (var i = 0; i < len; ++i) {\n\
    fn(vals.get(i), i);\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Map each return value from `fn(val, i)`.\n\
 *\n\
 * Passing a callback function:\n\
 *\n\
 *    users.map(function(user){\n\
 *      return user.name.first\n\
 *    })\n\
 *\n\
 * Passing a property string:\n\
 *\n\
 *    users.map('name.first')\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Enumerable}\n\
 * @api public\n\
 */\n\
\n\
proto.map = function(fn){\n\
  fn = toFunction(fn);\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
  var arr = [];\n\
  for (var i = 0; i < len; ++i) {\n\
    arr.push(fn(vals.get(i), i));\n\
  }\n\
  return new Enumerable(arr);\n\
};\n\
\n\
/**\n\
 * Select all values that return a truthy value of `fn(val, i)`.\n\
 *\n\
 *    users.select(function(user){\n\
 *      return user.age > 20\n\
 *    })\n\
 *\n\
 *  With a property:\n\
 *\n\
 *    items.select('complete')\n\
 *\n\
 * @param {Function|String} fn\n\
 * @return {Enumerable}\n\
 * @api public\n\
 */\n\
\n\
proto.select = function(fn){\n\
  fn = toFunction(fn);\n\
  var val;\n\
  var arr = [];\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
  for (var i = 0; i < len; ++i) {\n\
    val = vals.get(i);\n\
    if (fn(val, i)) arr.push(val);\n\
  }\n\
  return new Enumerable(arr);\n\
};\n\
\n\
/**\n\
 * Select all unique values.\n\
 *\n\
 *    nums.unique()\n\
 *\n\
 * @return {Enumerable}\n\
 * @api public\n\
 */\n\
\n\
proto.unique = function(){\n\
  var val;\n\
  var arr = [];\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
  for (var i = 0; i < len; ++i) {\n\
    val = vals.get(i);\n\
    if (~arr.indexOf(val)) continue;\n\
    arr.push(val);\n\
  }\n\
  return new Enumerable(arr);\n\
};\n\
\n\
/**\n\
 * Reject all values that return a truthy value of `fn(val, i)`.\n\
 *\n\
 * Rejecting using a callback:\n\
 *\n\
 *    users.reject(function(user){\n\
 *      return user.age < 20\n\
 *    })\n\
 *\n\
 * Rejecting with a property:\n\
 *\n\
 *    items.reject('complete')\n\
 *\n\
 * Rejecting values via `==`:\n\
 *\n\
 *    data.reject(null)\n\
 *    users.reject(tobi)\n\
 *\n\
 * @param {Function|String|Mixed} fn\n\
 * @return {Enumerable}\n\
 * @api public\n\
 */\n\
\n\
proto.reject = function(fn){\n\
  var val;\n\
  var arr = [];\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
\n\
  if ('string' == typeof fn) fn = toFunction(fn);\n\
\n\
  if (fn) {\n\
    for (var i = 0; i < len; ++i) {\n\
      val = vals.get(i);\n\
      if (!fn(val, i)) arr.push(val);\n\
    }\n\
  } else {\n\
    for (var i = 0; i < len; ++i) {\n\
      val = vals.get(i);\n\
      if (val != fn) arr.push(val);\n\
    }\n\
  }\n\
\n\
  return new Enumerable(arr);\n\
};\n\
\n\
/**\n\
 * Reject `null` and `undefined`.\n\
 *\n\
 *    [1, null, 5, undefined].compact()\n\
 *    // => [1,5]\n\
 *\n\
 * @return {Enumerable}\n\
 * @api public\n\
 */\n\
\n\
\n\
proto.compact = function(){\n\
  return this.reject(null);\n\
};\n\
\n\
/**\n\
 * Return the first value when `fn(val, i)` is truthy,\n\
 * otherwise return `undefined`.\n\
 *\n\
 *    users.find(function(user){\n\
 *      return user.role == 'admin'\n\
 *    })\n\
 *\n\
 * With a property string:\n\
 *\n\
 *    users.find('age > 20')\n\
 *\n\
 * @param {Function|String} fn\n\
 * @return {Mixed}\n\
 * @api public\n\
 */\n\
\n\
proto.find = function(fn){\n\
  fn = toFunction(fn);\n\
  var val;\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
  for (var i = 0; i < len; ++i) {\n\
    val = vals.get(i);\n\
    if (fn(val, i)) return val;\n\
  }\n\
};\n\
\n\
/**\n\
 * Return the last value when `fn(val, i)` is truthy,\n\
 * otherwise return `undefined`.\n\
 *\n\
 *    users.findLast(function(user){\n\
 *      return user.role == 'admin'\n\
 *    })\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Mixed}\n\
 * @api public\n\
 */\n\
\n\
proto.findLast = function(fn){\n\
  fn = toFunction(fn);\n\
  var ret;\n\
  var val;\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
  for (var i = 0; i < len; ++i) {\n\
    val = vals.get(i);\n\
    if (fn(val, i)) ret = val;\n\
  }\n\
  return ret;\n\
};\n\
\n\
/**\n\
 * Assert that all invocations of `fn(val, i)` are truthy.\n\
 *\n\
 * For example ensuring that all pets are ferrets:\n\
 *\n\
 *    pets.all(function(pet){\n\
 *      return pet.species == 'ferret'\n\
 *    })\n\
 *\n\
 *    users.all('admin')\n\
 *\n\
 * @param {Function|String} fn\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
proto.all =\n\
proto.every = function(fn){\n\
  fn = toFunction(fn);\n\
  var val;\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
  for (var i = 0; i < len; ++i) {\n\
    val = vals.get(i);\n\
    if (!fn(val, i)) return false;\n\
  }\n\
  return true;\n\
};\n\
\n\
/**\n\
 * Assert that none of the invocations of `fn(val, i)` are truthy.\n\
 *\n\
 * For example ensuring that no pets are admins:\n\
 *\n\
 *    pets.none(function(p){ return p.admin })\n\
 *    pets.none('admin')\n\
 *\n\
 * @param {Function|String} fn\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
proto.none = function(fn){\n\
  fn = toFunction(fn);\n\
  var val;\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
  for (var i = 0; i < len; ++i) {\n\
    val = vals.get(i);\n\
    if (fn(val, i)) return false;\n\
  }\n\
  return true;\n\
};\n\
\n\
/**\n\
 * Assert that at least one invocation of `fn(val, i)` is truthy.\n\
 *\n\
 * For example checking to see if any pets are ferrets:\n\
 *\n\
 *    pets.any(function(pet){\n\
 *      return pet.species == 'ferret'\n\
 *    })\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
proto.any = function(fn){\n\
  fn = toFunction(fn);\n\
  var val;\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
  for (var i = 0; i < len; ++i) {\n\
    val = vals.get(i);\n\
    if (fn(val, i)) return true;\n\
  }\n\
  return false;\n\
};\n\
\n\
/**\n\
 * Count the number of times `fn(val, i)` returns true.\n\
 *\n\
 *    var n = pets.count(function(pet){\n\
 *      return pet.species == 'ferret'\n\
 *    })\n\
 *\n\
 * @param {Function} fn\n\
 * @return {Number}\n\
 * @api public\n\
 */\n\
\n\
proto.count = function(fn){\n\
  var val;\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
  var n = 0;\n\
  for (var i = 0; i < len; ++i) {\n\
    val = vals.get(i);\n\
    if (fn(val, i)) ++n;\n\
  }\n\
  return n;\n\
};\n\
\n\
/**\n\
 * Determine the indexof `obj` or return `-1`.\n\
 *\n\
 * @param {Mixed} obj\n\
 * @return {Number}\n\
 * @api public\n\
 */\n\
\n\
proto.indexOf = function(obj){\n\
  var val;\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
  for (var i = 0; i < len; ++i) {\n\
    val = vals.get(i);\n\
    if (val === obj) return i;\n\
  }\n\
  return -1;\n\
};\n\
\n\
/**\n\
 * Check if `obj` is present in this enumerable.\n\
 *\n\
 * @param {Mixed} obj\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
proto.has = function(obj){\n\
  return !! ~this.indexOf(obj);\n\
};\n\
\n\
/**\n\
 * Grep values using the given `re`.\n\
 *\n\
 *    users.map('name').grep(/^tobi/i)\n\
 *\n\
 * @param {RegExp} re\n\
 * @return {Enumerable}\n\
 * @api public\n\
 */\n\
\n\
proto.grep = function(re){\n\
  var val;\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
  var arr = [];\n\
  for (var i = 0; i < len; ++i) {\n\
    val = vals.get(i);\n\
    if (re.test(val)) arr.push(val);\n\
  }\n\
  return new Enumerable(arr);\n\
};\n\
\n\
/**\n\
 * Reduce with `fn(accumulator, val, i)` using\n\
 * optional `init` value defaulting to the first\n\
 * enumerable value.\n\
 *\n\
 * @param {Function} fn\n\
 * @param {Mixed} [val]\n\
 * @return {Mixed}\n\
 * @api public\n\
 */\n\
\n\
proto.reduce = function(fn, init){\n\
  var val;\n\
  var i = 0;\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
\n\
  val = null == init\n\
    ? vals.get(i++)\n\
    : init;\n\
\n\
  for (; i < len; ++i) {\n\
    val = fn(val, vals.get(i), i);\n\
  }\n\
\n\
  return val;\n\
};\n\
\n\
/**\n\
 * Determine the max value.\n\
 *\n\
 * With a callback function:\n\
 *\n\
 *    pets.max(function(pet){\n\
 *      return pet.age\n\
 *    })\n\
 *\n\
 * With property strings:\n\
 *\n\
 *    pets.max('age')\n\
 *\n\
 * With immediate values:\n\
 *\n\
 *    nums.max()\n\
 *\n\
 * @param {Function|String} fn\n\
 * @return {Number}\n\
 * @api public\n\
 */\n\
\n\
proto.max = function(fn){\n\
  var val;\n\
  var n = 0;\n\
  var max = 0;\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
\n\
  if (fn) {\n\
    fn = toFunction(fn);\n\
    for (var i = 0; i < len; ++i) {\n\
      n = fn(vals.get(i), i);\n\
      max = n > max ? n : max;\n\
    }\n\
  } else {\n\
    for (var i = 0; i < len; ++i) {\n\
      n = vals.get(i);\n\
      max = n > max ? n : max;\n\
    }\n\
  }\n\
\n\
  return max;\n\
};\n\
\n\
/**\n\
 * Determine the sum.\n\
 *\n\
 * With a callback function:\n\
 *\n\
 *    pets.sum(function(pet){\n\
 *      return pet.age\n\
 *    })\n\
 *\n\
 * With property strings:\n\
 *\n\
 *    pets.sum('age')\n\
 *\n\
 * With immediate values:\n\
 *\n\
 *    nums.sum()\n\
 *\n\
 * @param {Function|String} fn\n\
 * @return {Number}\n\
 * @api public\n\
 */\n\
\n\
proto.sum = function(fn){\n\
  var ret;\n\
  var n = 0;\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
\n\
  if (fn) {\n\
    fn = toFunction(fn);\n\
    for (var i = 0; i < len; ++i) {\n\
      n += fn(vals.get(i), i);\n\
    }\n\
  } else {\n\
    for (var i = 0; i < len; ++i) {\n\
      n += vals.get(i);\n\
    }\n\
  }\n\
\n\
  return n;\n\
};\n\
\n\
/**\n\
 * Determine the average value.\n\
 *\n\
 * With a callback function:\n\
 *\n\
 *    pets.avg(function(pet){\n\
 *      return pet.age\n\
 *    })\n\
 *\n\
 * With property strings:\n\
 *\n\
 *    pets.avg('age')\n\
 *\n\
 * With immediate values:\n\
 *\n\
 *    nums.avg()\n\
 *\n\
 * @param {Function|String} fn\n\
 * @return {Number}\n\
 * @api public\n\
 */\n\
\n\
proto.avg =\n\
proto.mean = function(fn){\n\
  var ret;\n\
  var n = 0;\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
\n\
  if (fn) {\n\
    fn = toFunction(fn);\n\
    for (var i = 0; i < len; ++i) {\n\
      n += fn(vals.get(i), i);\n\
    }\n\
  } else {\n\
    for (var i = 0; i < len; ++i) {\n\
      n += vals.get(i);\n\
    }\n\
  }\n\
\n\
  return n / len;\n\
};\n\
\n\
/**\n\
 * Return the first value, or first `n` values.\n\
 *\n\
 * @param {Number|Function} [n]\n\
 * @return {Array|Mixed}\n\
 * @api public\n\
 */\n\
\n\
proto.first = function(n){\n\
  if ('function' == typeof n) return this.find(n);\n\
  var vals = this.__iterate__();\n\
\n\
  if (n) {\n\
    var len = Math.min(n, vals.length());\n\
    var arr = new Array(len);\n\
    for (var i = 0; i < len; ++i) {\n\
      arr[i] = vals.get(i);\n\
    }\n\
    return arr;\n\
  }\n\
\n\
  return vals.get(0);\n\
};\n\
\n\
/**\n\
 * Return the last value, or last `n` values.\n\
 *\n\
 * @param {Number|Function} [n]\n\
 * @return {Array|Mixed}\n\
 * @api public\n\
 */\n\
\n\
proto.last = function(n){\n\
  if ('function' == typeof n) return this.findLast(n);\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
\n\
  if (n) {\n\
    var i = Math.max(0, len - n);\n\
    var arr = [];\n\
    for (; i < len; ++i) {\n\
      arr.push(vals.get(i));\n\
    }\n\
    return arr;\n\
  }\n\
\n\
  return vals.get(len - 1);\n\
};\n\
\n\
/**\n\
 * Return values in groups of `n`.\n\
 *\n\
 * @param {Number} n\n\
 * @return {Enumerable}\n\
 * @api public\n\
 */\n\
\n\
proto.inGroupsOf = function(n){\n\
  var arr = [];\n\
  var group = [];\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
\n\
  for (var i = 0; i < len; ++i) {\n\
    group.push(vals.get(i));\n\
    if ((i + 1) % n == 0) {\n\
      arr.push(group);\n\
      group = [];\n\
    }\n\
  }\n\
\n\
  if (group.length) arr.push(group);\n\
\n\
  return new Enumerable(arr);\n\
};\n\
\n\
/**\n\
 * Return the value at the given index.\n\
 *\n\
 * @param {Number} i\n\
 * @return {Mixed}\n\
 * @api public\n\
 */\n\
\n\
proto.at = function(i){\n\
  return this.__iterate__().get(i);\n\
};\n\
\n\
/**\n\
 * Return a regular `Array`.\n\
 *\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
proto.toJSON =\n\
proto.array = function(){\n\
  var arr = [];\n\
  var vals = this.__iterate__();\n\
  var len = vals.length();\n\
  for (var i = 0; i < len; ++i) {\n\
    arr.push(vals.get(i));\n\
  }\n\
  return arr;\n\
};\n\
\n\
/**\n\
 * Return the enumerable value.\n\
 *\n\
 * @return {Mixed}\n\
 * @api public\n\
 */\n\
\n\
proto.value = function(){\n\
  return this.obj;\n\
};\n\
\n\
/**\n\
 * Mixin enumerable.\n\
 */\n\
\n\
mixin(Enumerable.prototype);\n\
//@ sourceURL=component-enumerable/index.js"
));
require.register("component-range/index.js", Function("exports, require, module",
"\n\
module.exports = function(from, to, inclusive){\n\
  var ret = [];\n\
  if (inclusive) to++;\n\
\n\
  for (var n = from; n < to; ++n) {\n\
    ret.push(n);\n\
  }\n\
\n\
  return ret;\n\
}//@ sourceURL=component-range/index.js"
));
require.register("component-emitter/index.js", Function("exports, require, module",
"\n\
/**\n\
 * Expose `Emitter`.\n\
 */\n\
\n\
module.exports = Emitter;\n\
\n\
/**\n\
 * Initialize a new `Emitter`.\n\
 *\n\
 * @api public\n\
 */\n\
\n\
function Emitter(obj) {\n\
  if (obj) return mixin(obj);\n\
};\n\
\n\
/**\n\
 * Mixin the emitter properties.\n\
 *\n\
 * @param {Object} obj\n\
 * @return {Object}\n\
 * @api private\n\
 */\n\
\n\
function mixin(obj) {\n\
  for (var key in Emitter.prototype) {\n\
    obj[key] = Emitter.prototype[key];\n\
  }\n\
  return obj;\n\
}\n\
\n\
/**\n\
 * Listen on the given `event` with `fn`.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.on =\n\
Emitter.prototype.addEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
  (this._callbacks[event] = this._callbacks[event] || [])\n\
    .push(fn);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Adds an `event` listener that will be invoked a single\n\
 * time then automatically removed.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.once = function(event, fn){\n\
  var self = this;\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  function on() {\n\
    self.off(event, on);\n\
    fn.apply(this, arguments);\n\
  }\n\
\n\
  on.fn = fn;\n\
  this.on(event, on);\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Remove the given callback for `event` or all\n\
 * registered callbacks.\n\
 *\n\
 * @param {String} event\n\
 * @param {Function} fn\n\
 * @return {Emitter}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.off =\n\
Emitter.prototype.removeListener =\n\
Emitter.prototype.removeAllListeners =\n\
Emitter.prototype.removeEventListener = function(event, fn){\n\
  this._callbacks = this._callbacks || {};\n\
\n\
  // all\n\
  if (0 == arguments.length) {\n\
    this._callbacks = {};\n\
    return this;\n\
  }\n\
\n\
  // specific event\n\
  var callbacks = this._callbacks[event];\n\
  if (!callbacks) return this;\n\
\n\
  // remove all handlers\n\
  if (1 == arguments.length) {\n\
    delete this._callbacks[event];\n\
    return this;\n\
  }\n\
\n\
  // remove specific handler\n\
  var cb;\n\
  for (var i = 0; i < callbacks.length; i++) {\n\
    cb = callbacks[i];\n\
    if (cb === fn || cb.fn === fn) {\n\
      callbacks.splice(i, 1);\n\
      break;\n\
    }\n\
  }\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Emit `event` with the given args.\n\
 *\n\
 * @param {String} event\n\
 * @param {Mixed} ...\n\
 * @return {Emitter}\n\
 */\n\
\n\
Emitter.prototype.emit = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  var args = [].slice.call(arguments, 1)\n\
    , callbacks = this._callbacks[event];\n\
\n\
  if (callbacks) {\n\
    callbacks = callbacks.slice(0);\n\
    for (var i = 0, len = callbacks.length; i < len; ++i) {\n\
      callbacks[i].apply(this, args);\n\
    }\n\
  }\n\
\n\
  return this;\n\
};\n\
\n\
/**\n\
 * Return array of callbacks for `event`.\n\
 *\n\
 * @param {String} event\n\
 * @return {Array}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.listeners = function(event){\n\
  this._callbacks = this._callbacks || {};\n\
  return this._callbacks[event] || [];\n\
};\n\
\n\
/**\n\
 * Check if this emitter has `event` handlers.\n\
 *\n\
 * @param {String} event\n\
 * @return {Boolean}\n\
 * @api public\n\
 */\n\
\n\
Emitter.prototype.hasListeners = function(event){\n\
  return !! this.listeners(event).length;\n\
};\n\
//@ sourceURL=component-emitter/index.js"
));
require.register("component-in-groups-of/index.js", Function("exports, require, module",
"\n\
module.exports = function(arr, n){\n\
  var ret = [];\n\
  var group = [];\n\
  var len = arr.length;\n\
  var per = len * (n / len);\n\
\n\
  for (var i = 0; i < len; ++i) {\n\
    group.push(arr[i]);\n\
    if ((i + 1) % n == 0) {\n\
      ret.push(group);\n\
      group = [];\n\
    }\n\
  }\n\
\n\
  if (group.length) ret.push(group);\n\
\n\
  return ret;\n\
};//@ sourceURL=component-in-groups-of/index.js"
));
require.register("damonoehlman-formatter/index.js", Function("exports, require, module",
"/* jshint node: true */\n\
'use strict';\n\
\n\
var reVariable = /\\{\\{\\s*([^\\}]+?)\\s*\\}\\}/;\n\
var mods = require('./mods');\n\
\n\
/**\n\
  # formatter\n\
\n\
  This is a simple library designed to do one thing and one thing only -\n\
  replace variables in strings with variable values.  It is built in such a\n\
  way that the formatter strings are parsed and you are provided with a\n\
  function than can efficiently be called to provide the custom output.\n\
\n\
  ## Example Usage\n\
\n\
  <<< examples/likefood.js\n\
\n\
  __NOTE__: Formatter is not designed to be a templating library and if\n\
  you are already using something like Handlebars or\n\
  [hogan](https://github.com/twitter/hogan.js) in your library or application\n\
  stack consider using them instead.\n\
\n\
  ## Using named variables\n\
\n\
  In the examples above we saw how the formatter can be used to replace\n\
  function arguments in a formatter string.  We can also set up a formatter\n\
  to use particular key values from an input string instead if that is more\n\
  suitable:\n\
\n\
  <<< examples/likefood-named.js\n\
\n\
  ## Nested Property Values\n\
\n\
  Since version `0.1.0` you can also access nested property values, as you\n\
  can with templates like handlebars.\n\
\n\
  ## Partial Execution\n\
\n\
  Since version `0.3.x` formatter also supports partial execution when using\n\
  indexed arguments (e.g. `{{ 0 }}`, `{{ 1 }}`, etc).  For example:\n\
\n\
  <<< examples/partial.js\n\
\n\
  In the case above, the original formatter function returned by `formatter`\n\
  did not receive enough values to resolve all the required variables.  As\n\
  such it returned a function ready to accept the remaining values.\n\
\n\
  Once all values have been received the output will be generated.\n\
\n\
  ## Command Line Usage\n\
\n\
  If installed globally (or accessed through `npm bin`) you can run formatter\n\
  as in a CLI.  It's behaviour is pretty simple whereby it takes every \n\
  argument specified with preceding double-dash (e.g. `--name=Bob`) and\n\
  creates a data object using those variables.  Any remaining variables are\n\
  then passed in as numbered args.\n\
\n\
  So if we had a text file (template.txt):\n\
\n\
  ```\n\
  Welcome to {{ 0 }}, {{ name }}!\n\
  ```\n\
\n\
  Then we would be able to execute formatter like so to generate the expanded\n\
  output to `stdout`:\n\
\n\
  ```\n\
  formatter --name=\"Fred Flintstone\" Australia < test/template.txt\n\
  ```\n\
\n\
  produces:\n\
\n\
  ```\n\
  Welcome to Australia, Fred Flintstone!\n\
  ```\n\
\n\
**/\n\
\n\
var formatter = module.exports = function(format, opts) {\n\
  // extract the matches from the string\n\
  var parts = [];\n\
  var output = [];\n\
  var chunk;\n\
  var varname;\n\
  var varParts;\n\
  var match = reVariable.exec(format);\n\
  var isNumeric;\n\
  var outputIdx = 0;\n\
  var ignoreNumeric = (opts || {}).ignoreNumeric;\n\
\n\
  while (match) {\n\
    // get the prematch chunk\n\
    chunk = format.slice(0, match.index);\n\
    \n\
    // if we have a valid chunk, add it to the parts\n\
    if (chunk) {\n\
      output[outputIdx++] = chunk;\n\
    }\n\
    \n\
    varParts = match[1].split(/\\s*\\|\\s*/);\n\
    match[1] = varParts[0];\n\
    \n\
    // extract the varname\n\
    varname = parseInt(match[1], 10);\n\
    isNumeric = !isNaN(varname);\n\
\n\
    // if this is a numeric replacement expression, and we are ignoring\n\
    // those expressions then pass it through to the output\n\
    if (ignoreNumeric && isNumeric) {\n\
      output[outputIdx++] = match[0];\n\
    }\n\
    // otherwise, handle normally\n\
    else {\n\
      // extract the expression and add it as a function\n\
      parts[parts.length] = {\n\
        idx: (outputIdx++),\n\
        numeric: isNumeric,\n\
        varname: isNumeric ? varname : match[1],\n\
        modifiers: varParts.length > 1 ? createModifiers(varParts.slice(1)) : []\n\
      };\n\
    }\n\
\n\
    // remove this matched chunk and replacer from the string\n\
    format = format.slice(match.index + match[0].length);\n\
\n\
    // check for the next match\n\
    match = reVariable.exec(format);\n\
  }\n\
  \n\
  // if we still have some of the format string remaining, add it to the list\n\
  if (format) {\n\
    output[outputIdx++] = format;\n\
  }\n\
\n\
  return collect(parts, output);\n\
};\n\
\n\
formatter.error = function(message) {\n\
  // create the format\n\
  var format = formatter(message);\n\
  \n\
  return function(err) {\n\
    var output;\n\
    \n\
    // if no error has been supplied, then pass it straight through\n\
    if (! err) {\n\
      return;\n\
    }\n\
\n\
    output = new Error(\n\
      format.apply(null, Array.prototype.slice.call(arguments, 1)));\n\
\n\
    output._original = err;\n\
\n\
    // return the new error\n\
    return output;\n\
  };\n\
};\n\
\n\
function collect(parts, resolved, indexShift) {\n\
  // default optionals\n\
  indexShift = indexShift || 0;\n\
\n\
  return function() {\n\
    var output = [].concat(resolved);\n\
    var unresolved;\n\
    var ii;\n\
    var part;\n\
    var partIdx;\n\
    var propNames;\n\
    var val;\n\
    var numericResolved = [];\n\
\n\
    // find the unresolved parts\n\
    unresolved = parts.filter(function(part) {\n\
      return typeof output[part.idx] == 'undefined';\n\
    });\n\
\n\
    // initialise the counter\n\
    ii = unresolved.length;\n\
\n\
    // iterate through the unresolved parts and attempt to resolve the value\n\
    for (; ii--; ) {\n\
      part = unresolved[ii];\n\
\n\
      if (typeof part == 'object') {\n\
        // if this is a numeric part, this is a simple index lookup\n\
        if (part.numeric) {\n\
          partIdx = part.varname - indexShift;\n\
          if (arguments.length > partIdx) {\n\
            output[part.idx] = arguments[partIdx];\n\
            if (numericResolved.indexOf(part.varname) < 0) {\n\
              numericResolved[numericResolved.length] = part.varname;\n\
            }\n\
          }\n\
        }\n\
        // otherwise, we are doing a recursive property search\n\
        else if (arguments.length > 0) {\n\
          propNames = (part.varname || '').split('.');\n\
\n\
          // initialise the output from the last valid argument\n\
          output[part.idx] = (arguments[arguments.length - 1] || {});\n\
          while (output[part.idx] && propNames.length > 0) {\n\
            val = output[part.idx][propNames.shift()];\n\
            output[part.idx] = typeof val != 'undefined' ? val : '';\n\
          }\n\
        }\n\
\n\
        // if the output was resolved, then apply the modifier\n\
        if (typeof output[part.idx] != 'undefined' && part.modifiers) {\n\
          output[part.idx] = applyModifiers(part.modifiers, output[part.idx]);\n\
        }\n\
      }\n\
    }\n\
\n\
    // reasses unresolved (only caring about numeric parts)\n\
    unresolved = parts.filter(function(part) {\n\
      return part.numeric && typeof output[part.idx] == 'undefined';\n\
    });\n\
\n\
    // if we have no unresolved parts, then return the value\n\
    if (unresolved.length === 0) {\n\
      return output.join('');\n\
    }\n\
\n\
    // otherwise, return the collect function again\n\
    return collect(\n\
      parts,\n\
      output,\n\
      indexShift + numericResolved.length\n\
    );\n\
  };\n\
}\n\
\n\
function applyModifiers(modifiers, value) {\n\
  // if we have modifiers, then tweak the output\n\
  for (var ii = 0, count = modifiers.length; ii < count; ii++) {\n\
    value = modifiers[ii](value);\n\
  }\n\
\n\
  return value;\n\
}\n\
\n\
function createModifiers(modifierStrings) {\n\
  var modifiers = [];\n\
  var parts;\n\
  var fn;\n\
  \n\
  for (var ii = 0, count = modifierStrings.length; ii < count; ii++) {\n\
    parts = modifierStrings[ii].split(':');\n\
    fn = mods[parts[0].toLowerCase()];\n\
    \n\
    if (fn) {\n\
      modifiers[modifiers.length] = fn.apply(null, parts.slice(1));\n\
    }\n\
  }\n\
  \n\
  return modifiers;\n\
}\n\
//@ sourceURL=damonoehlman-formatter/index.js"
));
require.register("damonoehlman-formatter/mods.js", Function("exports, require, module",
"/* jshint node: true */\n\
'use strict';\n\
\n\
/**\n\
  ## Modifiers\n\
\n\
**/\n\
\n\
/**\n\
  ### Length Modifier (len)\n\
\n\
  The length modifier is used to ensure that a string is exactly the length specified.  The string is sliced to the required max length, and then padded out with spaces (or a specified character) to meet the required length.\n\
\n\
  ```js\n\
  // pad the string test to 10 characters\n\
  formatter('{{ 0|len:10 }}')('test');   // 'test      '\n\
\n\
  // pad the string test to 10 characters, using a as the padding character\n\
  formatter('{{ 0|len:10:a }}')('test'); // 'testaaaaaa'\n\
  ```\n\
**/\n\
exports.len = function(length, padder) {\n\
  var testInt = parseInt(padder, 10);\n\
  var isNumber;\n\
\n\
  // default the padder to a space\n\
  padder = (! isNaN(testInt)) ? testInt : (padder || ' ');\n\
\n\
  // check whether we have a number for padding (we will pad left if we do)\n\
  isNumber = typeof padder == 'number';\n\
  \n\
  return function(input) {\n\
    var output = input.toString().slice(0, length);\n\
    \n\
    // pad the string to the required length\n\
    while (output.length < length) {\n\
      output = isNumber ? padder + output : output + padder;\n\
    }\n\
    \n\
    return output;\n\
  };\n\
};//@ sourceURL=damonoehlman-formatter/mods.js"
));

require.register("clock/index.js", Function("exports, require, module",
"module.exports = require('./lib/clock.js');//@ sourceURL=clock/index.js"
));
require.register("clock/lib/clock.js", Function("exports, require, module",
"var Emitter = require('emitter');\n\
var inGroupsOf = require('in-groups-of');\n\
var range = require('range');\n\
var formatter = require('formatter');\n\
var domify = require('domify');\n\
var events = require('events');\n\
var dataset = require('dataset');\n\
var classes = require('classes');\n\
var timerange = require('./timerange');\n\
var enumerable = require('enumerable');\n\
\n\
module.exports = Clock;\n\
\n\
var minuteStep = 5;\n\
\n\
var format = {\n\
  table: formatter('<table class=\"{{ 1 }}\"><caption>{{ 0 }}</caption><tbody>{{ 2 }}</tbody></table>'),\n\
  cell: formatter('<td><a href=\"#\" data-{{ 1 }}=\"{{ 0 }}\">{{ 0 }}</a></td>'),\n\
  query: formatter('a[data-{{ 0 }}=\"{{ 1 }}\"]')\n\
};\n\
\n\
function renderTable(caption, type, rows) {\n\
  var tbody = rows.map(function(row) {\n\
      return '<tr>' + row.join('') + '</tr>';\n\
    }).join('');\n\
  return format.table(caption, type, tbody);\n\
}\n\
\n\
function renderHours() {\n\
  var hours = range(0, 24).map(function(hour) {\n\
    return format.cell(hour, 'hour');\n\
  });\n\
  return renderTable('Hours', 'hour', inGroupsOf(hours, 6));\n\
}\n\
\n\
function renderMinutes() {\n\
  var minutes = range(0, 12).map(function(minute) {\n\
    return format.cell(minute * minuteStep, 'minute');\n\
  });\n\
  return renderTable('Minutes', 'minute', inGroupsOf(minutes, 3));\n\
}\n\
\n\
function renderClock() {\n\
  var html = [\n\
    '<table class=\"clock\"><tr>',\n\
    '<td>' + renderHours() + '</td>',\n\
    '<td>' + renderMinutes() + '</td>',\n\
    '</tr></table>'\n\
  ].join('');\n\
  return domify(html);\n\
}\n\
\n\
function coerceMinutes(minutes) {\n\
  if (!minutes) {\n\
    return 0;\n\
  }\n\
  minutes -= (minutes % minuteStep);\n\
  return minutes;\n\
}\n\
\n\
function markInvalid(nodes, kind, isValid) {\n\
  nodes.each(function(node) {\n\
    var cl = classes(node),\n\
      v = dataset(node, kind);\n\
    if (isValid(v)) {\n\
      cl.remove('invalid');\n\
    } else {\n\
      cl.add('invalid');\n\
    }\n\
  });\n\
}\n\
\n\
function Clock() {\n\
  Emitter.call(this);\n\
  this.selected = {};\n\
  this.el = renderClock();\n\
  this.events = events(this.el, this);\n\
  this.events.bind('click .hour a', 'onhour');\n\
  this.events.bind('click .minute a', 'onminute');\n\
  this.valid = timerange();\n\
}\n\
\n\
Emitter(Clock.prototype);\n\
\n\
Clock.prototype.onhour = function(e) {\n\
  this.onclick('hour', e.target);\n\
  e.preventDefault();\n\
};\n\
\n\
Clock.prototype.onminute = function(e) {\n\
  this.onclick('minute', e.target);\n\
  e.preventDefault();\n\
};\n\
\n\
Clock.prototype.onclick = function(kind, a) {\n\
  var value = dataset(a, kind);\n\
  if (!classes(a).has('invalid')) {\n\
    this.selected[kind] = parseInt(value, 10);\n\
    this.selectImpl(kind, this.selected[kind]);\n\
    if (kind === 'hour') {\n\
      this.selected = this.adjustMinutes(this.selected);\n\
      this.markInvalid(this.selected.hour);\n\
    }\n\
    this.emit('change', this.selected, this.isComplete(kind));\n\
  }\n\
};\n\
\n\
Clock.prototype.select = function(hm) {\n\
  hm.minute = coerceMinutes(hm.minute);\n\
  this.selectImpl('hour', hm.hour);\n\
  this.selectImpl('minute',  hm.minute);\n\
  this.selected = hm;\n\
  this.markInvalid(this.selected.hour);\n\
  return this;\n\
};\n\
\n\
Clock.prototype.querySelector = function(kind, selector) {\n\
  return this.el.querySelector('.' + kind + ' ' + selector);\n\
};\n\
\n\
Clock.prototype.querySelectorAll = function(kind, selector) {\n\
  return enumerable(this.el.querySelectorAll('.' + kind + ' ' + selector));\n\
};\n\
\n\
Clock.prototype.selectImpl = function(kind, value) {\n\
  var selected = this.querySelector(kind, '.selected a');\n\
  // deselect\n\
  if (selected) {\n\
    if (value === dataset(selected, kind)) {\n\
      // all is well\n\
      return;\n\
    }\n\
    classes(selected.parentNode).remove('selected');\n\
  }\n\
  // select\n\
  selected = this.querySelector(kind, format.query(kind, value));\n\
  if (selected) {\n\
    classes(selected.parentNode).add('selected');\n\
  }\n\
};\n\
\n\
/**\n\
 * Called when hour changes as a result of select, or as a result of the click on the calendar.\n\
 * It may means that we might need to adjust minute value and recalculate 'invalid' state of\n\
 * minute cells.\n\
 */\n\
Clock.prototype.adjustMinutes = function(hm) {\n\
    var adjusted;\n\
    if (hm.minute !== undefined) {\n\
      adjusted = this.valid.restrict(hm);\n\
      if (adjusted.minute != hm.minute) {\n\
        this.selectImpl('minute', adjusted.minute);\n\
      }\n\
    }\n\
    return adjusted ? adjusted : hm;\n\
};\n\
\n\
Clock.prototype.markInvalid = function(selectedHour, both) {\n\
  var valid = this.valid;\n\
  if (both) {\n\
    markInvalid(this.querySelectorAll('hour', 'a'), 'hour', function(hour) {\n\
      return valid.isValidHour(hour);\n\
    });\n\
  }\n\
  markInvalid(this.querySelectorAll('minute', 'a'), 'minute', function(minute) {\n\
    return valid.isValidMinute(selectedHour, minute);\n\
  });\n\
};\n\
\n\
Clock.prototype.isComplete = function(kind) {\n\
  this._complete = this._complete || {};\n\
  if (kind) {\n\
    this._complete[kind] = true;\n\
  }\n\
  if (this._complete.hour && this._complete.minute) {\n\
    this._complete = {}; // reset complete\n\
    return true;\n\
  }\n\
};\n\
\n\
Clock.prototype.resetComplete = function() {\n\
  this._complete = {};\n\
  return this;\n\
};\n\
\n\
Clock.prototype.min = function(v) {\n\
  if (!arguments.length) {\n\
    return this.valid.min();\n\
  }\n\
  this.valid.min(v);\n\
  this.markInvalid(this.selected.hour, true);\n\
  return this;\n\
};\n\
\n\
Clock.prototype.max = function(v) {\n\
  if (!arguments.length) {\n\
    return this.valid.max();\n\
  }\n\
  this.valid.max(v);\n\
  this.markInvalid(this.selected.hour, true);\n\
  return this;\n\
};//@ sourceURL=clock/lib/clock.js"
));
require.register("clock/lib/timerange.js", Function("exports, require, module",
"var bounds = require('bounds');\n\
\n\
module.exports = timeRange;\n\
\n\
function timeRange() {\n\
  var self;\n\
\n\
  /**\n\
   * For standard range:\n\
   * Hour is valid if any of the hour:minute combination is in bounds\n\
   * it is invalid, if its 59th minute is before or if the 0th minute is after\n\
   */\n\
  function isValidHour(hour) {\n\
    var min, max;\n\
    min = self.min() ? self.min().hour : 0;\n\
    max = self.max() ? self.max().hour : 23;\n\
    if (self.reversed()) {\n\
      return hour <= max || min <= hour;\n\
    }\n\
    return min <= hour && hour <= max;\n\
  }\n\
\n\
  function isValidMinute(hour, minute) {\n\
    var v = {\n\
      hour: hour,\n\
      minute: minute\n\
    };\n\
    if (hour === undefined) {\n\
      return true;\n\
    }\n\
    if (self.reversed()) {\n\
      return !self.after(v) || !self.before(v);\n\
    }\n\
    return self.in(v);\n\
  }\n\
\n\
  // mixin bounds\n\
  self = bounds({\n\
    isValidHour: isValidHour,\n\
    isValidMinute: isValidMinute\n\
  });\n\
\n\
  self.compare(function(a, b) {\n\
    if(a.hour < b.hour) {\n\
      return -1;\n\
    }\n\
    if(a.hour > b.hour) {\n\
      return 1;\n\
    }\n\
    if(a.minute < b.minute) {\n\
      return -1;\n\
    }\n\
    if(a.minute > b.minute) {\n\
      return 1;\n\
    }\n\
    return 0;\n\
  });\n\
\n\
  self.distance(function(a, b) {\n\
    return 60 * Math.abs(a.hour - b.hour) + Math.abs(a.minute - b.minute);\n\
  });\n\
\n\
  return self;\n\
}//@ sourceURL=clock/lib/timerange.js"
));


























require.alias("code42day-bounds/index.js", "clock/deps/bounds/index.js");
require.alias("code42day-bounds/index.js", "bounds/index.js");
require.alias("component-clone/index.js", "code42day-bounds/deps/clone/index.js");
require.alias("component-type/index.js", "component-clone/deps/type/index.js");

require.alias("code42day-dataset/index.js", "clock/deps/dataset/index.js");
require.alias("code42day-dataset/index.js", "dataset/index.js");

require.alias("component-events/index.js", "clock/deps/events/index.js");
require.alias("component-events/index.js", "events/index.js");
require.alias("component-event/index.js", "component-events/deps/event/index.js");

require.alias("component-delegate/index.js", "component-events/deps/delegate/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("discore-closest/index.js", "component-delegate/deps/closest/index.js");
require.alias("component-matches-selector/index.js", "discore-closest/deps/matches-selector/index.js");
require.alias("component-query/index.js", "component-matches-selector/deps/query/index.js");

require.alias("discore-closest/index.js", "discore-closest/index.js");
require.alias("component-event/index.js", "component-delegate/deps/event/index.js");

require.alias("component-classes/index.js", "clock/deps/classes/index.js");
require.alias("component-classes/index.js", "classes/index.js");
require.alias("component-indexof/index.js", "component-classes/deps/indexof/index.js");

require.alias("component-clone/index.js", "clock/deps/clone/index.js");
require.alias("component-clone/index.js", "clone/index.js");
require.alias("component-type/index.js", "component-clone/deps/type/index.js");

require.alias("component-domify/index.js", "clock/deps/domify/index.js");
require.alias("component-domify/index.js", "domify/index.js");

require.alias("component-enumerable/index.js", "clock/deps/enumerable/index.js");
require.alias("component-enumerable/index.js", "enumerable/index.js");
require.alias("component-to-function/index.js", "component-enumerable/deps/to-function/index.js");
require.alias("component-props/index.js", "component-to-function/deps/props/index.js");

require.alias("component-range/index.js", "clock/deps/range/index.js");
require.alias("component-range/index.js", "range/index.js");

require.alias("component-emitter/index.js", "clock/deps/emitter/index.js");
require.alias("component-emitter/index.js", "emitter/index.js");

require.alias("component-in-groups-of/index.js", "clock/deps/in-groups-of/index.js");
require.alias("component-in-groups-of/index.js", "in-groups-of/index.js");

require.alias("damonoehlman-formatter/index.js", "clock/deps/formatter/index.js");
require.alias("damonoehlman-formatter/mods.js", "clock/deps/formatter/mods.js");
require.alias("damonoehlman-formatter/index.js", "clock/deps/formatter/index.js");
require.alias("damonoehlman-formatter/index.js", "formatter/index.js");
require.alias("damonoehlman-formatter/index.js", "damonoehlman-formatter/index.js");
