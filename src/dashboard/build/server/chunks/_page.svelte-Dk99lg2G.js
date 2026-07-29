import { ah as getContext, ar as run, F as setContext, an as head, aw as ssr_context, _ as derived, ao as attr, af as attr_class, ag as clsx, al as attr_style, ax as attributes, am as stringify, ay as to_array, az as hasContext, as as invalid_default_snippet, ak as ensure_array_like, av as bind_props, aA as is_array, aB as get_prototype_of, aC as object_prototype, aD as exclude_from_object, aq as spread_props, aE as css_props, at as fallback } from './index2-BZw6XBxw.js';
import { e as escape_html } from './escaping-CqgfEcN3.js';
import './root-C1YRfNi1.js';
import './exports-7ECo9oy7.js';
import './state.svelte-CUwS-0Sk.js';
import { T as ToastContainer, B as BootstrapToast } from './FlatToast.svelte_svelte_type_style_lang-D6FAcbYs.js';
import './marked.esm-DcwJ8j7Z.js';
import { G as GRAPH_VERSION, C as CATEGORY_META, i as iconFor, a as CATEGORY_ORDER, c as categoryOf, h as humanDuration, p as parseDuration, s as summarise } from './nodes-CSxZ13o1.js';
import { v as v4, E as EmojiPicker } from './EmojiPicker-DrJBaNjd.js';
import './index-DzicF7-d.js';
import 'crypto';
import './index-BgrcMwvp.js';
import './_commonjsHelpers-BFTU3MAI.js';

var noop = {value: () => {}};

function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}

function Dispatch(_) {
  this._ = _;
}

function parseTypenames$1(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return {type: t, name: name};
  });
}

Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._,
        T = parseTypenames$1(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
      return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
      else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
    }

    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _) copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  }
};

function get$1(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$1(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({name: name, value: callback});
  return type;
}

var xhtml = "http://www.w3.org/1999/xhtml";

var namespaces = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

function namespace(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name; // eslint-disable-line no-prototype-builtins
}

function creatorInherit(name) {
  return function() {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml && document.documentElement.namespaceURI === xhtml
        ? document.createElement(name)
        : document.createElementNS(uri, name);
  };
}

function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

function creator(name) {
  var fullname = namespace(name);
  return (fullname.local
      ? creatorFixed
      : creatorInherit)(fullname);
}

function none() {}

function selector(selector) {
  return selector == null ? none : function() {
    return this.querySelector(selector);
  };
}

function selection_select(select) {
  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection$2(subgroups, this._parents);
}

// Given something array like (or null), returns something that is strictly an
// array. This is used to ensure that array-like objects passed to d3.selectAll
// or selection.selectAll are converted into proper arrays when creating a
// selection; we don’t ever want to create a selection backed by a live
// HTMLCollection or NodeList. However, note that selection.selectAll will use a
// static NodeList as a group, since it safely derived from querySelectorAll.
function array(x) {
  return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
}

function empty$1() {
  return [];
}

function selectorAll(selector) {
  return selector == null ? empty$1 : function() {
    return this.querySelectorAll(selector);
  };
}

function arrayAll(select) {
  return function() {
    return array(select.apply(this, arguments));
  };
}

function selection_selectAll(select) {
  if (typeof select === "function") select = arrayAll(select);
  else select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection$2(subgroups, parents);
}

function matcher(selector) {
  return function() {
    return this.matches(selector);
  };
}

function childMatcher(selector) {
  return function(node) {
    return node.matches(selector);
  };
}

var find = Array.prototype.find;

function childFind(match) {
  return function() {
    return find.call(this.children, match);
  };
}

function childFirst() {
  return this.firstElementChild;
}

function selection_selectChild(match) {
  return this.select(match == null ? childFirst
      : childFind(typeof match === "function" ? match : childMatcher(match)));
}

var filter = Array.prototype.filter;

function children() {
  return Array.from(this.children);
}

function childrenFilter(match) {
  return function() {
    return filter.call(this.children, match);
  };
}

function selection_selectChildren(match) {
  return this.selectAll(match == null ? children
      : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
}

function selection_filter(match) {
  if (typeof match !== "function") match = matcher(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection$2(subgroups, this._parents);
}

function sparse(update) {
  return new Array(update.length);
}

function selection_enter() {
  return new Selection$2(this._enter || this._groups.map(sparse), this._parents);
}

function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
  insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
  querySelector: function(selector) { return this._parent.querySelector(selector); },
  querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
};

function constant$1(x) {
  return function() {
    return x;
  };
}

function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = new Map,
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && (nodeByKeyValue.get(keyValues[i]) === node)) {
      exit[i] = node;
    }
  }
}

function datum(node) {
  return node.__data__;
}

function selection_data(value, key) {
  if (!arguments.length) return Array.from(this, datum);

  var bind = key ? bindKey : bindIndex,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant$1(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
        previous._next = next || null;
      }
    }
  }

  update = new Selection$2(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}

// Given some data, this returns an array-like view of it: an object that
// exposes a length property and allows numeric indexing. Note that unlike
// selectAll, this isn’t worried about “live” collections because the resulting
// array will only be used briefly while data is being bound. (It is possible to
// cause the data to change while iterating by using a key function, but please
// don’t; we’d rather avoid a gratuitous copy.)
function arraylike(data) {
  return typeof data === "object" && "length" in data
    ? data // Array, TypedArray, NodeList, array-like
    : Array.from(data); // Map, Set, iterable, string, or anything else
}

function selection_exit() {
  return new Selection$2(this._exit || this._groups.map(sparse), this._parents);
}

function selection_join(onenter, onupdate, onexit) {
  var enter = this.enter(), update = this, exit = this.exit();
  if (typeof onenter === "function") {
    enter = onenter(enter);
    if (enter) enter = enter.selection();
  } else {
    enter = enter.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update) update = update.selection();
  }
  if (onexit == null) exit.remove(); else onexit(exit);
  return enter && update ? enter.merge(update).order() : update;
}

function selection_merge(context) {
  var selection = context.selection ? context.selection() : context;

  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection$2(merges, this._parents);
}

function selection_order() {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
}

function selection_sort(compare) {
  if (!compare) compare = ascending;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection$2(sortgroups, this._parents).order();
}

function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function selection_call() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}

function selection_nodes() {
  return Array.from(this);
}

function selection_node() {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
}

function selection_size() {
  let size = 0;
  for (const node of this) ++size; // eslint-disable-line no-unused-vars
  return size;
}

function selection_empty() {
  return !this.node();
}

function selection_each(callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
}

function attrRemove$1(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$1(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$1(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}

function attrConstantNS$1(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction$1(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);
    else this.setAttribute(name, v);
  };
}

function attrFunctionNS$1(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
    else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

function selection_attr(name, value) {
  var fullname = namespace(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local
        ? node.getAttributeNS(fullname.space, fullname.local)
        : node.getAttribute(fullname);
  }

  return this.each((value == null
      ? (fullname.local ? attrRemoveNS$1 : attrRemove$1) : (typeof value === "function"
      ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)
      : (fullname.local ? attrConstantNS$1 : attrConstant$1)))(fullname, value));
}

function defaultView(node) {
  return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
      || (node.document && node) // node is a Window
      || node.defaultView; // node is a Document
}

function styleRemove$1(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant$1(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction$1(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);
    else this.style.setProperty(name, v, priority);
  };
}

function selection_style(name, value, priority) {
  return arguments.length > 1
      ? this.each((value == null
            ? styleRemove$1 : typeof value === "function"
            ? styleFunction$1
            : styleConstant$1)(name, value, priority == null ? "" : priority))
      : styleValue(this.node(), name);
}

function styleValue(node, name) {
  return node.style.getPropertyValue(name)
      || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
}

function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}

function propertyConstant(name, value) {
  return function() {
    this[name] = value;
  };
}

function propertyFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];
    else this[name] = v;
  };
}

function selection_property(name, value) {
  return arguments.length > 1
      ? this.each((value == null
          ? propertyRemove : typeof value === "function"
          ? propertyFunction
          : propertyConstant)(name, value))
      : this.node()[name];
}

function classArray(string) {
  return string.trim().split(/^|\s+/);
}

function classList(node) {
  return node.classList || new ClassList(node);
}

function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}

ClassList.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.add(names[i]);
}

function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.remove(names[i]);
}

function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}

function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}

function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}

function selection_classed(name, value) {
  var names = classArray(name + "");

  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n) if (!list.contains(names[i])) return false;
    return true;
  }

  return this.each((typeof value === "function"
      ? classedFunction : value
      ? classedTrue
      : classedFalse)(names, value));
}

function textRemove() {
  this.textContent = "";
}

function textConstant$1(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction$1(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

function selection_text(value) {
  return arguments.length
      ? this.each(value == null
          ? textRemove : (typeof value === "function"
          ? textFunction$1
          : textConstant$1)(value))
      : this.node().textContent;
}

function htmlRemove() {
  this.innerHTML = "";
}

function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}

function htmlFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

function selection_html(value) {
  return arguments.length
      ? this.each(value == null
          ? htmlRemove : (typeof value === "function"
          ? htmlFunction
          : htmlConstant)(value))
      : this.node().innerHTML;
}

function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

function selection_raise() {
  return this.each(raise);
}

function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

function selection_lower() {
  return this.each(lower);
}

function selection_append(name) {
  var create = typeof name === "function" ? name : creator(name);
  return this.select(function() {
    return this.appendChild(create.apply(this, arguments));
  });
}

function constantNull() {
  return null;
}

function selection_insert(name, before) {
  var create = typeof name === "function" ? name : creator(name),
      select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
  return this.select(function() {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
}

function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

function selection_remove() {
  return this.each(remove);
}

function selection_cloneShallow() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

function selection_cloneDeep() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

function selection_clone(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}

function selection_datum(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.node().__data__;
}

function contextListener(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}

function parseTypenames(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return {type: t, name: name};
  });
}

function onRemove(typename) {
  return function() {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;
    else delete this.__on;
  };
}

function onAdd(typename, value, options) {
  return function() {
    var on = this.__on, o, listener = contextListener(value);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
        this.addEventListener(o.type, o.listener = listener, o.options = options);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, options);
    o = {type: typename.type, name: typename.name, value: value, listener: listener, options: options};
    if (!on) this.__on = [o];
    else on.push(o);
  };
}

function selection_on(typename, value, options) {
  var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd : onRemove;
  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
  return this;
}

function dispatchEvent(node, type, params) {
  var window = defaultView(node),
      event = window.CustomEvent;

  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
    else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant(type, params) {
  return function() {
    return dispatchEvent(this, type, params);
  };
}

function dispatchFunction(type, params) {
  return function() {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}

function selection_dispatch(type, params) {
  return this.each((typeof params === "function"
      ? dispatchFunction
      : dispatchConstant)(type, params));
}

function* selection_iterator() {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) yield node;
    }
  }
}

var root = [null];

function Selection$2(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection() {
  return new Selection$2([[document.documentElement]], root);
}

function selection_selection() {
  return this;
}

Selection$2.prototype = selection.prototype = {
  constructor: Selection$2,
  select: selection_select,
  selectAll: selection_selectAll,
  selectChild: selection_selectChild,
  selectChildren: selection_selectChildren,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  join: selection_join,
  merge: selection_merge,
  selection: selection_selection,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  clone: selection_clone,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch,
  [Symbol.iterator]: selection_iterator
};

function define(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}

function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

function Color() {}

var darker = 0.7;
var brighter = 1 / darker;

var reI = "\\s*([+-]?\\d+)\\s*",
    reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",
    reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
    reHex = /^#([0-9a-f]{3,8})$/,
    reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`),
    reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`),
    reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`),
    reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`),
    reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`),
    reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);

var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define(Color, color, {
  copy(channels) {
    return Object.assign(new this.constructor, this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex, // Deprecated! Use color.formatHex.
  formatHex: color_formatHex,
  formatHex8: color_formatHex8,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});

function color_formatHex() {
  return this.rgb().formatHex();
}

function color_formatHex8() {
  return this.rgb().formatHex8();
}

function color_formatHsl() {
  return hslConvert(this).formatHsl();
}

function color_formatRgb() {
  return this.rgb().formatRgb();
}

function color(format) {
  var m, l;
  format = (format + "").trim().toLowerCase();
  return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
      : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
      : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
      : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
      : null) // invalid hex
      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
      : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
      : null;
}

function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}

function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb;
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}

function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define(Rgb, rgb, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
  },
  displayable() {
    return (-0.5 <= this.r && this.r < 255.5)
        && (-0.5 <= this.g && this.g < 255.5)
        && (-0.5 <= this.b && this.b < 255.5)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex, // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex,
  formatHex8: rgb_formatHex8,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));

function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}

function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}

function rgb_formatRgb() {
  const a = clampa(this.opacity);
  return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
}

function clampa(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}

function clampi(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}

function hex(value) {
  value = clampi(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}

function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}

function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl;
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;
    else if (g === max) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}

function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hsl, hsl, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  clamp() {
    return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
        && (0 <= this.l && this.l <= 1)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl() {
    const a = clampa(this.opacity);
    return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
  }
}));

function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}

function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
      : m1) * 255;
}

var constant = x => () => x;

function linear(a, d) {
  return function(t) {
    return a + t * d;
  };
}

function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
    return Math.pow(a + t * b, y);
  };
}

function gamma(y) {
  return (y = +y) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential(a, b, y) : constant(isNaN(a) ? b : a);
  };
}

function nogamma(a, b) {
  var d = b - a;
  return d ? linear(a, d) : constant(isNaN(a) ? b : a);
}

var interpolateRgb = (function rgbGamma(y) {
  var color = gamma(y);

  function rgb$1(start, end) {
    var r = color((start = rgb(start)).r, (end = rgb(end)).r),
        g = color(start.g, end.g),
        b = color(start.b, end.b),
        opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb$1.gamma = rgbGamma;

  return rgb$1;
})(1);

function interpolateNumber(a, b) {
  return a = +a, b = +b, function(t) {
    return a * (1 - t) + b * t;
  };
}

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
    reB = new RegExp(reA.source, "g");

function zero(b) {
  return function() {
    return b;
  };
}

function one(b) {
  return function(t) {
    return b(t) + "";
  };
}

function interpolateString(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a))
      && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: interpolateNumber(am, bm)});
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? (q[0]
      ? one(q[0].x)
      : zero(b))
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        });
}

var degrees = 180 / Math.PI;

var identity = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};

function decompose(a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX: scaleX,
    scaleY: scaleY
  };
}

var svgNode;

/* eslint-disable no-undef */
function parseCss(value) {
  const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
  return m.isIdentity ? identity : decompose(m.a, m.b, m.c, m.d, m.e, m.f);
}

function parseSvg(value) {
  if (value == null) return identity;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate())) return identity;
  value = value.matrix;
  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
}

function interpolateTransform(parse, pxComma, pxParen, degParen) {

  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }

  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }

  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
      q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }

  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }

  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }

  return function(a, b) {
    var s = [], // string constants and placeholders
        q = []; // number interpolators
    a = parse(a), b = parse(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null; // gc
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  };
}

var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

var frame = 0, // is an animation frame pending?
    timeout$1 = 0, // is a timeout pending?
    interval = 0, // are any timers active?
    pokeDelay = 1000, // how frequently we check for clock skew
    taskHead,
    taskTail,
    clockLast = 0,
    clockNow = 0,
    clockSkew = 0,
    clock = typeof performance === "object" && performance.now ? performance : Date,
    setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}

function clearNow() {
  clockNow = 0;
}

function Timer() {
  this._call =
  this._time =
  this._next = null;
}

Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail) taskTail._next = this;
      else taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};

function timer(callback, delay, time) {
  var t = new Timer;
  t.restart(callback, delay, time);
  return t;
}

function timerFlush() {
  now(); // Get the current time, if not already set.
  ++frame; // Pretend we’ve set an alarm, if we haven’t already.
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0) t._call.call(undefined, e);
    t = t._next;
  }
  --frame;
}

function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout$1 = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}

function poke() {
  var now = clock.now(), delay = now - clockLast;
  if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
}

function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}

function sleep(time) {
  if (frame) return; // Soonest alarm already set, or will be.
  if (timeout$1) timeout$1 = clearTimeout(timeout$1);
  var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
  if (delay > 24) {
    if (time < Infinity) timeout$1 = setTimeout(wake, time - clock.now() - clockSkew);
    if (interval) interval = clearInterval(interval);
  } else {
    if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}

function timeout(callback, delay, time) {
  var t = new Timer;
  delay = delay == null ? 0 : +delay;
  t.restart(elapsed => {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
}

var emptyOn = dispatch("start", "end", "cancel", "interrupt");
var emptyTween = [];

var CREATED = 0;
var SCHEDULED = 1;
var STARTING = 2;
var STARTED = 3;
var RUNNING = 4;
var ENDING = 5;
var ENDED = 6;

function schedule(node, name, id, index, group, timing) {
  var schedules = node.__transition;
  if (!schedules) node.__transition = {};
  else if (id in schedules) return;
  create(node, id, {
    name: name,
    index: index, // For context during callback.
    group: group, // For context during callback.
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED
  });
}

function init(node, id) {
  var schedule = get(node, id);
  if (schedule.state > CREATED) throw new Error("too late; already scheduled");
  return schedule;
}

function set(node, id) {
  var schedule = get(node, id);
  if (schedule.state > STARTED) throw new Error("too late; already running");
  return schedule;
}

function get(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
  return schedule;
}

function create(node, id, self) {
  var schedules = node.__transition,
      tween;

  // Initialize the self timer when the transition is created.
  // Note the actual delay is not known until the first callback!
  schedules[id] = self;
  self.timer = timer(schedule, 0, self.time);

  function schedule(elapsed) {
    self.state = SCHEDULED;
    self.timer.restart(start, self.delay, self.time);

    // If the elapsed delay is less than our first sleep, start immediately.
    if (self.delay <= elapsed) start(elapsed - self.delay);
  }

  function start(elapsed) {
    var i, j, n, o;

    // If the state is not SCHEDULED, then we previously errored on start.
    if (self.state !== SCHEDULED) return stop();

    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name) continue;

      // While this element already has a starting transition during this frame,
      // defer starting an interrupting transition until that transition has a
      // chance to tick (and possibly end); see d3/d3-transition#54!
      if (o.state === STARTED) return timeout(start);

      // Interrupt the active transition, if any.
      if (o.state === RUNNING) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }

      // Cancel any pre-empted transitions.
      else if (+i < id) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("cancel", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }
    }

    // Defer the first tick to end of the current frame; see d3/d3#1576.
    // Note the transition may be canceled after start and before the first tick!
    // Note this must be scheduled before the start event; see d3/d3-transition#16!
    // Assuming this is successful, subsequent callbacks go straight to tick.
    timeout(function() {
      if (self.state === STARTED) {
        self.state = RUNNING;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });

    // Dispatch the start event.
    // Note this must be done before the tween are initialized.
    self.state = STARTING;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING) return; // interrupted
    self.state = STARTED;

    // Initialize the tween, deleting null tween.
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1; i < n; ++i) {
      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }

  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
        i = -1,
        n = tween.length;

    while (++i < n) {
      tween[i].call(node, t);
    }

    // Dispatch the end event.
    if (self.state === ENDING) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }

  function stop() {
    self.state = ENDED;
    self.timer.stop();
    delete schedules[id];
    for (var i in schedules) return; // eslint-disable-line no-unused-vars
    delete node.__transition;
  }
}

function interrupt(node, name) {
  var schedules = node.__transition,
      schedule,
      active,
      empty = true,
      i;

  if (!schedules) return;

  name = name == null ? null : name + "";

  for (i in schedules) {
    if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
    active = schedule.state > STARTING && schedule.state < ENDING;
    schedule.state = ENDED;
    schedule.timer.stop();
    schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
    delete schedules[i];
  }

  if (empty) delete node.__transition;
}

function selection_interrupt(name) {
  return this.each(function() {
    interrupt(this, name);
  });
}

function tweenRemove(id, name) {
  var tween0, tween1;
  return function() {
    var schedule = set(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }

    schedule.tween = tween1;
  };
}

function tweenFunction(id, name, value) {
  var tween0, tween1;
  if (typeof value !== "function") throw new Error;
  return function() {
    var schedule = set(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n) tween1.push(t);
    }

    schedule.tween = tween1;
  };
}

function transition_tween(name, value) {
  var id = this._id;

  name += "";

  if (arguments.length < 2) {
    var tween = get(this.node(), id).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }

  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
}

function tweenValue(transition, name, value) {
  var id = transition._id;

  transition.each(function() {
    var schedule = set(this, id);
    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
  });

  return function(node) {
    return get(node, id).value[name];
  };
}

function interpolate(a, b) {
  var c;
  return (typeof b === "number" ? interpolateNumber
      : b instanceof color ? interpolateRgb
      : (c = color(b)) ? (b = c, interpolateRgb)
      : interpolateString)(a, b);
}

function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant(name, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = this.getAttribute(name);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function attrConstantNS(fullname, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = this.getAttributeNS(fullname.space, fullname.local);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function attrFunction(name, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null) return void this.removeAttribute(name);
    string0 = this.getAttribute(name);
    string1 = value1 + "";
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function attrFunctionNS(fullname, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
    string0 = this.getAttributeNS(fullname.space, fullname.local);
    string1 = value1 + "";
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function transition_attr(name, value) {
  var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
  return this.attrTween(name, typeof value === "function"
      ? (fullname.local ? attrFunctionNS : attrFunction)(fullname, i, tweenValue(this, "attr." + name, value))
      : value == null ? (fullname.local ? attrRemoveNS : attrRemove)(fullname)
      : (fullname.local ? attrConstantNS : attrConstant)(fullname, i, value));
}

function attrInterpolate(name, i) {
  return function(t) {
    this.setAttribute(name, i.call(this, t));
  };
}

function attrInterpolateNS(fullname, i) {
  return function(t) {
    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
  };
}

function attrTweenNS(fullname, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function attrTween(name, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function transition_attrTween(name, value) {
  var key = "attr." + name;
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  var fullname = namespace(name);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
}

function delayFunction(id, value) {
  return function() {
    init(this, id).delay = +value.apply(this, arguments);
  };
}

function delayConstant(id, value) {
  return value = +value, function() {
    init(this, id).delay = value;
  };
}

function transition_delay(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? delayFunction
          : delayConstant)(id, value))
      : get(this.node(), id).delay;
}

function durationFunction(id, value) {
  return function() {
    set(this, id).duration = +value.apply(this, arguments);
  };
}

function durationConstant(id, value) {
  return value = +value, function() {
    set(this, id).duration = value;
  };
}

function transition_duration(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? durationFunction
          : durationConstant)(id, value))
      : get(this.node(), id).duration;
}

function easeConstant(id, value) {
  if (typeof value !== "function") throw new Error;
  return function() {
    set(this, id).ease = value;
  };
}

function transition_ease(value) {
  var id = this._id;

  return arguments.length
      ? this.each(easeConstant(id, value))
      : get(this.node(), id).ease;
}

function easeVarying(id, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (typeof v !== "function") throw new Error;
    set(this, id).ease = v;
  };
}

function transition_easeVarying(value) {
  if (typeof value !== "function") throw new Error;
  return this.each(easeVarying(this._id, value));
}

function transition_filter(match) {
  if (typeof match !== "function") match = matcher(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Transition(subgroups, this._parents, this._name, this._id);
}

function transition_merge(transition) {
  if (transition._id !== this._id) throw new Error;

  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Transition(merges, this._parents, this._name, this._id);
}

function start(name) {
  return (name + "").trim().split(/^|\s+/).every(function(t) {
    var i = t.indexOf(".");
    if (i >= 0) t = t.slice(0, i);
    return !t || t === "start";
  });
}

function onFunction(id, name, listener) {
  var on0, on1, sit = start(name) ? init : set;
  return function() {
    var schedule = sit(this, id),
        on = schedule.on;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

    schedule.on = on1;
  };
}

function transition_on(name, listener) {
  var id = this._id;

  return arguments.length < 2
      ? get(this.node(), id).on.on(name)
      : this.each(onFunction(id, name, listener));
}

function removeFunction(id) {
  return function() {
    var parent = this.parentNode;
    for (var i in this.__transition) if (+i !== id) return;
    if (parent) parent.removeChild(this);
  };
}

function transition_remove() {
  return this.on("end.remove", removeFunction(this._id));
}

function transition_select(select) {
  var name = this._name,
      id = this._id;

  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule(subgroup[i], name, id, i, subgroup, get(node, id));
      }
    }
  }

  return new Transition(subgroups, this._parents, name, id);
}

function transition_selectAll(select) {
  var name = this._name,
      id = this._id;

  if (typeof select !== "function") select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        for (var children = select.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) {
          if (child = children[k]) {
            schedule(child, name, id, k, children, inherit);
          }
        }
        subgroups.push(children);
        parents.push(node);
      }
    }
  }

  return new Transition(subgroups, parents, name, id);
}

var Selection$1 = selection.prototype.constructor;

function transition_selection() {
  return new Selection$1(this._groups, this._parents);
}

function styleNull(name, interpolate) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0 = styleValue(this, name),
        string1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, string10 = string1);
  };
}

function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant(name, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = styleValue(this, name);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function styleFunction(name, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0 = styleValue(this, name),
        value1 = value(this),
        string1 = value1 + "";
    if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function styleMaybeRemove(id, name) {
  var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
  return function() {
    var schedule = set(this, id),
        on = schedule.on,
        listener = schedule.value[key] == null ? remove || (remove = styleRemove(name)) : undefined;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

    schedule.on = on1;
  };
}

function transition_style(name, value, priority) {
  var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
  return value == null ? this
      .styleTween(name, styleNull(name, i))
      .on("end.style." + name, styleRemove(name))
    : typeof value === "function" ? this
      .styleTween(name, styleFunction(name, i, tweenValue(this, "style." + name, value)))
      .each(styleMaybeRemove(this._id, name))
    : this
      .styleTween(name, styleConstant(name, i, value), priority)
      .on("end.style." + name, null);
}

function styleInterpolate(name, i, priority) {
  return function(t) {
    this.style.setProperty(name, i.call(this, t), priority);
  };
}

function styleTween(name, value, priority) {
  var t, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
    return t;
  }
  tween._value = value;
  return tween;
}

function transition_styleTween(name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
}

function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction(value) {
  return function() {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}

function transition_text(value) {
  return this.tween("text", typeof value === "function"
      ? textFunction(tweenValue(this, "text", value))
      : textConstant(value == null ? "" : value + ""));
}

function textInterpolate(i) {
  return function(t) {
    this.textContent = i.call(this, t);
  };
}

function textTween(value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function transition_textTween(value) {
  var key = "text";
  if (arguments.length < 1) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  return this.tween(key, textTween(value));
}

function transition_transition() {
  var name = this._name,
      id0 = this._id,
      id1 = newId();

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        var inherit = get(node, id0);
        schedule(node, name, id1, i, group, {
          time: inherit.time + inherit.delay + inherit.duration,
          delay: 0,
          duration: inherit.duration,
          ease: inherit.ease
        });
      }
    }
  }

  return new Transition(groups, this._parents, name, id1);
}

function transition_end() {
  var on0, on1, that = this, id = that._id, size = that.size();
  return new Promise(function(resolve, reject) {
    var cancel = {value: reject},
        end = {value: function() { if (--size === 0) resolve(); }};

    that.each(function() {
      var schedule = set(this, id),
          on = schedule.on;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0) {
        on1 = (on0 = on).copy();
        on1._.cancel.push(cancel);
        on1._.interrupt.push(cancel);
        on1._.end.push(end);
      }

      schedule.on = on1;
    });

    // The selection was empty, resolve end immediately
    if (size === 0) resolve();
  });
}

var id = 0;

function Transition(groups, parents, name, id) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id;
}

function newId() {
  return ++id;
}

var selection_prototype = selection.prototype;

Transition.prototype = {
  constructor: Transition,
  select: transition_select,
  selectAll: transition_selectAll,
  selectChild: selection_prototype.selectChild,
  selectChildren: selection_prototype.selectChildren,
  filter: transition_filter,
  merge: transition_merge,
  selection: transition_selection,
  transition: transition_transition,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: transition_on,
  attr: transition_attr,
  attrTween: transition_attrTween,
  style: transition_style,
  styleTween: transition_styleTween,
  text: transition_text,
  textTween: transition_textTween,
  remove: transition_remove,
  tween: transition_tween,
  delay: transition_delay,
  duration: transition_duration,
  ease: transition_ease,
  easeVarying: transition_easeVarying,
  end: transition_end,
  [Symbol.iterator]: selection_prototype[Symbol.iterator]
};

function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

var defaultTiming = {
  time: null, // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut
};

function inherit(node, id) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id])) {
    if (!(node = node.parentNode)) {
      throw new Error(`transition ${id} not found`);
    }
  }
  return timing;
}

function selection_transition(name) {
  var id,
      timing;

  if (name instanceof Transition) {
    id = name._id, name = name._name;
  } else {
    id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
  }

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        schedule(node, name, id, i, group, timing || inherit(node, id));
      }
    }
  }

  return new Transition(groups, this._parents, name, id);
}

selection.prototype.interrupt = selection_interrupt;
selection.prototype.transition = selection_transition;

function Transform(k, x, y) {
  this.k = k;
  this.x = x;
  this.y = y;
}

Transform.prototype = {
  constructor: Transform,
  scale: function(k) {
    return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
  },
  translate: function(x, y) {
    return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
  },
  apply: function(point) {
    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
  },
  applyX: function(x) {
    return x * this.k + this.x;
  },
  applyY: function(y) {
    return y * this.k + this.y;
  },
  invert: function(location) {
    return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
  },
  invertX: function(x) {
    return (x - this.x) / this.k;
  },
  invertY: function(y) {
    return (y - this.y) / this.k;
  },
  rescaleX: function(x) {
    return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
  },
  rescaleY: function(y) {
    return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
  },
  toString: function() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
};

Transform.prototype;

const errorMessages = {
    error001: (lib = 'react') => `Seems like you have not used ${lib === 'svelte' ? 'SvelteFlowProvider' : 'ReactFlowProvider'} as an ancestor. Help: https://${lib}flow.dev/error#001`,
    error002: () => "It looks like you've created a new nodeTypes or edgeTypes object. If this wasn't on purpose please define the nodeTypes/edgeTypes outside of the component or memoize them.",
    error003: (nodeType) => `Node type "${nodeType}" not found. Using fallback type "default".`,
    error004: () => 'The parent container needs a width and a height to render the graph.',
    error005: () => 'Only child nodes can use a parent extent.',
    error006: () => "Can't create edge. An edge needs a source and a target.",
    error007: (id) => `The old edge with id=${id} does not exist.`,
    error009: (type) => `Marker type "${type}" doesn't exist.`,
    error008: (handleType, { id, sourceHandle, targetHandle }) => `Couldn't create edge for ${handleType} handle id: "${handleType === 'source' ? sourceHandle : targetHandle}", edge id: ${id}.`,
    error010: () => 'Handle: No node id found. Make sure to only use a Handle inside a custom Node.',
    error011: (edgeType) => `Edge type "${edgeType}" not found. Using fallback type "default".`,
    error012: (id) => `Node with id "${id}" does not exist, it may have been removed. This can happen when a node is deleted before the "onNodeClick" handler is called.`,
    error013: (lib = 'react') => `It seems that you haven't loaded the styles. Please import '@xyflow/${lib}/dist/style.css' or base.css to make sure everything is working properly.`,
    error014: () => 'useNodeConnections: No node ID found. Call useNodeConnections inside a custom Node or provide a node ID.',
    error015: () => 'It seems that you are trying to drag a node that is not initialized. Please use onNodesChange as explained in the docs.',
    error016: (id) => `Edge with id "${id}" does not exist, it may have been removed. This can happen when an edge is deleted before the "onEdgeClick" handler is called.`,
};
const infiniteExtent = [
    [Number.NEGATIVE_INFINITY, Number.NEGATIVE_INFINITY],
    [Number.POSITIVE_INFINITY, Number.POSITIVE_INFINITY],
];
const defaultAriaLabelConfig = {
    'node.a11yDescription.default': 'Press enter or space to select a node. Press delete to remove it and escape to cancel.',
    'node.a11yDescription.keyboardDisabled': 'Press enter or space to select a node. You can then use the arrow keys to move the node around. Press delete to remove it and escape to cancel.',
    'node.a11yDescription.ariaLiveMessage': ({ direction, x, y }) => `Moved selected node ${direction}. New position, x: ${x}, y: ${y}`,
    'edge.a11yDescription.default': 'Press enter or space to select an edge. You can then press delete to remove it or escape to cancel.',
    // Control elements
    'controls.ariaLabel': 'Control Panel',
    'controls.zoomIn.ariaLabel': 'Zoom In',
    'controls.zoomOut.ariaLabel': 'Zoom Out',
    'controls.fitView.ariaLabel': 'Fit View',
    'controls.interactive.ariaLabel': 'Toggle Interactivity',
    // Mini map
    'minimap.ariaLabel': 'Mini Map',
    // Handle
    'handle.ariaLabel': 'Handle',
};

/**
 * The `ConnectionMode` is used to set the mode of connection between nodes.
 * The `Strict` mode is the default one and only allows source to target edges.
 * `Loose` mode allows source to source and target to target edges as well.
 *
 * @public
 */
var ConnectionMode;
(function (ConnectionMode) {
    ConnectionMode["Strict"] = "strict";
    ConnectionMode["Loose"] = "loose";
})(ConnectionMode || (ConnectionMode = {}));
/**
 * This enum is used to set the different modes of panning the viewport when the
 * user scrolls. The `Free` mode allows the user to pan in any direction by scrolling
 * with a device like a trackpad. The `Vertical` and `Horizontal` modes restrict
 * scroll panning to only the vertical or horizontal axis, respectively.
 *
 * @public
 */
var PanOnScrollMode;
(function (PanOnScrollMode) {
    PanOnScrollMode["Free"] = "free";
    PanOnScrollMode["Vertical"] = "vertical";
    PanOnScrollMode["Horizontal"] = "horizontal";
})(PanOnScrollMode || (PanOnScrollMode = {}));
var SelectionMode;
(function (SelectionMode) {
    SelectionMode["Partial"] = "partial";
    SelectionMode["Full"] = "full";
})(SelectionMode || (SelectionMode = {}));
const initialConnection = {
    inProgress: false,
    isValid: null,
    from: null,
    fromHandle: null,
    fromPosition: null,
    fromNode: null,
    to: null,
    toHandle: null,
    toPosition: null,
    toNode: null,
    pointer: null,
};

/**
 * If you set the `connectionLineType` prop on your [`<ReactFlow />`](/api-reference/react-flow#connection-connectionLineType)
 *component, it will dictate the style of connection line rendered when creating
 *new edges.
 *
 * @public
 *
 * @remarks If you choose to render a custom connection line component, this value will be
 *passed to your component as part of its [`ConnectionLineComponentProps`](/api-reference/types/connection-line-component-props).
 */
var ConnectionLineType;
(function (ConnectionLineType) {
    ConnectionLineType["Bezier"] = "default";
    ConnectionLineType["Straight"] = "straight";
    ConnectionLineType["Step"] = "step";
    ConnectionLineType["SmoothStep"] = "smoothstep";
    ConnectionLineType["SimpleBezier"] = "simplebezier";
})(ConnectionLineType || (ConnectionLineType = {}));
/**
 * Edges may optionally have a marker on either end. The MarkerType type enumerates
 * the options available to you when configuring a given marker.
 *
 * @public
 */
var MarkerType;
(function (MarkerType) {
    MarkerType["Arrow"] = "arrow";
    MarkerType["ArrowClosed"] = "arrowclosed";
})(MarkerType || (MarkerType = {}));

/**
 * While [`PanelPosition`](/api-reference/types/panel-position) can be used to place a
 * component in the corners of a container, the `Position` enum is less precise and used
 * primarily in relation to edges and handles.
 *
 * @public
 */
var Position;
(function (Position) {
    Position["Left"] = "left";
    Position["Top"] = "top";
    Position["Right"] = "right";
    Position["Bottom"] = "bottom";
})(Position || (Position = {}));
({
    [Position.Left]: Position.Right,
    [Position.Right]: Position.Left,
    [Position.Top]: Position.Bottom,
    [Position.Bottom]: Position.Top,
});
function getConnectionStatus(isValid) {
    return isValid === null ? null : isValid ? 'valid' : 'invalid';
}

/**
 * Test whether an object is usable as an Edge
 * @public
 * @remarks In TypeScript this is a type guard that will narrow the type of whatever you pass in to Edge if it returns true
 * @param element - The element to test
 * @returns A boolean indicating whether the element is an Edge
 */
const isEdgeBase = (element) => !!element && typeof element === 'object' && 'id' in element && 'source' in element && 'target' in element;
/**
 * Test whether an object is usable as a Node
 * @public
 * @remarks In TypeScript this is a type guard that will narrow the type of whatever you pass in to Node if it returns true
 * @param element - The element to test
 * @returns A boolean indicating whether the element is an Node
 */
const isNodeBase = (element) => !!element && typeof element === 'object' && 'id' in element && 'position' in element && !('source' in element) && !('target' in element);
const isInternalNodeBase = (element) => !!element && typeof element === 'object' && 'id' in element && 'internals' in element && !('source' in element) && !('target' in element);
const getNodePositionWithOrigin = (node, nodeOrigin = [0, 0]) => {
    const { width, height } = getNodeDimensions(node);
    const origin = node.origin ?? nodeOrigin;
    const offsetX = width * origin[0];
    const offsetY = height * origin[1];
    return {
        x: node.position.x - offsetX,
        y: node.position.y - offsetY,
    };
};
/**
 * Returns the bounding box that contains all the given nodes in an array. This can
 * be useful when combined with [`getViewportForBounds`](/api-reference/utils/get-viewport-for-bounds)
 * to calculate the correct transform to fit the given nodes in a viewport.
 * @public
 * @remarks Useful when combined with {@link getViewportForBounds} to calculate the correct transform to fit the given nodes in a viewport.
 * @param nodes - Nodes to calculate the bounds for.
 * @returns Bounding box enclosing all nodes.
 *
 * @remarks This function was previously called `getRectOfNodes`
 *
 * @example
 * ```js
 *import { getNodesBounds } from '@xyflow/react';
 *
 *const nodes = [
 *  {
 *    id: 'a',
 *    position: { x: 0, y: 0 },
 *    data: { label: 'a' },
 *    width: 50,
 *    height: 25,
 *  },
 *  {
 *    id: 'b',
 *    position: { x: 100, y: 100 },
 *    data: { label: 'b' },
 *    width: 50,
 *    height: 25,
 *  },
 *];
 *
 *const bounds = getNodesBounds(nodes);
 *```
 */
const getNodesBounds = (nodes, params = { nodeOrigin: [0, 0] }) => {
    if (process.env.NODE_ENV === 'development' && !params.nodeLookup) {
        console.warn('Please use `getNodesBounds` from `useReactFlow`/`useSvelteFlow` hook to ensure correct values for sub flows. If not possible, you have to provide a nodeLookup to support sub flows.');
    }
    if (nodes.length === 0) {
        return { x: 0, y: 0, width: 0, height: 0 };
    }
    const box = nodes.reduce((currBox, nodeOrId) => {
        const isId = typeof nodeOrId === 'string';
        let currentNode = !params.nodeLookup && !isId ? nodeOrId : undefined;
        if (params.nodeLookup) {
            currentNode = isId
                ? params.nodeLookup.get(nodeOrId)
                : !isInternalNodeBase(nodeOrId)
                    ? params.nodeLookup.get(nodeOrId.id)
                    : nodeOrId;
        }
        const nodeBox = currentNode ? nodeToBox(currentNode, params.nodeOrigin) : { x: 0, y: 0, x2: 0, y2: 0 };
        return getBoundsOfBoxes(currBox, nodeBox);
    }, { x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity });
    return boxToRect(box);
};
/**
 * Determines a bounding box that contains all given nodes in an array
 * @internal
 */
const getInternalNodesBounds = (nodeLookup, params = {}) => {
    let box = { x: Infinity, y: Infinity, x2: -Infinity, y2: -Infinity };
    let hasVisibleNodes = false;
    nodeLookup.forEach((node) => {
        if (params.filter === undefined || params.filter(node)) {
            box = getBoundsOfBoxes(box, nodeToBox(node));
            hasVisibleNodes = true;
        }
    });
    return hasVisibleNodes ? boxToRect(box) : { x: 0, y: 0, width: 0, height: 0 };
};
const getNodesInside = (nodes, rect, [tx, ty, tScale] = [0, 0, 1], partially = false, 
// set excludeNonSelectableNodes if you want to pay attention to the nodes "selectable" attribute
excludeNonSelectableNodes = false) => {
    // viewport in flow coordinates, as scalars to avoid a Rect allocation per node
    const paneX = (rect.x - tx) / tScale;
    const paneY = (rect.y - ty) / tScale;
    const paneWidth = rect.width / tScale;
    const paneHeight = rect.height / tScale;
    const visibleNodes = [];
    for (const node of nodes.values()) {
        const { measured, selectable = true, hidden = false } = node;
        if ((excludeNonSelectableNodes && !selectable) || hidden) {
            continue;
        }
        const width = measured.width ?? node.width ?? node.initialWidth ?? 0;
        const height = measured.height ?? node.height ?? node.initialHeight ?? 0;
        const { x, y } = node.internals.positionAbsolute;
        const overlappingArea = getRectsOverlappingArea(paneX, paneY, paneWidth, paneHeight, x, y, width, height);
        const area = width * height;
        const partiallyVisible = partially && overlappingArea > 0;
        const forceInitialRender = !node.internals.handleBounds;
        const isVisible = forceInitialRender || partiallyVisible || overlappingArea >= area;
        if (isVisible || node.dragging) {
            visibleNodes.push(node);
        }
    }
    return visibleNodes;
};
/**
 * This utility filters an array of edges, keeping only those where either the source or target
 * node is present in the given array of nodes.
 * @public
 * @param nodes - Nodes you want to get the connected edges for.
 * @param edges - All edges.
 * @returns Array of edges that connect any of the given nodes with each other.
 *
 * @example
 * ```js
 *import { getConnectedEdges } from '@xyflow/react';
 *
 *const nodes = [
 *  { id: 'a', position: { x: 0, y: 0 } },
 *  { id: 'b', position: { x: 100, y: 0 } },
 *];
 *
 *const edges = [
 *  { id: 'a->c', source: 'a', target: 'c' },
 *  { id: 'c->d', source: 'c', target: 'd' },
 *];
 *
 *const connectedEdges = getConnectedEdges(nodes, edges);
 * // => [{ id: 'a->c', source: 'a', target: 'c' }]
 *```
 */
const getConnectedEdges = (nodes, edges) => {
    const nodeIds = new Set();
    nodes.forEach((node) => {
        nodeIds.add(node.id);
    });
    return edges.filter((edge) => nodeIds.has(edge.source) || nodeIds.has(edge.target));
};
function getFitViewNodes(nodeLookup, options) {
    const fitViewNodes = new Map();
    const optionNodeIds = options?.nodes ? new Set(options.nodes.map((node) => node.id)) : null;
    nodeLookup.forEach((n) => {
        let isVisible;
        if (options?.includeHiddenNodes) {
            /*
             * when hidden nodes are included they were never rendered, so they have no
             * measured size. Fall back to the declared dimensions (same fallback as
             * nodeToBox) so a hidden node with an intrinsic size still contributes to
             * the fit bounds instead of being dropped by a measured-only check. (#5841)
             */
            const { width, height } = getNodeDimensions(n);
            isVisible = width > 0 && height > 0;
        }
        else {
            isVisible = Boolean(n.measured.width && n.measured.height && !n.hidden);
        }
        if (isVisible && (!optionNodeIds || optionNodeIds.has(n.id))) {
            fitViewNodes.set(n.id, n);
        }
    });
    return fitViewNodes;
}
async function fitViewport({ nodes, width, height, panZoom, minZoom, maxZoom }, options) {
    if (nodes.size === 0) {
        return true;
    }
    const nodesToFit = getFitViewNodes(nodes, options);
    const bounds = getInternalNodesBounds(nodesToFit);
    const viewport = getViewportForBounds(bounds, width, height, options?.minZoom ?? minZoom, options?.maxZoom ?? maxZoom, options?.padding ?? 0.1);
    await panZoom.setViewport(viewport, {
        duration: options?.duration,
        ease: options?.ease,
        interpolate: options?.interpolate,
    });
    return true;
}
/**
 * This function calculates the next position of a node, taking into account the node's extent, parent node, and origin.
 *
 * @internal
 * @returns position, positionAbsolute
 */
function calculateNodePosition({ nodeId, nextPosition, nodeLookup, nodeOrigin = [0, 0], nodeExtent, onError, }) {
    const node = nodeLookup.get(nodeId);
    const parentNode = node.parentId ? nodeLookup.get(node.parentId) : undefined;
    const { x: parentX, y: parentY } = parentNode ? parentNode.internals.positionAbsolute : { x: 0, y: 0 };
    const origin = node.origin ?? nodeOrigin;
    let extent = node.extent || nodeExtent;
    if (node.extent === 'parent' && !node.expandParent) {
        if (!parentNode) {
            onError?.('005', errorMessages['error005']());
        }
        else {
            const parentWidth = parentNode.measured.width;
            const parentHeight = parentNode.measured.height;
            if (parentWidth && parentHeight) {
                extent = [
                    [parentX, parentY],
                    [parentX + parentWidth, parentY + parentHeight],
                ];
            }
        }
    }
    else if (parentNode && isCoordinateExtent(node.extent)) {
        extent = [
            [node.extent[0][0] + parentX, node.extent[0][1] + parentY],
            [node.extent[1][0] + parentX, node.extent[1][1] + parentY],
        ];
    }
    const positionAbsolute = isCoordinateExtent(extent)
        ? clampPosition(nextPosition, extent, node.measured)
        : nextPosition;
    if (node.measured.width === undefined || node.measured.height === undefined) {
        onError?.('015', errorMessages['error015']());
    }
    return {
        position: {
            x: positionAbsolute.x - parentX + (node.measured.width ?? 0) * origin[0],
            y: positionAbsolute.y - parentY + (node.measured.height ?? 0) * origin[1],
        },
        positionAbsolute,
    };
}
/**
 * Pass in nodes & edges to delete, get arrays of nodes and edges that actually can be deleted
 * @internal
 * @param param.nodesToRemove - The nodes to remove
 * @param param.edgesToRemove - The edges to remove
 * @param param.nodes - All nodes
 * @param param.edges - All edges
 * @param param.onBeforeDelete - Callback to check which nodes and edges can be deleted
 * @returns nodes: nodes that can be deleted, edges: edges that can be deleted
 */
async function getElementsToRemove({ nodesToRemove = [], edgesToRemove = [], nodes, edges, onBeforeDelete, }) {
    const nodeIds = new Set(nodesToRemove.map((node) => node.id));
    const matchingNodes = [];
    for (const node of nodes) {
        if (node.deletable === false) {
            continue;
        }
        const isIncluded = nodeIds.has(node.id);
        const parentHit = !isIncluded && node.parentId && matchingNodes.find((n) => n.id === node.parentId);
        if (isIncluded || parentHit) {
            matchingNodes.push(node);
        }
    }
    const edgeIds = new Set(edgesToRemove.map((edge) => edge.id));
    const deletableEdges = edges.filter((edge) => edge.deletable !== false);
    const connectedEdges = getConnectedEdges(matchingNodes, deletableEdges);
    const matchingEdges = connectedEdges;
    for (const edge of deletableEdges) {
        const isIncluded = edgeIds.has(edge.id);
        if (isIncluded && !matchingEdges.find((e) => e.id === edge.id)) {
            matchingEdges.push(edge);
        }
    }
    if (!onBeforeDelete) {
        return {
            edges: matchingEdges,
            nodes: matchingNodes,
        };
    }
    const onBeforeDeleteResult = await onBeforeDelete({
        nodes: matchingNodes,
        edges: matchingEdges,
    });
    if (typeof onBeforeDeleteResult === 'boolean') {
        return onBeforeDeleteResult ? { edges: matchingEdges, nodes: matchingNodes } : { edges: [], nodes: [] };
    }
    return onBeforeDeleteResult;
}

const clamp = (val, min = 0, max = 1) => Math.min(Math.max(val, min), max);
const clampPosition = (position = { x: 0, y: 0 }, extent, dimensions) => ({
    x: clamp(position.x, extent[0][0], extent[1][0] - (dimensions?.width ?? 0)),
    y: clamp(position.y, extent[0][1], extent[1][1] - (dimensions?.height ?? 0)),
});
function clampPositionToParent(childPosition, childDimensions, parent) {
    const { width: parentWidth, height: parentHeight } = getNodeDimensions(parent);
    const { x: parentX, y: parentY } = parent.internals.positionAbsolute;
    return clampPosition(childPosition, [
        [parentX, parentY],
        [parentX + parentWidth, parentY + parentHeight],
    ], childDimensions);
}
const getBoundsOfBoxes = (box1, box2) => ({
    x: Math.min(box1.x, box2.x),
    y: Math.min(box1.y, box2.y),
    x2: Math.max(box1.x2, box2.x2),
    y2: Math.max(box1.y2, box2.y2),
});
const rectToBox = ({ x, y, width, height }) => ({
    x,
    y,
    x2: x + width,
    y2: y + height,
});
const boxToRect = ({ x, y, x2, y2 }) => ({
    x,
    y,
    width: x2 - x,
    height: y2 - y,
});
const nodeToRect = (node, nodeOrigin = [0, 0]) => {
    const { x, y } = isInternalNodeBase(node)
        ? node.internals.positionAbsolute
        : getNodePositionWithOrigin(node, nodeOrigin);
    return {
        x,
        y,
        width: node.measured?.width ?? node.width ?? node.initialWidth ?? 0,
        height: node.measured?.height ?? node.height ?? node.initialHeight ?? 0,
    };
};
const nodeToBox = (node, nodeOrigin = [0, 0]) => {
    const { x, y } = isInternalNodeBase(node)
        ? node.internals.positionAbsolute
        : getNodePositionWithOrigin(node, nodeOrigin);
    return {
        x,
        y,
        x2: x + (node.measured?.width ?? node.width ?? node.initialWidth ?? 0),
        y2: y + (node.measured?.height ?? node.height ?? node.initialHeight ?? 0),
    };
};
const getBoundsOfRects = (rect1, rect2) => boxToRect(getBoundsOfBoxes(rectToBox(rect1), rectToBox(rect2)));
const getRectsOverlappingArea = (aX, aY, aWidth, aHeight, bX, bY, bWidth, bHeight) => {
    const xOverlap = Math.max(0, Math.min(aX + aWidth, bX + bWidth) - Math.max(aX, bX));
    const yOverlap = Math.max(0, Math.min(aY + aHeight, bY + bHeight) - Math.max(aY, bY));
    return Math.ceil(xOverlap * yOverlap);
};
const getOverlappingArea = (rectA, rectB) => getRectsOverlappingArea(rectA.x, rectA.y, rectA.width, rectA.height, rectB.x, rectB.y, rectB.width, rectB.height);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isRectObject = (obj) => isNumeric(obj.width) && isNumeric(obj.height) && isNumeric(obj.x) && isNumeric(obj.y);
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
const isNumeric = (n) => !isNaN(n) && isFinite(n);
const createDevWarn = (lib, helpUrl) => (id, message) => {
    if (process.env.NODE_ENV === 'development') {
        console.warn(`[${lib}]: ${message} Help: ${helpUrl}error#${id}`);
    }
};
const snapPosition = (position, snapGrid = [1, 1]) => {
    return {
        x: snapGrid[0] * Math.round(position.x / snapGrid[0]),
        y: snapGrid[1] * Math.round(position.y / snapGrid[1]),
    };
};
const pointToRendererPoint = ({ x, y }, [tx, ty, tScale], snapToGrid = false, snapGrid = [1, 1]) => {
    const position = {
        x: (x - tx) / tScale,
        y: (y - ty) / tScale,
    };
    return snapToGrid ? snapPosition(position, snapGrid) : position;
};
const rendererPointToPoint = ({ x, y }, [tx, ty, tScale]) => {
    return {
        x: x * tScale + tx,
        y: y * tScale + ty,
    };
};
/**
 * Parses a single padding value to a number
 * @internal
 * @param padding - Padding to parse
 * @param viewport - Width or height of the viewport
 * @returns The padding in pixels
 */
function parsePadding(padding, viewport) {
    if (typeof padding === 'number') {
        return Math.floor((viewport - viewport / (1 + padding)) * 0.5);
    }
    if (typeof padding === 'string' && padding.endsWith('px')) {
        const paddingValue = parseFloat(padding);
        if (!Number.isNaN(paddingValue)) {
            return Math.floor(paddingValue);
        }
    }
    if (typeof padding === 'string' && padding.endsWith('%')) {
        const paddingValue = parseFloat(padding);
        if (!Number.isNaN(paddingValue)) {
            return Math.floor(viewport * paddingValue * 0.01);
        }
    }
    console.error(`The padding value "${padding}" is invalid. Please provide a number or a string with a valid unit (px or %).`);
    return 0;
}
/**
 * Parses the paddings to an object with top, right, bottom, left, x and y paddings
 * @internal
 * @param padding - Padding to parse
 * @param width - Width of the viewport
 * @param height - Height of the viewport
 * @returns An object with the paddings in pixels
 */
function parsePaddings(padding, width, height) {
    if (typeof padding === 'string' || typeof padding === 'number') {
        const paddingY = parsePadding(padding, height);
        const paddingX = parsePadding(padding, width);
        return {
            top: paddingY,
            right: paddingX,
            bottom: paddingY,
            left: paddingX,
            x: paddingX * 2,
            y: paddingY * 2,
        };
    }
    if (typeof padding === 'object') {
        const top = parsePadding(padding.top ?? padding.y ?? 0, height);
        const bottom = parsePadding(padding.bottom ?? padding.y ?? 0, height);
        const left = parsePadding(padding.left ?? padding.x ?? 0, width);
        const right = parsePadding(padding.right ?? padding.x ?? 0, width);
        return { top, right, bottom, left, x: left + right, y: top + bottom };
    }
    return { top: 0, right: 0, bottom: 0, left: 0, x: 0, y: 0 };
}
/**
 * Calculates the resulting paddings if the new viewport is applied
 * @internal
 * @param bounds - Bounds to fit inside viewport
 * @param x - X position of the viewport
 * @param y - Y position of the viewport
 * @param zoom - Zoom level of the viewport
 * @param width - Width of the viewport
 * @param height - Height of the viewport
 * @returns An object with the minimum padding required to fit the bounds inside the viewport
 */
function calculateAppliedPaddings(bounds, x, y, zoom, width, height) {
    const { x: left, y: top } = rendererPointToPoint(bounds, [x, y, zoom]);
    const { x: boundRight, y: boundBottom } = rendererPointToPoint({ x: bounds.x + bounds.width, y: bounds.y + bounds.height }, [x, y, zoom]);
    const right = width - boundRight;
    const bottom = height - boundBottom;
    return {
        left: Math.floor(left),
        top: Math.floor(top),
        right: Math.floor(right),
        bottom: Math.floor(bottom),
    };
}
/**
 * Returns a viewport that encloses the given bounds with padding.
 * @public
 * @remarks You can determine bounds of nodes with {@link getNodesBounds} and {@link getBoundsOfRects}
 * @param bounds - Bounds to fit inside viewport.
 * @param width - Width of the viewport.
 * @param height  - Height of the viewport.
 * @param minZoom - Minimum zoom level of the resulting viewport.
 * @param maxZoom - Maximum zoom level of the resulting viewport.
 * @param padding - Padding around the bounds.
 * @returns A transformed {@link Viewport} that encloses the given bounds which you can pass to e.g. {@link setViewport}.
 * @example
 * const { x, y, zoom } = getViewportForBounds(
 * { x: 0, y: 0, width: 100, height: 100},
 * 1200, 800, 0.5, 2);
 */
const getViewportForBounds = (bounds, width, height, minZoom, maxZoom, padding) => {
    // First we resolve all the paddings to actual pixel values
    const p = parsePaddings(padding, width, height);
    const xZoom = (width - p.x) / bounds.width;
    const yZoom = (height - p.y) / bounds.height;
    // We calculate the new x, y, zoom for a centered view
    const zoom = Math.min(xZoom, yZoom);
    const clampedZoom = clamp(zoom, minZoom, maxZoom);
    const boundsCenterX = bounds.x + bounds.width / 2;
    const boundsCenterY = bounds.y + bounds.height / 2;
    const x = width / 2 - boundsCenterX * clampedZoom;
    const y = height / 2 - boundsCenterY * clampedZoom;
    // Then we calculate the minimum padding, to respect asymmetric paddings
    const newPadding = calculateAppliedPaddings(bounds, x, y, clampedZoom, width, height);
    // We only want to have an offset if the newPadding is smaller than the required padding
    const offset = {
        left: Math.min(newPadding.left - p.left, 0),
        top: Math.min(newPadding.top - p.top, 0),
        right: Math.min(newPadding.right - p.right, 0),
        bottom: Math.min(newPadding.bottom - p.bottom, 0),
    };
    return {
        x: x - offset.left + offset.right,
        y: y - offset.top + offset.bottom,
        zoom: clampedZoom,
    };
};
const isMacOs = () => typeof navigator !== 'undefined' && navigator?.userAgent?.indexOf('Mac') >= 0;
function isCoordinateExtent(extent) {
    return extent !== undefined && extent !== null && extent !== 'parent';
}
function getNodeDimensions(node) {
    return {
        width: node.measured?.width ?? node.width ?? node.initialWidth ?? 0,
        height: node.measured?.height ?? node.height ?? node.initialHeight ?? 0,
    };
}
function nodeHasDimensions(node) {
    return ((node.measured?.width ?? node.width ?? node.initialWidth) !== undefined &&
        (node.measured?.height ?? node.height ?? node.initialHeight) !== undefined);
}
/**
 * Convert child position to absolute position
 *
 * @internal
 * @param position
 * @param parentId
 * @param nodeLookup
 * @param nodeOrigin
 * @returns an internal node with an absolute position
 */
function evaluateAbsolutePosition(position, dimensions = { width: 0, height: 0 }, parentId, nodeLookup, nodeOrigin) {
    const positionAbsolute = { ...position };
    const parent = nodeLookup.get(parentId);
    if (parent) {
        const origin = parent.origin || nodeOrigin;
        positionAbsolute.x += parent.internals.positionAbsolute.x - (dimensions.width ?? 0) * origin[0];
        positionAbsolute.y += parent.internals.positionAbsolute.y - (dimensions.height ?? 0) * origin[1];
    }
    return positionAbsolute;
}
function mergeAriaLabelConfig(partial) {
    return { ...defaultAriaLabelConfig, ...(partial || {}) };
}
const getDimensions = (node) => ({
    width: node.offsetWidth,
    height: node.offsetHeight,
});
/*
 * The handle bounds are calculated relative to the node element.
 * We store them in the internals object of the node in order to avoid
 * unnecessary recalculations.
 */
const getHandleBounds = (type, nodeElement, nodeBounds, zoom, nodeId) => {
    const handles = nodeElement.querySelectorAll(`.${type}`);
    if (!handles || !handles.length) {
        return null;
    }
    return Array.from(handles).map((handle) => {
        const handleBounds = handle.getBoundingClientRect();
        return {
            id: handle.getAttribute('data-handleid'),
            type,
            nodeId,
            position: handle.getAttribute('data-handlepos'),
            x: (handleBounds.left - nodeBounds.left) / zoom,
            y: (handleBounds.top - nodeBounds.top) / zoom,
            ...getDimensions(handle),
        };
    });
};

function getBezierEdgeCenter({ sourceX, sourceY, targetX, targetY, sourceControlX, sourceControlY, targetControlX, targetControlY, }) {
    /*
     * cubic bezier t=0.5 mid point, not the actual mid point, but easy to calculate
     * https://stackoverflow.com/questions/67516101/how-to-find-distance-mid-point-of-bezier-curve
     */
    const centerX = sourceX * 0.125 + sourceControlX * 0.375 + targetControlX * 0.375 + targetX * 0.125;
    const centerY = sourceY * 0.125 + sourceControlY * 0.375 + targetControlY * 0.375 + targetY * 0.125;
    const offsetX = Math.abs(centerX - sourceX);
    const offsetY = Math.abs(centerY - sourceY);
    return [centerX, centerY, offsetX, offsetY];
}
function calculateControlOffset(distance, curvature) {
    if (distance >= 0) {
        return 0.5 * distance;
    }
    return curvature * 25 * Math.sqrt(-distance);
}
function getControlWithCurvature({ pos, x1, y1, x2, y2, c }) {
    switch (pos) {
        case Position.Left:
            return [x1 - calculateControlOffset(x1 - x2, c), y1];
        case Position.Right:
            return [x1 + calculateControlOffset(x2 - x1, c), y1];
        case Position.Top:
            return [x1, y1 - calculateControlOffset(y1 - y2, c)];
        case Position.Bottom:
            return [x1, y1 + calculateControlOffset(y2 - y1, c)];
    }
}
/**
 * The `getBezierPath` util returns everything you need to render a bezier edge
 *between two nodes.
 * @public
 * @returns A path string you can use in an SVG, the `labelX` and `labelY` position (center of path)
 * and `offsetX`, `offsetY` between source handle and label.
 * - `path`: the path to use in an SVG `<path>` element.
 * - `labelX`: the `x` position you can use to render a label for this edge.
 * - `labelY`: the `y` position you can use to render a label for this edge.
 * - `offsetX`: the absolute difference between the source `x` position and the `x` position of the
 * middle of this path.
 * - `offsetY`: the absolute difference between the source `y` position and the `y` position of the
 * middle of this path.
 * @example
 * ```js
 *  const source = { x: 0, y: 20 };
 *  const target = { x: 150, y: 100 };
 *
 *  const [path, labelX, labelY, offsetX, offsetY] = getBezierPath({
 *    sourceX: source.x,
 *    sourceY: source.y,
 *    sourcePosition: Position.Right,
 *    targetX: target.x,
 *    targetY: target.y,
 *    targetPosition: Position.Left,
 *});
 *```
 *
 * @remarks This function returns a tuple (aka a fixed-size array) to make it easier to
 *work with multiple edge paths at once.
 */
function getBezierPath({ sourceX, sourceY, sourcePosition = Position.Bottom, targetX, targetY, targetPosition = Position.Top, curvature = 0.25, }) {
    const [sourceControlX, sourceControlY] = getControlWithCurvature({
        pos: sourcePosition,
        x1: sourceX,
        y1: sourceY,
        x2: targetX,
        y2: targetY,
        c: curvature,
    });
    const [targetControlX, targetControlY] = getControlWithCurvature({
        pos: targetPosition,
        x1: targetX,
        y1: targetY,
        x2: sourceX,
        y2: sourceY,
        c: curvature,
    });
    const [labelX, labelY, offsetX, offsetY] = getBezierEdgeCenter({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourceControlX,
        sourceControlY,
        targetControlX,
        targetControlY,
    });
    return [
        `M${sourceX},${sourceY} C${sourceControlX},${sourceControlY} ${targetControlX},${targetControlY} ${targetX},${targetY}`,
        labelX,
        labelY,
        offsetX,
        offsetY,
    ];
}

// this is used for straight edges and simple smoothstep edges (LTR, RTL, BTT, TTB)
function getEdgeCenter({ sourceX, sourceY, targetX, targetY, }) {
    const xOffset = Math.abs(targetX - sourceX) / 2;
    const centerX = targetX < sourceX ? targetX + xOffset : targetX - xOffset;
    const yOffset = Math.abs(targetY - sourceY) / 2;
    const centerY = targetY < sourceY ? targetY + yOffset : targetY - yOffset;
    return [centerX, centerY, xOffset, yOffset];
}
/**
 * Returns the z-index for an edge based on the node it connects and whether it is selected.
 * By default, edges are rendered below nodes. This behaviour is different for edges that are
 * connected to nodes with a parent, as they are rendered above the parent node.
 */
function getElevatedEdgeZIndex({ sourceNode, targetNode, selected = false, zIndex = 0, elevateOnSelect = false, zIndexMode = 'basic', }) {
    if (zIndexMode === 'manual') {
        return zIndex;
    }
    const edgeZ = elevateOnSelect && selected ? zIndex + 1000 : zIndex;
    const nodeZ = Math.max(sourceNode.parentId || (elevateOnSelect && sourceNode.selected) ? sourceNode.internals.z : 0, targetNode.parentId || (elevateOnSelect && targetNode.selected) ? targetNode.internals.z : 0);
    return edgeZ + nodeZ;
}
function isEdgeVisible({ sourceNode, targetNode, width, height, transform }) {
    const edgeBox = getBoundsOfBoxes(nodeToBox(sourceNode), nodeToBox(targetNode));
    if (edgeBox.x === edgeBox.x2) {
        edgeBox.x2 += 1;
    }
    if (edgeBox.y === edgeBox.y2) {
        edgeBox.y2 += 1;
    }
    const viewRect = {
        x: -transform[0] / transform[2],
        y: -transform[1] / transform[2],
        width: width / transform[2],
        height: height / transform[2],
    };
    return getOverlappingArea(viewRect, boxToRect(edgeBox)) > 0;
}
/**
 * The default edge ID generator function. Generates an ID based on the source, target, and handles.
 * @public
 * @param params - The connection or edge to generate an ID for.
 * @returns The generated edge ID.
 */
const getEdgeId = ({ source, sourceHandle, target, targetHandle }) => `xy-edge__${source}${sourceHandle || ''}-${target}${targetHandle || ''}`;
const connectionExists = (edge, edges) => {
    return edges.some((el) => el.source === edge.source &&
        el.target === edge.target &&
        (el.sourceHandle === edge.sourceHandle || (!el.sourceHandle && !edge.sourceHandle)) &&
        (el.targetHandle === edge.targetHandle || (!el.targetHandle && !edge.targetHandle)));
};
/**
 * This util is a convenience function to add a new Edge to an array of edges. It also performs some validation to make sure you don't add an invalid edge or duplicate an existing one.
 * @public
 * @param edgeParams - Either an `Edge` or a `Connection` you want to add.
 * @param edges - The array of all current edges.
 * @param options - Optional configuration object.
 * @returns A new array of edges with the new edge added.
 *
 * @remarks If an edge with the same `target` and `source` already exists (and the same
 *`targetHandle` and `sourceHandle` if those are set), then this util won't add
 *a new edge even if the `id` property is different.
 *
 */
const addEdge$1 = (edgeParams, edges, options = {}) => {
    if (!edgeParams.source || !edgeParams.target) {
        options.onError?.('006', errorMessages['error006']());
        return edges;
    }
    const edgeIdGenerator = options.getEdgeId || getEdgeId;
    let edge;
    if (isEdgeBase(edgeParams)) {
        edge = { ...edgeParams };
    }
    else {
        edge = {
            ...edgeParams,
            id: edgeIdGenerator(edgeParams),
        };
    }
    if (connectionExists(edge, edges)) {
        return edges;
    }
    if (edge.sourceHandle === null) {
        delete edge.sourceHandle;
    }
    if (edge.targetHandle === null) {
        delete edge.targetHandle;
    }
    return edges.concat(edge);
};

/**
 * Calculates the straight line path between two points.
 * @public
 * @returns A path string you can use in an SVG, the `labelX` and `labelY` position (center of path)
 * and `offsetX`, `offsetY` between source handle and label.
 *
 * - `path`: the path to use in an SVG `<path>` element.
 * - `labelX`: the `x` position you can use to render a label for this edge.
 * - `labelY`: the `y` position you can use to render a label for this edge.
 * - `offsetX`: the absolute difference between the source `x` position and the `x` position of the
 * middle of this path.
 * - `offsetY`: the absolute difference between the source `y` position and the `y` position of the
 * middle of this path.
 * @example
 * ```js
 *  const source = { x: 0, y: 20 };
 *  const target = { x: 150, y: 100 };
 *
 *  const [path, labelX, labelY, offsetX, offsetY] = getStraightPath({
 *    sourceX: source.x,
 *    sourceY: source.y,
 *    sourcePosition: Position.Right,
 *    targetX: target.x,
 *    targetY: target.y,
 *    targetPosition: Position.Left,
 *  });
 * ```
 * @remarks This function returns a tuple (aka a fixed-size array) to make it easier to work with multiple edge paths at once.
 */
function getStraightPath({ sourceX, sourceY, targetX, targetY, }) {
    const [labelX, labelY, offsetX, offsetY] = getEdgeCenter({
        sourceX,
        sourceY,
        targetX,
        targetY,
    });
    return [`M ${sourceX},${sourceY}L ${targetX},${targetY}`, labelX, labelY, offsetX, offsetY];
}

const handleDirections = {
    [Position.Left]: { x: -1, y: 0 },
    [Position.Right]: { x: 1, y: 0 },
    [Position.Top]: { x: 0, y: -1 },
    [Position.Bottom]: { x: 0, y: 1 },
};
const getDirection = ({ source, sourcePosition = Position.Bottom, target, }) => {
    if (sourcePosition === Position.Left || sourcePosition === Position.Right) {
        return source.x < target.x ? { x: 1, y: 0 } : { x: -1, y: 0 };
    }
    return source.y < target.y ? { x: 0, y: 1 } : { x: 0, y: -1 };
};
const distance = (a, b) => Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2));
/*
 * With this function we try to mimic an orthogonal edge routing behaviour
 * It's not as good as a real orthogonal edge routing, but it's faster and good enough as a default for step and smooth step edges
 */
function getPoints({ source, sourcePosition = Position.Bottom, target, targetPosition = Position.Top, center, offset, stepPosition, }) {
    const sourceDir = handleDirections[sourcePosition];
    const targetDir = handleDirections[targetPosition];
    const sourceGapped = { x: source.x + sourceDir.x * offset, y: source.y + sourceDir.y * offset };
    const targetGapped = { x: target.x + targetDir.x * offset, y: target.y + targetDir.y * offset };
    const dir = getDirection({
        source: sourceGapped,
        sourcePosition,
        target: targetGapped,
    });
    const dirAccessor = dir.x !== 0 ? 'x' : 'y';
    const currDir = dir[dirAccessor];
    let points = [];
    let centerX, centerY;
    const sourceGapOffset = { x: 0, y: 0 };
    const targetGapOffset = { x: 0, y: 0 };
    const [, , defaultOffsetX, defaultOffsetY] = getEdgeCenter({
        sourceX: source.x,
        sourceY: source.y,
        targetX: target.x,
        targetY: target.y,
    });
    // opposite handle positions, default case
    if (sourceDir[dirAccessor] * targetDir[dirAccessor] === -1) {
        if (dirAccessor === 'x') {
            // Primary direction is horizontal, so stepPosition affects X coordinate
            centerX = center.x ?? sourceGapped.x + (targetGapped.x - sourceGapped.x) * stepPosition;
            centerY = center.y ?? (sourceGapped.y + targetGapped.y) / 2;
        }
        else {
            // Primary direction is vertical, so stepPosition affects Y coordinate
            centerX = center.x ?? (sourceGapped.x + targetGapped.x) / 2;
            centerY = center.y ?? sourceGapped.y + (targetGapped.y - sourceGapped.y) * stepPosition;
        }
        /*
         *    --->
         *    |
         * >---
         */
        const verticalSplit = [
            { x: centerX, y: sourceGapped.y },
            { x: centerX, y: targetGapped.y },
        ];
        /*
         *    |
         *  ---
         *  |
         */
        const horizontalSplit = [
            { x: sourceGapped.x, y: centerY },
            { x: targetGapped.x, y: centerY },
        ];
        if (sourceDir[dirAccessor] === currDir) {
            points = dirAccessor === 'x' ? verticalSplit : horizontalSplit;
        }
        else {
            points = dirAccessor === 'x' ? horizontalSplit : verticalSplit;
        }
    }
    else {
        // sourceTarget means we take x from source and y from target, targetSource is the opposite
        const sourceTarget = [{ x: sourceGapped.x, y: targetGapped.y }];
        const targetSource = [{ x: targetGapped.x, y: sourceGapped.y }];
        // this handles edges with same handle positions
        if (dirAccessor === 'x') {
            points = sourceDir.x === currDir ? targetSource : sourceTarget;
        }
        else {
            points = sourceDir.y === currDir ? sourceTarget : targetSource;
        }
        if (sourcePosition === targetPosition) {
            const diff = Math.abs(source[dirAccessor] - target[dirAccessor]);
            // if an edge goes from right to right for example (sourcePosition === targetPosition) and the distance between source.x and target.x is less than the offset, the added point and the gapped source/target will overlap. This leads to a weird edge path. To avoid this we add a gapOffset to the source/target
            if (diff <= offset) {
                const gapOffset = Math.min(offset - 1, offset - diff);
                if (sourceDir[dirAccessor] === currDir) {
                    sourceGapOffset[dirAccessor] = (sourceGapped[dirAccessor] > source[dirAccessor] ? -1 : 1) * gapOffset;
                }
                else {
                    targetGapOffset[dirAccessor] = (targetGapped[dirAccessor] > target[dirAccessor] ? -1 : 1) * gapOffset;
                }
            }
        }
        // these are conditions for handling mixed handle positions like Right -> Bottom for example
        if (sourcePosition !== targetPosition) {
            const dirAccessorOpposite = dirAccessor === 'x' ? 'y' : 'x';
            const isSameDir = sourceDir[dirAccessor] === targetDir[dirAccessorOpposite];
            const sourceGtTargetOppo = sourceGapped[dirAccessorOpposite] > targetGapped[dirAccessorOpposite];
            const sourceLtTargetOppo = sourceGapped[dirAccessorOpposite] < targetGapped[dirAccessorOpposite];
            const flipSourceTarget = (sourceDir[dirAccessor] === 1 && ((!isSameDir && sourceGtTargetOppo) || (isSameDir && sourceLtTargetOppo))) ||
                (sourceDir[dirAccessor] !== 1 && ((!isSameDir && sourceLtTargetOppo) || (isSameDir && sourceGtTargetOppo)));
            if (flipSourceTarget) {
                points = dirAccessor === 'x' ? sourceTarget : targetSource;
            }
        }
        const sourceGapPoint = { x: sourceGapped.x + sourceGapOffset.x, y: sourceGapped.y + sourceGapOffset.y };
        const targetGapPoint = { x: targetGapped.x + targetGapOffset.x, y: targetGapped.y + targetGapOffset.y };
        const maxXDistance = Math.max(Math.abs(sourceGapPoint.x - points[0].x), Math.abs(targetGapPoint.x - points[0].x));
        const maxYDistance = Math.max(Math.abs(sourceGapPoint.y - points[0].y), Math.abs(targetGapPoint.y - points[0].y));
        // we want to place the label on the longest segment of the edge
        if (maxXDistance >= maxYDistance) {
            centerX = (sourceGapPoint.x + targetGapPoint.x) / 2;
            centerY = points[0].y;
        }
        else {
            centerX = points[0].x;
            centerY = (sourceGapPoint.y + targetGapPoint.y) / 2;
        }
    }
    const gappedSource = { x: sourceGapped.x + sourceGapOffset.x, y: sourceGapped.y + sourceGapOffset.y };
    const gappedTarget = { x: targetGapped.x + targetGapOffset.x, y: targetGapped.y + targetGapOffset.y };
    const pathPoints = [
        source,
        // we only want to add the gapped source/target if they are different from the first/last point to avoid duplicates which can cause issues with the bends
        ...(gappedSource.x !== points[0].x || gappedSource.y !== points[0].y ? [gappedSource] : []),
        ...points,
        ...(gappedTarget.x !== points[points.length - 1].x || gappedTarget.y !== points[points.length - 1].y
            ? [gappedTarget]
            : []),
        target,
    ];
    return [pathPoints, centerX, centerY, defaultOffsetX, defaultOffsetY];
}
function getBend(a, b, c, size) {
    const bendSize = Math.min(distance(a, b) / 2, distance(b, c) / 2, size);
    const { x, y } = b;
    // no bend
    if ((a.x === x && x === c.x) || (a.y === y && y === c.y)) {
        return `L${x} ${y}`;
    }
    // first segment is horizontal
    if (a.y === y) {
        const xDir = a.x < c.x ? -1 : 1;
        const yDir = a.y < c.y ? 1 : -1;
        return `L ${x + bendSize * xDir},${y}Q ${x},${y} ${x},${y + bendSize * yDir}`;
    }
    const xDir = a.x < c.x ? 1 : -1;
    const yDir = a.y < c.y ? -1 : 1;
    return `L ${x},${y + bendSize * yDir}Q ${x},${y} ${x + bendSize * xDir},${y}`;
}
/**
 * The `getSmoothStepPath` util returns everything you need to render a stepped path
 * between two nodes. The `borderRadius` property can be used to choose how rounded
 * the corners of those steps are.
 * @public
 * @returns A path string you can use in an SVG, the `labelX` and `labelY` position (center of path)
 * and `offsetX`, `offsetY` between source handle and label.
 *
 * - `path`: the path to use in an SVG `<path>` element.
 * - `labelX`: the `x` position you can use to render a label for this edge.
 * - `labelY`: the `y` position you can use to render a label for this edge.
 * - `offsetX`: the absolute difference between the source `x` position and the `x` position of the
 * middle of this path.
 * - `offsetY`: the absolute difference between the source `y` position and the `y` position of the
 * middle of this path.
 * @example
 * ```js
 *  const source = { x: 0, y: 20 };
 *  const target = { x: 150, y: 100 };
 *
 *  const [path, labelX, labelY, offsetX, offsetY] = getSmoothStepPath({
 *    sourceX: source.x,
 *    sourceY: source.y,
 *    sourcePosition: Position.Right,
 *    targetX: target.x,
 *    targetY: target.y,
 *    targetPosition: Position.Left,
 *  });
 * ```
 * @remarks This function returns a tuple (aka a fixed-size array) to make it easier to work with multiple edge paths at once.
 */
function getSmoothStepPath({ sourceX, sourceY, sourcePosition = Position.Bottom, targetX, targetY, targetPosition = Position.Top, borderRadius = 5, centerX, centerY, offset = 20, stepPosition = 0.5, }) {
    const [points, labelX, labelY, offsetX, offsetY] = getPoints({
        source: { x: sourceX, y: sourceY },
        sourcePosition,
        target: { x: targetX, y: targetY },
        targetPosition,
        center: { x: centerX, y: centerY },
        offset,
        stepPosition,
    });
    let path = `M${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length - 1; i++) {
        path += getBend(points[i - 1], points[i], points[i + 1], borderRadius);
    }
    path += `L${points[points.length - 1].x} ${points[points.length - 1].y}`;
    return [path, labelX, labelY, offsetX, offsetY];
}

function isNodeInitialized(node) {
    return (node &&
        !!(node.internals.handleBounds || node.handles?.length) &&
        !!(node.measured.width || node.width || node.initialWidth));
}
function getEdgePosition(params) {
    const { sourceNode, targetNode } = params;
    if (!isNodeInitialized(sourceNode) || !isNodeInitialized(targetNode)) {
        return null;
    }
    const sourceHandleBounds = sourceNode.internals.handleBounds || toHandleBounds(sourceNode.handles);
    const targetHandleBounds = targetNode.internals.handleBounds || toHandleBounds(targetNode.handles);
    const sourceHandle = getHandle$1(sourceHandleBounds?.source ?? [], params.sourceHandle);
    const targetHandle = getHandle$1(
    // when connection type is loose we can define all handles as sources and connect source -> source
    params.connectionMode === ConnectionMode.Strict
        ? targetHandleBounds?.target ?? []
        : (targetHandleBounds?.target ?? []).concat(targetHandleBounds?.source ?? []), params.targetHandle);
    if (!sourceHandle || !targetHandle) {
        params.onError?.('008', errorMessages['error008'](!sourceHandle ? 'source' : 'target', {
            id: params.id,
            sourceHandle: params.sourceHandle,
            targetHandle: params.targetHandle,
        }));
        return null;
    }
    const sourcePosition = sourceHandle?.position || Position.Bottom;
    const targetPosition = targetHandle?.position || Position.Top;
    const source = getHandlePosition(sourceNode, sourceHandle, sourcePosition);
    const target = getHandlePosition(targetNode, targetHandle, targetPosition);
    return {
        sourceX: source.x,
        sourceY: source.y,
        targetX: target.x,
        targetY: target.y,
        sourcePosition,
        targetPosition,
    };
}
function toHandleBounds(handles) {
    if (!handles) {
        return null;
    }
    const source = [];
    const target = [];
    for (const handle of handles) {
        handle.width = handle.width ?? 1;
        handle.height = handle.height ?? 1;
        if (handle.type === 'source') {
            source.push(handle);
        }
        else if (handle.type === 'target') {
            target.push(handle);
        }
    }
    return {
        source,
        target,
    };
}
function getHandlePosition(node, handle, fallbackPosition = Position.Left, center = false) {
    const x = (handle?.x ?? 0) + node.internals.positionAbsolute.x;
    const y = (handle?.y ?? 0) + node.internals.positionAbsolute.y;
    const { width, height } = handle ?? getNodeDimensions(node);
    if (center) {
        return { x: x + width / 2, y: y + height / 2 };
    }
    const position = handle?.position ?? fallbackPosition;
    switch (position) {
        case Position.Top:
            return { x: x + width / 2, y };
        case Position.Right:
            return { x: x + width, y: y + height / 2 };
        case Position.Bottom:
            return { x: x + width / 2, y: y + height };
        case Position.Left:
            return { x, y: y + height / 2 };
    }
}
function getHandle$1(bounds, handleId) {
    if (!bounds) {
        return null;
    }
    // if no handleId is given, we use the first handle, otherwise we check for the id
    return (!handleId ? bounds[0] : bounds.find((d) => d.id === handleId)) || null;
}

function getMarkerId(marker, id) {
    if (!marker) {
        return '';
    }
    if (typeof marker === 'string') {
        return marker;
    }
    const idPrefix = id ? `${id}__` : '';
    return `${idPrefix}${Object.keys(marker)
        .sort()
        .map((key) => `${key}=${marker[key]}`)
        .join('&')}`;
}
function createMarkerIds(edges, { id, defaultColor, defaultMarkerStart, defaultMarkerEnd, }) {
    const ids = new Set();
    return edges
        .reduce((markers, edge) => {
        [edge.markerStart || defaultMarkerStart, edge.markerEnd || defaultMarkerEnd].forEach((marker) => {
            if (marker && typeof marker === 'object') {
                const markerId = getMarkerId(marker, id);
                if (!ids.has(markerId)) {
                    markers.push({ id: markerId, color: marker.color || defaultColor, ...marker });
                    ids.add(markerId);
                }
            }
        });
        return markers;
    }, [])
        .sort((a, b) => a.id.localeCompare(b.id));
}

const SELECTED_NODE_Z = 1000;
const ROOT_PARENT_Z_INCREMENT = 10;
const defaultOptions = {
    nodeOrigin: [0, 0],
    nodeExtent: infiniteExtent,
    elevateNodesOnSelect: true,
    zIndexMode: 'basic',
    defaults: {},
};
const adoptUserNodesDefaultOptions = {
    ...defaultOptions,
    checkEquality: true,
};
function mergeObjects(base, incoming) {
    const result = { ...base };
    for (const key in incoming) {
        if (incoming[key] !== undefined) {
            // typecast is safe here, because we check for undefined
            result[key] = incoming[key];
        }
    }
    return result;
}
function updateAbsolutePositions(nodeLookup, parentLookup, options) {
    const _options = mergeObjects(defaultOptions, options);
    for (const node of nodeLookup.values()) {
        if (node.parentId) {
            updateChildNode(node, nodeLookup, parentLookup, _options);
        }
        else {
            const positionWithOrigin = getNodePositionWithOrigin(node, _options.nodeOrigin);
            const extent = isCoordinateExtent(node.extent) ? node.extent : _options.nodeExtent;
            const clampedPosition = clampPosition(positionWithOrigin, extent, getNodeDimensions(node));
            node.internals.positionAbsolute = clampedPosition;
        }
    }
}
function parseHandles(userNode, internalNode) {
    if (!userNode.handles) {
        return !userNode.measured ? undefined : internalNode?.internals.handleBounds;
    }
    const source = [];
    const target = [];
    for (const handle of userNode.handles) {
        const handleBounds = {
            id: handle.id,
            width: handle.width ?? 1,
            height: handle.height ?? 1,
            nodeId: userNode.id,
            x: handle.x,
            y: handle.y,
            position: handle.position,
            type: handle.type,
        };
        if (handle.type === 'source') {
            source.push(handleBounds);
        }
        else if (handle.type === 'target') {
            target.push(handleBounds);
        }
    }
    return {
        source,
        target,
    };
}
function isManualZIndexMode(zIndexMode) {
    return zIndexMode === 'manual';
}
function adoptUserNodes(nodes, nodeLookup, parentLookup, options = {}) {
    const _options = mergeObjects(adoptUserNodesDefaultOptions, options);
    const rootParentIndex = { i: 0 };
    const tmpLookup = new Map(nodeLookup);
    const selectedNodeZ = _options?.elevateNodesOnSelect && !isManualZIndexMode(_options.zIndexMode) ? SELECTED_NODE_Z : 0;
    let nodesInitialized = nodes.length > 0;
    let hasSelectedNodes = false;
    nodeLookup.clear();
    parentLookup.clear();
    for (const userNode of nodes) {
        let internalNode = tmpLookup.get(userNode.id);
        if (_options.checkEquality && userNode === internalNode?.internals.userNode) {
            nodeLookup.set(userNode.id, internalNode);
        }
        else {
            const positionWithOrigin = getNodePositionWithOrigin(userNode, _options.nodeOrigin);
            const extent = isCoordinateExtent(userNode.extent) ? userNode.extent : _options.nodeExtent;
            const clampedPosition = clampPosition(positionWithOrigin, extent, getNodeDimensions(userNode));
            internalNode = {
                ..._options.defaults,
                ...userNode,
                measured: {
                    width: userNode.measured?.width,
                    height: userNode.measured?.height,
                },
                internals: {
                    positionAbsolute: clampedPosition,
                    // if user re-initializes the node or removes `measured` for whatever reason, we reset the handleBounds so that the node gets re-measured
                    handleBounds: parseHandles(userNode, internalNode),
                    z: calculateZ(userNode, selectedNodeZ, _options.zIndexMode),
                    userNode,
                },
            };
            nodeLookup.set(userNode.id, internalNode);
        }
        if ((internalNode.measured === undefined ||
            internalNode.measured.width === undefined ||
            internalNode.measured.height === undefined) &&
            !internalNode.hidden) {
            nodesInitialized = false;
        }
        if (userNode.parentId) {
            updateChildNode(internalNode, nodeLookup, parentLookup, options, rootParentIndex);
        }
        hasSelectedNodes ||= userNode.selected ?? false;
    }
    return { nodesInitialized, hasSelectedNodes };
}
function updateParentLookup(node, parentLookup) {
    if (!node.parentId) {
        return;
    }
    const childNodes = parentLookup.get(node.parentId);
    if (childNodes) {
        childNodes.set(node.id, node);
    }
    else {
        parentLookup.set(node.parentId, new Map([[node.id, node]]));
    }
}
/**
 * Updates positionAbsolute and zIndex of a child node and the parentLookup.
 */
function updateChildNode(node, nodeLookup, parentLookup, options, rootParentIndex) {
    const { elevateNodesOnSelect, nodeOrigin, nodeExtent, zIndexMode } = mergeObjects(defaultOptions, options);
    const parentId = node.parentId;
    const parentNode = nodeLookup.get(parentId);
    if (!parentNode) {
        console.warn(`Parent node ${parentId} not found. Please make sure that parent nodes are in front of their child nodes in the nodes array.`);
        return;
    }
    updateParentLookup(node, parentLookup);
    // We just want to set the rootParentIndex for the first child
    if (rootParentIndex &&
        !parentNode.parentId &&
        parentNode.internals.rootParentIndex === undefined &&
        zIndexMode === 'auto') {
        parentNode.internals.rootParentIndex = ++rootParentIndex.i;
        parentNode.internals.z = parentNode.internals.z + rootParentIndex.i * ROOT_PARENT_Z_INCREMENT;
    }
    // But we need to update rootParentIndex.i also when parent has not been updated
    if (rootParentIndex && parentNode.internals.rootParentIndex !== undefined) {
        rootParentIndex.i = parentNode.internals.rootParentIndex;
    }
    const selectedNodeZ = elevateNodesOnSelect && !isManualZIndexMode(zIndexMode) ? SELECTED_NODE_Z : 0;
    const { x, y, z } = calculateChildXYZ(node, parentNode, nodeOrigin, nodeExtent, selectedNodeZ, zIndexMode);
    const { positionAbsolute } = node.internals;
    const positionChanged = x !== positionAbsolute.x || y !== positionAbsolute.y;
    if (positionChanged || z !== node.internals.z) {
        // we create a new object to mark the node as updated
        nodeLookup.set(node.id, {
            ...node,
            internals: {
                ...node.internals,
                positionAbsolute: positionChanged ? { x, y } : positionAbsolute,
                z,
            },
        });
    }
}
function calculateZ(node, selectedNodeZ, zIndexMode) {
    const zIndex = isNumeric(node.zIndex) ? node.zIndex : 0;
    if (isManualZIndexMode(zIndexMode)) {
        return zIndex;
    }
    return zIndex + (node.selected ? selectedNodeZ : 0);
}
function calculateChildXYZ(childNode, parentNode, nodeOrigin, nodeExtent, selectedNodeZ, zIndexMode) {
    const { x: parentX, y: parentY } = parentNode.internals.positionAbsolute;
    const childDimensions = getNodeDimensions(childNode);
    const positionWithOrigin = getNodePositionWithOrigin(childNode, nodeOrigin);
    const clampedPosition = isCoordinateExtent(childNode.extent)
        ? clampPosition(positionWithOrigin, childNode.extent, childDimensions)
        : positionWithOrigin;
    let absolutePosition = clampPosition({ x: parentX + clampedPosition.x, y: parentY + clampedPosition.y }, nodeExtent, childDimensions);
    if (childNode.extent === 'parent') {
        absolutePosition = clampPositionToParent(absolutePosition, childDimensions, parentNode);
    }
    const childZ = calculateZ(childNode, selectedNodeZ, zIndexMode);
    const parentZ = parentNode.internals.z ?? 0;
    return {
        x: absolutePosition.x,
        y: absolutePosition.y,
        z: parentZ >= childZ ? parentZ + 1 : childZ,
    };
}
function handleExpandParent(children, nodeLookup, parentLookup, nodeOrigin = [0, 0]) {
    const changes = [];
    const parentExpansions = new Map();
    // determine the expanded rectangle the child nodes would take for each parent
    for (const child of children) {
        const parent = nodeLookup.get(child.parentId);
        if (!parent) {
            continue;
        }
        const parentRect = parentExpansions.get(child.parentId)?.expandedRect ?? nodeToRect(parent);
        const expandedRect = getBoundsOfRects(parentRect, child.rect);
        parentExpansions.set(child.parentId, { expandedRect, parent });
    }
    if (parentExpansions.size > 0) {
        parentExpansions.forEach(({ expandedRect, parent }, parentId) => {
            // determine the position & dimensions of the parent
            const positionAbsolute = parent.internals.positionAbsolute;
            const dimensions = getNodeDimensions(parent);
            const origin = parent.origin ?? nodeOrigin;
            // determine how much the parent expands in width and position
            const xChange = expandedRect.x < positionAbsolute.x ? Math.round(Math.abs(positionAbsolute.x - expandedRect.x)) : 0;
            const yChange = expandedRect.y < positionAbsolute.y ? Math.round(Math.abs(positionAbsolute.y - expandedRect.y)) : 0;
            const newWidth = Math.max(dimensions.width, Math.round(expandedRect.width));
            const newHeight = Math.max(dimensions.height, Math.round(expandedRect.height));
            const widthChange = (newWidth - dimensions.width) * origin[0];
            const heightChange = (newHeight - dimensions.height) * origin[1];
            // We need to correct the position of the parent node if the origin is not [0,0]
            if (xChange > 0 || yChange > 0 || widthChange || heightChange) {
                changes.push({
                    id: parentId,
                    type: 'position',
                    position: {
                        x: parent.position.x - xChange + widthChange,
                        y: parent.position.y - yChange + heightChange,
                    },
                });
                /*
                 * We move all child nodes in the oppsite direction
                 * so the x,y changes of the parent do not move the children
                 */
                parentLookup.get(parentId)?.forEach((childNode) => {
                    if (!children.some((child) => child.id === childNode.id)) {
                        changes.push({
                            id: childNode.id,
                            type: 'position',
                            position: {
                                x: childNode.position.x + xChange,
                                y: childNode.position.y + yChange,
                            },
                        });
                    }
                });
            }
            // We need to correct the dimensions of the parent node if the origin is not [0,0]
            if (dimensions.width < expandedRect.width || dimensions.height < expandedRect.height || xChange || yChange) {
                changes.push({
                    id: parentId,
                    type: 'dimensions',
                    setAttributes: true,
                    dimensions: {
                        width: newWidth + (xChange ? origin[0] * xChange - widthChange : 0),
                        height: newHeight + (yChange ? origin[1] * yChange - heightChange : 0),
                    },
                });
            }
        });
    }
    return changes;
}
function updateNodeInternals(updates, nodeLookup, parentLookup, domNode, nodeOrigin, nodeExtent, zIndexMode) {
    const viewportNode = domNode?.querySelector('.xyflow__viewport');
    let updatedInternals = false;
    if (!viewportNode) {
        return { changes: [], updatedInternals };
    }
    const changes = [];
    const style = window.getComputedStyle(viewportNode);
    const { m22: zoom } = new window.DOMMatrixReadOnly(style.transform);
    // in this array we collect nodes, that might trigger changes (like expanding parent)
    const parentExpandChildren = [];
    for (const update of updates.values()) {
        const node = nodeLookup.get(update.id);
        if (!node) {
            continue;
        }
        if (node.hidden) {
            nodeLookup.set(node.id, {
                ...node,
                internals: {
                    ...node.internals,
                    handleBounds: undefined,
                },
            });
            updatedInternals = true;
            continue;
        }
        const dimensions = getDimensions(update.nodeElement);
        const dimensionChanged = node.measured.width !== dimensions.width || node.measured.height !== dimensions.height;
        const doUpdate = !!(dimensions.width &&
            dimensions.height &&
            (dimensionChanged || !node.internals.handleBounds || update.force));
        if (doUpdate) {
            const nodeBounds = update.nodeElement.getBoundingClientRect();
            const extent = isCoordinateExtent(node.extent) ? node.extent : nodeExtent;
            let { positionAbsolute } = node.internals;
            if (node.parentId && node.extent === 'parent') {
                const parentNode = nodeLookup.get(node.parentId);
                if (parentNode) {
                    positionAbsolute = clampPositionToParent(positionAbsolute, dimensions, parentNode);
                }
            }
            else if (extent) {
                positionAbsolute = clampPosition(positionAbsolute, extent, dimensions);
            }
            const newNode = {
                ...node,
                measured: dimensions,
                internals: {
                    ...node.internals,
                    positionAbsolute,
                    handleBounds: {
                        source: getHandleBounds('source', update.nodeElement, nodeBounds, zoom, node.id),
                        target: getHandleBounds('target', update.nodeElement, nodeBounds, zoom, node.id),
                    },
                },
            };
            nodeLookup.set(node.id, newNode);
            if (node.parentId) {
                updateChildNode(newNode, nodeLookup, parentLookup, { nodeOrigin, zIndexMode });
            }
            updatedInternals = true;
            if (dimensionChanged) {
                changes.push({
                    id: node.id,
                    type: 'dimensions',
                    dimensions,
                });
                if (node.expandParent && node.parentId) {
                    parentExpandChildren.push({
                        id: node.id,
                        parentId: node.parentId,
                        rect: nodeToRect(newNode, nodeOrigin),
                    });
                }
            }
        }
    }
    if (parentExpandChildren.length > 0) {
        const parentExpandChanges = handleExpandParent(parentExpandChildren, nodeLookup, parentLookup, nodeOrigin);
        changes.push(...parentExpandChanges);
    }
    return { changes, updatedInternals };
}
async function panBy({ delta, panZoom, transform, translateExtent, width, height, }) {
    if (!panZoom || (!delta.x && !delta.y)) {
        return false;
    }
    const nextViewport = await panZoom.setViewportConstrained({
        x: transform[0] + delta.x,
        y: transform[1] + delta.y,
        zoom: transform[2],
    }, [
        [0, 0],
        [width, height],
    ], translateExtent);
    const transformChanged = !!nextViewport &&
        (nextViewport.x !== transform[0] || nextViewport.y !== transform[1] || nextViewport.k !== transform[2]);
    return transformChanged;
}
/**
 * this function adds the connection to the connectionLookup
 * at the following keys: nodeId-type-handleId, nodeId-type and nodeId
 * @param type type of the connection
 * @param connection connection that should be added to the lookup
 * @param connectionKey at which key the connection should be added
 * @param connectionLookup reference to the connection lookup
 * @param nodeId nodeId of the connection
 * @param handleId handleId of the connection
 */
function addConnectionToLookup(type, connection, connectionKey, connectionLookup, nodeId, handleId) {
    /*
     * We add the connection to the connectionLookup at the following keys
     * 1. nodeId, 2. nodeId-type, 3. nodeId-type-handleId
     * If the key already exists, we add the connection to the existing map
     */
    let key = nodeId;
    const nodeMap = connectionLookup.get(key) || new Map();
    connectionLookup.set(key, nodeMap.set(connectionKey, connection));
    key = `${nodeId}-${type}`;
    const typeMap = connectionLookup.get(key) || new Map();
    connectionLookup.set(key, typeMap.set(connectionKey, connection));
    if (handleId) {
        key = `${nodeId}-${type}-${handleId}`;
        const handleMap = connectionLookup.get(key) || new Map();
        connectionLookup.set(key, handleMap.set(connectionKey, connection));
    }
}
function updateConnectionLookup(connectionLookup, edgeLookup, edges) {
    connectionLookup.clear();
    edgeLookup.clear();
    for (const edge of edges) {
        const { source: sourceNode, target: targetNode, sourceHandle = null, targetHandle = null } = edge;
        const connection = { edgeId: edge.id, source: sourceNode, target: targetNode, sourceHandle, targetHandle };
        const sourceKey = `${sourceNode}-${sourceHandle}--${targetNode}-${targetHandle}`;
        const targetKey = `${targetNode}-${targetHandle}--${sourceNode}-${sourceHandle}`;
        addConnectionToLookup('source', connection, targetKey, connectionLookup, sourceNode, sourceHandle);
        addConnectionToLookup('target', connection, sourceKey, connectionLookup, targetNode, targetHandle);
        edgeLookup.set(edge.id, edge);
    }
}

/**
 * Used to determine the variant of the resize control
 *
 * @public
 */
var ResizeControlVariant;
(function (ResizeControlVariant) {
    ResizeControlVariant["Line"] = "line";
    ResizeControlVariant["Handle"] = "handle";
})(ResizeControlVariant || (ResizeControlVariant = {}));

const empty = [];
function snapshot(value, skip_warning = false, no_tojson = false) {
  return clone(value, /* @__PURE__ */ new Map(), "", empty, null, no_tojson);
}
function clone(value, cloned, path, paths, original = null, no_tojson = false) {
  if (typeof value === "object" && value !== null) {
    var unwrapped = cloned.get(value);
    if (unwrapped !== void 0) return unwrapped;
    if (value instanceof Map) return (
      /** @type {Snapshot<T>} */
      new Map(value)
    );
    if (value instanceof Set) return (
      /** @type {Snapshot<T>} */
      new Set(value)
    );
    if (is_array(value)) {
      var copy = (
        /** @type {Snapshot<any>} */
        Array(value.length)
      );
      cloned.set(value, copy);
      if (original !== null) {
        cloned.set(original, copy);
      }
      for (var i = 0; i < value.length; i += 1) {
        var element = value[i];
        if (i in value) {
          copy[i] = clone(element, cloned, path, paths, null, no_tojson);
        }
      }
      return copy;
    }
    if (get_prototype_of(value) === object_prototype) {
      copy = {};
      cloned.set(value, copy);
      if (original !== null) {
        cloned.set(original, copy);
      }
      for (var key2 of Object.keys(value)) {
        copy[key2] = clone(
          // @ts-expect-error
          value[key2],
          cloned,
          path,
          paths,
          null,
          no_tojson
        );
      }
      return copy;
    }
    if (value instanceof Date) {
      return (
        /** @type {Snapshot<T>} */
        structuredClone(value)
      );
    }
    if (typeof /** @type {T & { toJSON?: any } } */
    value.toJSON === "function" && !no_tojson) {
      return clone(
        /** @type {T & { toJSON(): any } } */
        value.toJSON(),
        cloned,
        path,
        paths,
        // Associate the instance with the toJSON clone
        value
      );
    }
  }
  if (value instanceof EventTarget) {
    return (
      /** @type {Snapshot<T>} */
      value
    );
  }
  try {
    return (
      /** @type {Snapshot<T>} */
      structuredClone(value)
    );
  } catch (e) {
    return (
      /** @type {Snapshot<T>} */
      value
    );
  }
}
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
class MediaQuery {
  current;
  /**
   * @param {string} query
   * @param {boolean} [matches]
   */
  constructor(query, matches = false) {
    this.current = matches;
  }
}
const defaultOnError = createDevWarn("Svelte Flow", "https://svelteflow.dev/");
function addEdge(edgeParams, edges, options = {}) {
  return addEdge$1(edgeParams, edges, {
    ...options,
    onError: options.onError ?? defaultOnError
  });
}
function createContext() {
  const key2 = {};
  return [
    (errorMessage) => {
      if (errorMessage && !hasContext(key2)) {
        throw new Error(errorMessage);
      }
      return getContext(key2);
    },
    (context) => setContext(key2, context)
  ];
}
const [getNodeIdContext, setNodeIdContext] = createContext();
const [getNodeConnectableContext, setNodeConnectableContext] = createContext();
const [getEdgeIdContext, setEdgeIdContext] = createContext();
function Handle($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      id: handleId = null,
      type = "source",
      position = Position.Top,
      style,
      class: className,
      isConnectable: isConnectableProp,
      isConnectableStart = true,
      isConnectableEnd = true,
      isValidConnection,
      onconnect,
      ondisconnect,
      children,
      $$slots,
      $$events,
      ...rest
    } = $$props;
    const nodeId = getNodeIdContext("Handle must be used within a Custom Node component");
    const isConnectableContext = getNodeConnectableContext("Handle must be used within a Custom Node component");
    let isTarget = derived(() => type === "target");
    let isConnectable = derived(() => isConnectableProp !== void 0 ? isConnectableProp : isConnectableContext.value);
    let store = useStore();
    let ariaLabelConfig = derived(() => store.ariaLabelConfig);
    let $$d = derived(() => {
      if (!store.connection.inProgress) {
        return [false, false, false, false, null];
      }
      const { fromHandle, toHandle, isValid } = store.connection;
      const connectingFrom2 = fromHandle && fromHandle.nodeId === nodeId && fromHandle.type === type && fromHandle.id === handleId;
      const connectingTo2 = toHandle && toHandle.nodeId === nodeId && toHandle.type === type && toHandle.id === handleId;
      const isPossibleTargetHandle2 = store.connectionMode === ConnectionMode.Strict ? fromHandle?.type !== type : nodeId !== fromHandle?.nodeId || handleId !== fromHandle?.id;
      const valid2 = connectingTo2 && isValid;
      return [
        true,
        connectingFrom2,
        connectingTo2,
        isPossibleTargetHandle2,
        valid2
      ];
    }), $$derived_array = derived(() => to_array($$d(), 5)), connectionInProgress = derived(() => $$derived_array()[0]), connectingFrom = derived(() => $$derived_array()[1]), connectingTo = derived(() => $$derived_array()[2]), isPossibleTargetHandle = derived(() => $$derived_array()[3]), valid = derived(() => $$derived_array()[4]);
    $$renderer2.push(`<div${attributes(
      {
        "data-handleid": handleId,
        "data-nodeid": nodeId,
        "data-handlepos": position,
        "data-id": `${stringify(store.flowId)}-${stringify(nodeId)}-${stringify(handleId ?? "null")}-${stringify(type)}`,
        class: clsx([
          "svelte-flow__handle",
          `svelte-flow__handle-${position}`,
          store.noDragClass,
          store.noPanClass,
          position,
          className
        ]),
        style,
        role: "button",
        "aria-label": ariaLabelConfig()[`handle.ariaLabel`],
        tabindex: "-1",
        ...rest
      },
      void 0,
      {
        valid,
        connectingto: connectingTo(),
        connectingfrom: connectingFrom(),
        source: !isTarget(),
        target: isTarget(),
        connectablestart: isConnectableStart,
        connectableend: isConnectableEnd,
        connectable: isConnectable(),
        connectionindicator: isConnectable() && (!connectionInProgress() || isPossibleTargetHandle()) && (connectionInProgress() || store.clickConnectStartHandle ? isConnectableEnd : isConnectableStart)
      }
    )}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
  });
}
function DefaultNode($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      data,
      targetPosition = Position.Top,
      sourcePosition = Position.Bottom
    } = $$props;
    Handle($$renderer2, { type: "target", position: targetPosition });
    $$renderer2.push(`<!----> ${escape_html(data?.label)} `);
    Handle($$renderer2, { type: "source", position: sourcePosition });
    $$renderer2.push(`<!---->`);
  });
}
function InputNode($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data = { label: "Node" }, sourcePosition = Position.Bottom } = $$props;
    $$renderer2.push(`<!---->${escape_html(data?.label)} `);
    Handle($$renderer2, { type: "source", position: sourcePosition });
    $$renderer2.push(`<!---->`);
  });
}
function OutputNode($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data = { label: "Node" }, targetPosition = Position.Top } = $$props;
    $$renderer2.push(`<!---->${escape_html(data?.label)} `);
    Handle($$renderer2, { type: "target", position: targetPosition });
    $$renderer2.push(`<!---->`);
  });
}
function GroupNode($$renderer, $$props) {
}
function hideOnSSR() {
  let hide = typeof window === "undefined";
  return {
    get value() {
      return hide;
    }
  };
}
const isNode = (element) => isNodeBase(element);
const isEdge = (element) => isEdgeBase(element);
function toPxString(value) {
  return value === void 0 ? void 0 : `${value}px`;
}
function EdgeLabel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      x = 0,
      y = 0,
      width,
      height,
      selectEdgeOnClick = false,
      transparent = false,
      class: className,
      children,
      $$slots,
      $$events,
      ...rest
    } = $$props;
    const store = useStore();
    const edgeId = getEdgeIdContext("EdgeLabel must be used within a Custom Edge component");
    let z = derived(() => {
      return store.visible.edges.get(edgeId)?.zIndex;
    });
    $$renderer2.push(`<div${attributes(
      {
        class: clsx(["svelte-flow__edge-label", { transparent }, className]),
        tabindex: "-1",
        ...rest
      },
      "svelte-1wg91mu",
      void 0,
      {
        display: hideOnSSR().value ? "none" : void 0,
        cursor: selectEdgeOnClick ? "pointer" : void 0,
        transform: `translate(-50%, -50%) translate(${stringify(x)}px,${stringify(y)}px)`,
        "pointer-events": "all",
        width: toPxString(width),
        height: toPxString(height),
        "z-index": z()
      }
    )}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
  });
}
function BaseEdge($$renderer, $$props) {
  let {
    id,
    path,
    label,
    labelX,
    labelY,
    labelStyle,
    markerStart,
    markerEnd,
    style,
    interactionWidth = 20,
    class: className,
    $$slots,
    $$events,
    ...rest
  } = $$props;
  $$renderer.push(`<path${attr("id", id)}${attr("d", path)}${attr_class(clsx(["svelte-flow__edge-path", className]))}${attr("marker-start", markerStart)}${attr("marker-end", markerEnd)} fill="none"${attr_style(style)}></path>`);
  if (interactionWidth > 0) {
    $$renderer.push("<!--[-->");
    $$renderer.push(`<path${attributes(
      {
        d: path,
        "stroke-opacity": 0,
        "stroke-width": interactionWidth,
        fill: "none",
        class: "svelte-flow__edge-interaction",
        ...rest
      },
      void 0,
      void 0,
      void 0,
      3
    )}></path>`);
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]-->`);
  if (label) {
    $$renderer.push("<!--[-->");
    EdgeLabel($$renderer, {
      x: labelX,
      y: labelY,
      style: labelStyle,
      selectEdgeOnClick: true,
      children: ($$renderer2) => {
        $$renderer2.push(`<!---->${escape_html(label)}`);
      },
      $$slots: { default: true }
    });
  } else {
    $$renderer.push("<!--[!-->");
  }
  $$renderer.push(`<!--]-->`);
}
function BezierEdge($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      id,
      interactionWidth,
      label,
      labelStyle,
      markerEnd,
      markerStart,
      pathOptions,
      sourcePosition,
      sourceX,
      sourceY,
      style,
      targetPosition,
      targetX,
      targetY
    } = $$props;
    let $$d = derived(() => getBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      curvature: pathOptions?.curvature
    })), $$derived_array = derived(() => to_array($$d(), 3)), path = derived(() => $$derived_array()[0]), labelX = derived(() => $$derived_array()[1]), labelY = derived(() => $$derived_array()[2]);
    BaseEdge($$renderer2, {
      id,
      path: path(),
      labelX: labelX(),
      labelY: labelY(),
      label,
      labelStyle,
      markerStart,
      markerEnd,
      interactionWidth,
      style
    });
  });
}
function SmoothStepEdgeInternal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      interactionWidth,
      label,
      labelStyle,
      style,
      markerEnd,
      markerStart,
      sourcePosition,
      sourceX,
      sourceY,
      targetPosition,
      targetX,
      targetY
    } = $$props;
    let $$d = derived(() => getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition
    })), $$derived_array = derived(() => to_array($$d(), 3)), path = derived(() => $$derived_array()[0]), labelX = derived(() => $$derived_array()[1]), labelY = derived(() => $$derived_array()[2]);
    BaseEdge($$renderer2, {
      path: path(),
      labelX: labelX(),
      labelY: labelY(),
      label,
      labelStyle,
      markerStart,
      markerEnd,
      interactionWidth,
      style
    });
  });
}
function StraightEdgeInternal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      sourceX,
      sourceY,
      targetX,
      targetY,
      label,
      labelStyle,
      markerStart,
      markerEnd,
      interactionWidth,
      style
    } = $$props;
    let $$d = derived(() => getStraightPath({ sourceX, sourceY, targetX, targetY })), $$derived_array = derived(() => to_array($$d(), 3)), path = derived(() => $$derived_array()[0]), labelX = derived(() => $$derived_array()[1]), labelY = derived(() => $$derived_array()[2]);
    BaseEdge($$renderer2, {
      path: path(),
      labelX: labelX(),
      labelY: labelY(),
      label,
      labelStyle,
      markerStart,
      markerEnd,
      interactionWidth,
      style
    });
  });
}
function StepEdgeInternal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      label,
      labelStyle,
      markerStart,
      markerEnd,
      interactionWidth,
      style
    } = $$props;
    let $$d = derived(() => getSmoothStepPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
      borderRadius: 0
    })), $$derived_array = derived(() => to_array($$d(), 3)), path = derived(() => $$derived_array()[0]), labelX = derived(() => $$derived_array()[1]), labelY = derived(() => $$derived_array()[2]);
    BaseEdge($$renderer2, {
      path: path(),
      labelX: labelX(),
      labelY: labelY(),
      label,
      labelStyle,
      markerStart,
      markerEnd,
      interactionWidth,
      style
    });
  });
}
function getVisibleNodes(nodeLookup, transform, width, height) {
  const visibleNodes = /* @__PURE__ */ new Map();
  getNodesInside(nodeLookup, { x: 0, y: 0, width, height }, transform, true).forEach((node) => {
    visibleNodes.set(node.id, node);
  });
  return visibleNodes;
}
function getLayoutedEdges(options) {
  const { edges, defaultEdgeOptions, nodeLookup, previousEdges, connectionMode, onerror, onlyRenderVisible, elevateEdgesOnSelect, zIndexMode } = options;
  const layoutedEdges = /* @__PURE__ */ new Map();
  for (const edge of edges) {
    const sourceNode = nodeLookup.get(edge.source);
    const targetNode = nodeLookup.get(edge.target);
    if (!sourceNode || !targetNode) {
      continue;
    }
    if (onlyRenderVisible) {
      const { visibleNodes, transform, width, height } = options;
      if (isEdgeVisible({
        sourceNode,
        targetNode,
        width,
        height,
        transform
      })) {
        visibleNodes.set(sourceNode.id, sourceNode);
        visibleNodes.set(targetNode.id, targetNode);
      } else {
        continue;
      }
    }
    const previous = previousEdges.get(edge.id);
    if (previous && edge === previous.edge && sourceNode == previous.sourceNode && targetNode == previous.targetNode) {
      layoutedEdges.set(edge.id, previous);
      continue;
    }
    const edgePosition = getEdgePosition({
      id: edge.id,
      sourceNode,
      targetNode,
      sourceHandle: edge.sourceHandle || null,
      targetHandle: edge.targetHandle || null,
      connectionMode,
      onError: onerror
    });
    if (edgePosition) {
      layoutedEdges.set(edge.id, {
        ...defaultEdgeOptions,
        ...edge,
        ...edgePosition,
        zIndex: getElevatedEdgeZIndex({
          selected: edge.selected,
          zIndex: edge.zIndex ?? defaultEdgeOptions.zIndex,
          sourceNode,
          targetNode,
          elevateOnSelect: elevateEdgesOnSelect,
          zIndexMode
        }),
        sourceNode,
        targetNode,
        edge
      });
    }
  }
  return layoutedEdges;
}
const devWarn = createDevWarn("Svelte Flow", "https://svelteflow.dev/");
const initialNodeTypes = {
  input: InputNode,
  output: OutputNode,
  default: DefaultNode,
  group: GroupNode
};
const initialEdgeTypes = {
  straight: StraightEdgeInternal,
  smoothstep: SmoothStepEdgeInternal,
  default: BezierEdge,
  step: StepEdgeInternal
};
function getInitialViewport(_nodesInitialized, fitView, initialViewport, width, height, nodeLookup) {
  if (fitView && !initialViewport && width && height) {
    const bounds = getInternalNodesBounds(nodeLookup, {
      filter: (node) => !!((node.width || node.initialWidth) && (node.height || node.initialHeight))
    });
    return getViewportForBounds(bounds, width, height, 0.5, 2, 0.1);
  } else {
    return initialViewport ?? { x: 0, y: 0, zoom: 1 };
  }
}
function getInitialStore(signals) {
  class SvelteFlowStore {
    #flowId = derived(() => signals.props.id ?? "1");
    get flowId() {
      return this.#flowId();
    }
    set flowId($$value) {
      return this.#flowId($$value);
    }
    domNode = null;
    panZoom = null;
    width = signals.width ?? 0;
    height = signals.height ?? 0;
    zIndexMode = signals.props.zIndexMode ?? "basic";
    #nodesInitialized = derived(() => {
      const { nodesInitialized } = adoptUserNodes(signals.nodes, this.nodeLookup, this.parentLookup, {
        nodeExtent: this.nodeExtent,
        nodeOrigin: this.nodeOrigin,
        elevateNodesOnSelect: signals.props.elevateNodesOnSelect ?? true,
        checkEquality: true,
        zIndexMode: this.zIndexMode
      });
      if (this.fitViewQueued && nodesInitialized) {
        if (this.fitViewOptions?.duration) {
          this.resolveFitView();
        } else {
          queueMicrotask(() => {
            this.resolveFitView();
          });
        }
      }
      return nodesInitialized;
    });
    get nodesInitialized() {
      return this.#nodesInitialized();
    }
    set nodesInitialized($$value) {
      return this.#nodesInitialized($$value);
    }
    #viewportInitialized = derived(() => this.panZoom !== null);
    get viewportInitialized() {
      return this.#viewportInitialized();
    }
    set viewportInitialized($$value) {
      return this.#viewportInitialized($$value);
    }
    #_edges = derived(() => {
      updateConnectionLookup(this.connectionLookup, this.edgeLookup, signals.edges);
      return signals.edges;
    });
    get _edges() {
      return this.#_edges();
    }
    set _edges($$value) {
      return this.#_edges($$value);
    }
    get nodes() {
      this.nodesInitialized;
      return signals.nodes;
    }
    set nodes(nodes) {
      signals.nodes = nodes;
    }
    get edges() {
      return this._edges;
    }
    set edges(edges) {
      signals.edges = edges;
    }
    _prevSelectedNodes = [];
    _prevSelectedNodeIds = /* @__PURE__ */ new Set();
    #selectedNodes = derived(() => {
      const selectedNodesCount = this._prevSelectedNodeIds.size;
      const selectedNodeIds = /* @__PURE__ */ new Set();
      const selectedNodes = this.nodes.filter((node) => {
        if (node.selected) {
          selectedNodeIds.add(node.id);
          this._prevSelectedNodeIds.delete(node.id);
        }
        return node.selected;
      });
      if (selectedNodesCount !== selectedNodeIds.size || this._prevSelectedNodeIds.size > 0) {
        this._prevSelectedNodes = selectedNodes;
      }
      this._prevSelectedNodeIds = selectedNodeIds;
      return this._prevSelectedNodes;
    });
    get selectedNodes() {
      return this.#selectedNodes();
    }
    set selectedNodes($$value) {
      return this.#selectedNodes($$value);
    }
    _prevSelectedEdges = [];
    _prevSelectedEdgeIds = /* @__PURE__ */ new Set();
    #selectedEdges = derived(() => {
      const selectedEdgesCount = this._prevSelectedEdgeIds.size;
      const selectedEdgeIds = /* @__PURE__ */ new Set();
      const selectedEdges = this.edges.filter((edge) => {
        if (edge.selected) {
          selectedEdgeIds.add(edge.id);
          this._prevSelectedEdgeIds.delete(edge.id);
        }
        return edge.selected;
      });
      if (selectedEdgesCount !== selectedEdgeIds.size || this._prevSelectedEdgeIds.size > 0) {
        this._prevSelectedEdges = selectedEdges;
      }
      this._prevSelectedEdgeIds = selectedEdgeIds;
      return this._prevSelectedEdges;
    });
    get selectedEdges() {
      return this.#selectedEdges();
    }
    set selectedEdges($$value) {
      return this.#selectedEdges($$value);
    }
    selectionChangeHandlers = /* @__PURE__ */ new Map();
    nodeLookup = /* @__PURE__ */ new Map();
    parentLookup = /* @__PURE__ */ new Map();
    connectionLookup = /* @__PURE__ */ new Map();
    edgeLookup = /* @__PURE__ */ new Map();
    _prevVisibleEdges = /* @__PURE__ */ new Map();
    #visible = derived(() => {
      const {
        // We need to access this._nodes to trigger on changes
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        nodes,
        _edges: edges,
        _prevVisibleEdges: previousEdges,
        nodeLookup,
        connectionMode,
        onerror,
        onlyRenderVisibleElements,
        defaultEdgeOptions,
        zIndexMode
      } = this;
      let visibleNodes;
      let visibleEdges;
      const options = {
        edges,
        defaultEdgeOptions,
        previousEdges,
        nodeLookup,
        connectionMode,
        elevateEdgesOnSelect: signals.props.elevateEdgesOnSelect ?? true,
        zIndexMode,
        onerror
      };
      if (onlyRenderVisibleElements) {
        const { viewport, width, height } = this;
        const transform = [viewport.x, viewport.y, viewport.zoom];
        visibleNodes = getVisibleNodes(nodeLookup, transform, width, height);
        visibleEdges = getLayoutedEdges({
          ...options,
          onlyRenderVisible: true,
          visibleNodes,
          transform,
          width,
          height
        });
      } else {
        visibleNodes = this.nodeLookup;
        visibleEdges = getLayoutedEdges(options);
      }
      return { nodes: visibleNodes, edges: visibleEdges };
    });
    get visible() {
      return this.#visible();
    }
    set visible($$value) {
      return this.#visible($$value);
    }
    #nodesDraggable = derived(() => signals.props.nodesDraggable ?? true);
    get nodesDraggable() {
      return this.#nodesDraggable();
    }
    set nodesDraggable($$value) {
      return this.#nodesDraggable($$value);
    }
    #nodesConnectable = derived(() => signals.props.nodesConnectable ?? true);
    get nodesConnectable() {
      return this.#nodesConnectable();
    }
    set nodesConnectable($$value) {
      return this.#nodesConnectable($$value);
    }
    #elementsSelectable = derived(() => signals.props.elementsSelectable ?? true);
    get elementsSelectable() {
      return this.#elementsSelectable();
    }
    set elementsSelectable($$value) {
      return this.#elementsSelectable($$value);
    }
    #nodesFocusable = derived(() => signals.props.nodesFocusable ?? true);
    get nodesFocusable() {
      return this.#nodesFocusable();
    }
    set nodesFocusable($$value) {
      return this.#nodesFocusable($$value);
    }
    #edgesFocusable = derived(() => signals.props.edgesFocusable ?? true);
    get edgesFocusable() {
      return this.#edgesFocusable();
    }
    set edgesFocusable($$value) {
      return this.#edgesFocusable($$value);
    }
    #disableKeyboardA11y = derived(() => signals.props.disableKeyboardA11y ?? false);
    get disableKeyboardA11y() {
      return this.#disableKeyboardA11y();
    }
    set disableKeyboardA11y($$value) {
      return this.#disableKeyboardA11y($$value);
    }
    #minZoom = derived(() => signals.props.minZoom ?? 0.5);
    get minZoom() {
      return this.#minZoom();
    }
    set minZoom($$value) {
      return this.#minZoom($$value);
    }
    #maxZoom = derived(() => signals.props.maxZoom ?? 2);
    get maxZoom() {
      return this.#maxZoom();
    }
    set maxZoom($$value) {
      return this.#maxZoom($$value);
    }
    #nodeOrigin = derived(() => signals.props.nodeOrigin ?? [0, 0]);
    get nodeOrigin() {
      return this.#nodeOrigin();
    }
    set nodeOrigin($$value) {
      return this.#nodeOrigin($$value);
    }
    #nodeExtent = derived(() => signals.props.nodeExtent ?? infiniteExtent);
    get nodeExtent() {
      return this.#nodeExtent();
    }
    set nodeExtent($$value) {
      return this.#nodeExtent($$value);
    }
    #translateExtent = derived(() => signals.props.translateExtent ?? infiniteExtent);
    get translateExtent() {
      return this.#translateExtent();
    }
    set translateExtent($$value) {
      return this.#translateExtent($$value);
    }
    #defaultEdgeOptions = derived(() => signals.props.defaultEdgeOptions ?? {});
    get defaultEdgeOptions() {
      return this.#defaultEdgeOptions();
    }
    set defaultEdgeOptions($$value) {
      return this.#defaultEdgeOptions($$value);
    }
    #nodeDragThreshold = derived(() => signals.props.nodeDragThreshold ?? 1);
    get nodeDragThreshold() {
      return this.#nodeDragThreshold();
    }
    set nodeDragThreshold($$value) {
      return this.#nodeDragThreshold($$value);
    }
    #autoPanOnNodeDrag = derived(() => signals.props.autoPanOnNodeDrag ?? true);
    get autoPanOnNodeDrag() {
      return this.#autoPanOnNodeDrag();
    }
    set autoPanOnNodeDrag($$value) {
      return this.#autoPanOnNodeDrag($$value);
    }
    #autoPanOnConnect = derived(() => signals.props.autoPanOnConnect ?? true);
    get autoPanOnConnect() {
      return this.#autoPanOnConnect();
    }
    set autoPanOnConnect($$value) {
      return this.#autoPanOnConnect($$value);
    }
    #autoPanOnNodeFocus = derived(() => signals.props.autoPanOnNodeFocus ?? true);
    get autoPanOnNodeFocus() {
      return this.#autoPanOnNodeFocus();
    }
    set autoPanOnNodeFocus($$value) {
      return this.#autoPanOnNodeFocus($$value);
    }
    #autoPanSpeed = derived(() => signals.props.autoPanSpeed ?? 15);
    get autoPanSpeed() {
      return this.#autoPanSpeed();
    }
    set autoPanSpeed($$value) {
      return this.#autoPanSpeed($$value);
    }
    #connectionDragThreshold = derived(() => signals.props.connectionDragThreshold ?? 1);
    get connectionDragThreshold() {
      return this.#connectionDragThreshold();
    }
    set connectionDragThreshold($$value) {
      return this.#connectionDragThreshold($$value);
    }
    fitViewQueued = signals.props.fitView ?? false;
    fitViewOptions = signals.props.fitViewOptions;
    fitViewResolver = null;
    #snapGrid = derived(() => signals.props.snapGrid ?? null);
    get snapGrid() {
      return this.#snapGrid();
    }
    set snapGrid($$value) {
      return this.#snapGrid($$value);
    }
    dragging = false;
    selectionRect = null;
    selectionKeyPressed = false;
    multiselectionKeyPressed = false;
    deleteKeyPressed = false;
    panActivationKeyPressed = false;
    zoomActivationKeyPressed = false;
    selectionRectMode = null;
    ariaLiveMessage = "";
    #selectionMode = derived(() => signals.props.selectionMode ?? SelectionMode.Partial);
    get selectionMode() {
      return this.#selectionMode();
    }
    set selectionMode($$value) {
      return this.#selectionMode($$value);
    }
    #nodeTypes = derived(() => ({ ...initialNodeTypes, ...signals.props.nodeTypes }));
    get nodeTypes() {
      return this.#nodeTypes();
    }
    set nodeTypes($$value) {
      return this.#nodeTypes($$value);
    }
    #edgeTypes = derived(() => ({ ...initialEdgeTypes, ...signals.props.edgeTypes }));
    get edgeTypes() {
      return this.#edgeTypes();
    }
    set edgeTypes($$value) {
      return this.#edgeTypes($$value);
    }
    #noPanClass = derived(() => signals.props.noPanClass ?? "nopan");
    get noPanClass() {
      return this.#noPanClass();
    }
    set noPanClass($$value) {
      return this.#noPanClass($$value);
    }
    #noDragClass = derived(() => signals.props.noDragClass ?? "nodrag");
    get noDragClass() {
      return this.#noDragClass();
    }
    set noDragClass($$value) {
      return this.#noDragClass($$value);
    }
    #noWheelClass = derived(() => signals.props.noWheelClass ?? "nowheel");
    get noWheelClass() {
      return this.#noWheelClass();
    }
    set noWheelClass($$value) {
      return this.#noWheelClass($$value);
    }
    #ariaLabelConfig = derived(() => mergeAriaLabelConfig(signals.props.ariaLabelConfig));
    get ariaLabelConfig() {
      return this.#ariaLabelConfig();
    }
    set ariaLabelConfig($$value) {
      return this.#ariaLabelConfig($$value);
    }
    _viewport = getInitialViewport(this.nodesInitialized, signals.props.fitView, signals.props.initialViewport, this.width, this.height, this.nodeLookup);
    get viewport() {
      return signals.viewport ?? this._viewport;
    }
    set viewport(newViewport) {
      if (signals.viewport) {
        signals.viewport = newViewport;
      }
      this._viewport = newViewport;
    }
    // _connection is viewport independent and originating from XYHandle
    _connection = initialConnection;
    #connection = derived(
      // We derive a viewport dependent connection here
      () => {
        if (!this._connection.inProgress) {
          return this._connection;
        }
        return {
          ...this._connection,
          to: pointToRendererPoint(this._connection.to, [this.viewport.x, this.viewport.y, this.viewport.zoom])
        };
      }
    );
    get connection() {
      return this.#connection();
    }
    set connection($$value) {
      return this.#connection($$value);
    }
    #connectionMode = derived(() => signals.props.connectionMode ?? ConnectionMode.Strict);
    get connectionMode() {
      return this.#connectionMode();
    }
    set connectionMode($$value) {
      return this.#connectionMode($$value);
    }
    #connectionRadius = derived(() => signals.props.connectionRadius ?? 20);
    get connectionRadius() {
      return this.#connectionRadius();
    }
    set connectionRadius($$value) {
      return this.#connectionRadius($$value);
    }
    #isValidConnection = derived(() => signals.props.isValidConnection ?? (() => true));
    get isValidConnection() {
      return this.#isValidConnection();
    }
    set isValidConnection($$value) {
      return this.#isValidConnection($$value);
    }
    #selectNodesOnDrag = derived(() => signals.props.selectNodesOnDrag ?? true);
    get selectNodesOnDrag() {
      return this.#selectNodesOnDrag();
    }
    set selectNodesOnDrag($$value) {
      return this.#selectNodesOnDrag($$value);
    }
    #defaultMarkerColor = derived(() => signals.props.defaultMarkerColor === void 0 ? "#b1b1b7" : signals.props.defaultMarkerColor);
    get defaultMarkerColor() {
      return this.#defaultMarkerColor();
    }
    set defaultMarkerColor($$value) {
      return this.#defaultMarkerColor($$value);
    }
    #markers = derived(() => {
      return createMarkerIds(signals.edges, {
        defaultColor: this.defaultMarkerColor,
        id: this.flowId,
        defaultMarkerStart: this.defaultEdgeOptions.markerStart,
        defaultMarkerEnd: this.defaultEdgeOptions.markerEnd
      });
    });
    get markers() {
      return this.#markers();
    }
    set markers($$value) {
      return this.#markers($$value);
    }
    #onlyRenderVisibleElements = derived(() => signals.props.onlyRenderVisibleElements ?? false);
    get onlyRenderVisibleElements() {
      return this.#onlyRenderVisibleElements();
    }
    set onlyRenderVisibleElements($$value) {
      return this.#onlyRenderVisibleElements($$value);
    }
    #onerror = derived(() => signals.props.onflowerror ?? devWarn);
    get onerror() {
      return this.#onerror();
    }
    set onerror($$value) {
      return this.#onerror($$value);
    }
    #ondelete = derived(() => signals.props.ondelete);
    get ondelete() {
      return this.#ondelete();
    }
    set ondelete($$value) {
      return this.#ondelete($$value);
    }
    #onbeforedelete = derived(() => signals.props.onbeforedelete);
    get onbeforedelete() {
      return this.#onbeforedelete();
    }
    set onbeforedelete($$value) {
      return this.#onbeforedelete($$value);
    }
    #onbeforeconnect = derived(() => signals.props.onbeforeconnect);
    get onbeforeconnect() {
      return this.#onbeforeconnect();
    }
    set onbeforeconnect($$value) {
      return this.#onbeforeconnect($$value);
    }
    #onconnect = derived(() => signals.props.onconnect);
    get onconnect() {
      return this.#onconnect();
    }
    set onconnect($$value) {
      return this.#onconnect($$value);
    }
    #onconnectstart = derived(() => signals.props.onconnectstart);
    get onconnectstart() {
      return this.#onconnectstart();
    }
    set onconnectstart($$value) {
      return this.#onconnectstart($$value);
    }
    #onconnectend = derived(() => signals.props.onconnectend);
    get onconnectend() {
      return this.#onconnectend();
    }
    set onconnectend($$value) {
      return this.#onconnectend($$value);
    }
    #onbeforereconnect = derived(() => signals.props.onbeforereconnect);
    get onbeforereconnect() {
      return this.#onbeforereconnect();
    }
    set onbeforereconnect($$value) {
      return this.#onbeforereconnect($$value);
    }
    #onreconnect = derived(() => signals.props.onreconnect);
    get onreconnect() {
      return this.#onreconnect();
    }
    set onreconnect($$value) {
      return this.#onreconnect($$value);
    }
    #onreconnectstart = derived(() => signals.props.onreconnectstart);
    get onreconnectstart() {
      return this.#onreconnectstart();
    }
    set onreconnectstart($$value) {
      return this.#onreconnectstart($$value);
    }
    #onreconnectend = derived(() => signals.props.onreconnectend);
    get onreconnectend() {
      return this.#onreconnectend();
    }
    set onreconnectend($$value) {
      return this.#onreconnectend($$value);
    }
    #clickConnect = derived(() => signals.props.clickConnect ?? true);
    get clickConnect() {
      return this.#clickConnect();
    }
    set clickConnect($$value) {
      return this.#clickConnect($$value);
    }
    #onclickconnectstart = derived(() => signals.props.onclickconnectstart);
    get onclickconnectstart() {
      return this.#onclickconnectstart();
    }
    set onclickconnectstart($$value) {
      return this.#onclickconnectstart($$value);
    }
    #onclickconnectend = derived(() => signals.props.onclickconnectend);
    get onclickconnectend() {
      return this.#onclickconnectend();
    }
    set onclickconnectend($$value) {
      return this.#onclickconnectend($$value);
    }
    clickConnectStartHandle = null;
    #onselectiondrag = derived(() => signals.props.onselectiondrag);
    get onselectiondrag() {
      return this.#onselectiondrag();
    }
    set onselectiondrag($$value) {
      return this.#onselectiondrag($$value);
    }
    #onselectiondragstart = derived(() => signals.props.onselectiondragstart);
    get onselectiondragstart() {
      return this.#onselectiondragstart();
    }
    set onselectiondragstart($$value) {
      return this.#onselectiondragstart($$value);
    }
    #onselectiondragstop = derived(() => signals.props.onselectiondragstop);
    get onselectiondragstop() {
      return this.#onselectiondragstop();
    }
    set onselectiondragstop($$value) {
      return this.#onselectiondragstop($$value);
    }
    resolveFitView = async () => {
      if (!this.panZoom) {
        return;
      }
      await fitViewport(
        {
          nodes: this.nodeLookup,
          width: this.width,
          height: this.height,
          panZoom: this.panZoom,
          minZoom: this.minZoom,
          maxZoom: this.maxZoom
        },
        this.fitViewOptions
      );
      this.fitViewResolver?.resolve(true);
      this.fitViewQueued = false;
      this.fitViewOptions = void 0;
      this.fitViewResolver = null;
    };
    _prefersDark = new MediaQuery("(prefers-color-scheme: dark)", signals.props.colorModeSSR === "dark");
    #colorMode = derived(() => signals.props.colorMode === "system" ? this._prefersDark.current ? "dark" : "light" : signals.props.colorMode ?? "light");
    get colorMode() {
      return this.#colorMode();
    }
    set colorMode($$value) {
      return this.#colorMode($$value);
    }
    constructor() {
      if (process.env.NODE_ENV === "development") {
        warnIfDeeplyReactive(signals.nodes, "nodes");
        warnIfDeeplyReactive(signals.edges, "edges");
      }
    }
    resetStoreValues() {
      this.dragging = false;
      this.selectionRect = null;
      this.selectionRectMode = null;
      this.selectionKeyPressed = false;
      this.multiselectionKeyPressed = false;
      this.deleteKeyPressed = false;
      this.panActivationKeyPressed = false;
      this.zoomActivationKeyPressed = false;
      this._connection = initialConnection;
      this.clickConnectStartHandle = null;
      this.viewport = signals.props.initialViewport ?? { x: 0, y: 0, zoom: 1 };
      this.ariaLiveMessage = "";
    }
  }
  return new SvelteFlowStore();
}
function warnIfDeeplyReactive(array, name) {
  try {
    if (array && array.length > 0) {
      structuredClone(array[0]);
    }
  } catch {
    console.warn(`Use $state.raw for ${name} to prevent performance issues.`);
  }
}
const providerErrorMessage = errorMessages["error001"]("svelte");
function useStore() {
  const storeContext = getContext(key);
  if (!storeContext) {
    throw new Error(providerErrorMessage);
  }
  return storeContext.getStore();
}
const key = Symbol();
function createStore(signals) {
  const store = getInitialStore(signals);
  function setNodeTypes(nodeTypes) {
    store.nodeTypes = {
      ...initialNodeTypes,
      ...nodeTypes
    };
  }
  function setEdgeTypes(edgeTypes) {
    store.edgeTypes = {
      ...initialEdgeTypes,
      ...edgeTypes
    };
  }
  function addEdge$12(edgeParams) {
    store.edges = addEdge(edgeParams, store.edges, { onError: store.onerror });
  }
  const updateNodePositions = (nodeDragItems, dragging = false) => {
    store.nodes = store.nodes.map((node) => {
      if (store.connection.inProgress && store.connection.fromNode.id === node.id) {
        const internalNode = store.nodeLookup.get(node.id);
        if (internalNode) {
          store.connection = {
            ...store.connection,
            from: getHandlePosition(internalNode, store.connection.fromHandle, Position.Left, true)
          };
        }
      }
      const dragItem = nodeDragItems.get(node.id);
      return dragItem ? { ...node, position: dragItem.position, dragging } : node;
    });
  };
  function updateNodeInternals$1(updates) {
    const { changes, updatedInternals } = updateNodeInternals(updates, store.nodeLookup, store.parentLookup, store.domNode, store.nodeOrigin, store.nodeExtent, store.zIndexMode);
    if (!updatedInternals) {
      return;
    }
    updateAbsolutePositions(store.nodeLookup, store.parentLookup, {
      nodeOrigin: store.nodeOrigin,
      nodeExtent: store.nodeExtent,
      zIndexMode: store.zIndexMode
    });
    if (store.fitViewQueued) {
      store.resolveFitView();
    }
    const newNodes = /* @__PURE__ */ new Map();
    for (const change of changes) {
      const userNode = store.nodeLookup.get(change.id)?.internals.userNode;
      if (!userNode) {
        continue;
      }
      const node = { ...userNode };
      switch (change.type) {
        case "dimensions": {
          const measured = { ...node.measured, ...change.dimensions };
          if (change.setAttributes) {
            node.width = change.dimensions?.width ?? node.width;
            node.height = change.dimensions?.height ?? node.height;
          }
          node.measured = measured;
          break;
        }
        case "position":
          node.position = change.position ?? node.position;
          break;
      }
      newNodes.set(change.id, node);
    }
    store.nodes = store.nodes.map((node) => newNodes.get(node.id) ?? node);
  }
  function fitView(options) {
    const fitViewResolver = store.fitViewResolver ?? Promise.withResolvers();
    store.fitViewQueued = true;
    store.fitViewOptions = options;
    store.fitViewResolver = fitViewResolver;
    store.nodes = [...store.nodes];
    return fitViewResolver.promise;
  }
  async function setCenter(x, y, options) {
    const nextZoom = typeof options?.zoom !== "undefined" ? options.zoom : store.maxZoom;
    const currentPanZoom = store.panZoom;
    if (!currentPanZoom) {
      return false;
    }
    await currentPanZoom.setViewport({
      x: store.width / 2 - x * nextZoom,
      y: store.height / 2 - y * nextZoom,
      zoom: nextZoom
    }, { duration: options?.duration, ease: options?.ease, interpolate: options?.interpolate });
    return true;
  }
  async function zoomBy(factor, options) {
    const panZoom = store.panZoom;
    if (!panZoom) {
      return false;
    }
    return panZoom.scaleBy(factor, options);
  }
  async function zoomIn(options) {
    return zoomBy(1.2, options);
  }
  function zoomOut(options) {
    return zoomBy(1 / 1.2, options);
  }
  function setMinZoom(minZoom) {
    const panZoom = store.panZoom;
    if (panZoom) {
      panZoom.setScaleExtent([minZoom, store.maxZoom]);
      store.minZoom = minZoom;
    }
  }
  function setMaxZoom(maxZoom) {
    const panZoom = store.panZoom;
    if (panZoom) {
      panZoom.setScaleExtent([store.minZoom, maxZoom]);
      store.maxZoom = maxZoom;
    }
  }
  function setTranslateExtent(extent) {
    const panZoom = store.panZoom;
    if (panZoom) {
      panZoom.setTranslateExtent(extent);
      store.translateExtent = extent;
    }
  }
  function deselect(elements, elementsToDeselect = null) {
    let deselected = false;
    const newElements = elements.map((element) => {
      const shouldDeselect = elementsToDeselect ? elementsToDeselect.has(element.id) : true;
      if (shouldDeselect && element.selected) {
        deselected = true;
        return { ...element, selected: false };
      }
      return element;
    });
    return [deselected, newElements];
  }
  function unselectNodesAndEdges(params) {
    const nodesToDeselect = params?.nodes ? new Set(params.nodes.map((node) => node.id)) : null;
    const [nodesDeselected, newNodes] = deselect(store.nodes, nodesToDeselect);
    if (nodesDeselected) {
      store.nodes = newNodes;
    }
    const edgesToDeselect = params?.edges ? new Set(params.edges.map((node) => node.id)) : null;
    const [edgesDeselected, newEdges] = deselect(store.edges, edgesToDeselect);
    if (edgesDeselected) {
      store.edges = newEdges;
    }
  }
  function addSelectedNodes(ids) {
    const isMultiSelection = store.multiselectionKeyPressed;
    store.nodes = store.nodes.map((node) => {
      const nodeWillBeSelected = ids.includes(node.id);
      const selected = isMultiSelection ? node.selected || nodeWillBeSelected : nodeWillBeSelected;
      if (!!node.selected !== selected) {
        return { ...node, selected };
      }
      return node;
    });
    if (!isMultiSelection) {
      unselectNodesAndEdges({ nodes: [] });
    }
  }
  function addSelectedEdges(ids) {
    const isMultiSelection = store.multiselectionKeyPressed;
    store.edges = store.edges.map((edge) => {
      const edgeWillBeSelected = ids.includes(edge.id);
      const selected = isMultiSelection ? edge.selected || edgeWillBeSelected : edgeWillBeSelected;
      if (!!edge.selected !== selected) {
        return { ...edge, selected };
      }
      return edge;
    });
    if (!isMultiSelection) {
      unselectNodesAndEdges({ edges: [] });
    }
  }
  function handleNodeSelection(id, unselect, nodeRef) {
    const node = store.nodeLookup.get(id);
    if (!node) {
      store.onerror("012", errorMessages["error012"](id));
      return;
    }
    store.selectionRect = null;
    store.selectionRectMode = null;
    if (!node.selected) {
      addSelectedNodes([id]);
    } else if (unselect || node.selected && store.multiselectionKeyPressed) {
      unselectNodesAndEdges({ nodes: [node.internals.userNode], edges: [] });
      requestAnimationFrame(() => nodeRef?.blur());
    }
  }
  function handleEdgeSelection(id) {
    const edge = store.edgeLookup.get(id);
    if (!edge) {
      store.onerror("016", errorMessages["error016"](id));
      return;
    }
    const selectable = edge.selectable || store.elementsSelectable && typeof edge.selectable === "undefined";
    if (selectable) {
      store.selectionRect = null;
      store.selectionRectMode = null;
      if (!edge.selected) {
        addSelectedEdges([id]);
      } else if (edge.selected && store.multiselectionKeyPressed) {
        unselectNodesAndEdges({ nodes: [], edges: [edge] });
      }
    }
  }
  function moveSelectedNodes(direction, factor) {
    const { nodeExtent, snapGrid, nodeOrigin, nodeLookup, nodesDraggable, onerror } = store;
    const nodeUpdates = /* @__PURE__ */ new Map();
    const xVelo = snapGrid?.[0] ?? 5;
    const yVelo = snapGrid?.[1] ?? 5;
    const xDiff = direction.x * xVelo * factor;
    const yDiff = direction.y * yVelo * factor;
    for (const node of nodeLookup.values()) {
      const isSelected = node.selected && (node.draggable || nodesDraggable && typeof node.draggable === "undefined");
      if (!isSelected) {
        continue;
      }
      let nextPosition = {
        x: node.internals.positionAbsolute.x + xDiff,
        y: node.internals.positionAbsolute.y + yDiff
      };
      if (snapGrid) {
        nextPosition = snapPosition(nextPosition, snapGrid);
      }
      const { position, positionAbsolute } = calculateNodePosition({
        nodeId: node.id,
        nextPosition,
        nodeLookup,
        nodeExtent,
        nodeOrigin,
        onError: onerror
      });
      node.position = position;
      node.internals.positionAbsolute = positionAbsolute;
      nodeUpdates.set(node.id, node);
    }
    updateNodePositions(nodeUpdates);
  }
  function panBy$1(delta) {
    return panBy({
      delta,
      panZoom: store.panZoom,
      transform: [store.viewport.x, store.viewport.y, store.viewport.zoom],
      translateExtent: store.translateExtent,
      width: store.width,
      height: store.height
    });
  }
  const updateConnection = (newConnection) => {
    store._connection = { ...newConnection };
  };
  function cancelConnection() {
    store._connection = initialConnection;
  }
  function reset() {
    store.resetStoreValues();
    unselectNodesAndEdges();
  }
  const storeWithActions = Object.assign(store, {
    setNodeTypes,
    setEdgeTypes,
    addEdge: addEdge$12,
    updateNodePositions,
    updateNodeInternals: updateNodeInternals$1,
    zoomIn,
    zoomOut,
    fitView,
    setCenter,
    setMinZoom,
    setMaxZoom,
    setTranslateExtent,
    unselectNodesAndEdges,
    addSelectedNodes,
    addSelectedEdges,
    handleNodeSelection,
    handleEdgeSelection,
    moveSelectedNodes,
    panBy: panBy$1,
    updateConnection,
    cancelConnection,
    reset
  });
  return storeWithActions;
}
function Zoom($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      store = void 0,
      panOnScrollMode,
      preventScrolling,
      zoomOnScroll,
      zoomOnDoubleClick,
      zoomOnPinch,
      panOnDrag,
      panOnScroll,
      panOnScrollSpeed,
      paneClickDistance,
      selectionOnDrag,
      onmovestart,
      onmove,
      onmoveend,
      oninit,
      children
    } = $$props;
    const { viewport: initialViewport } = store;
    $$renderer2.push(`<div class="svelte-flow__zoom svelte-flow__container">`);
    children($$renderer2);
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { store });
  });
}
function Pane($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      store = void 0,
      panOnDrag = true,
      paneClickDistance = 1,
      selectionOnDrag,
      autoPanOnSelection = true,
      onpaneclick,
      onpanecontextmenu,
      onselectionstart,
      onselectionend,
      children
    } = $$props;
    let panOnDragActive = derived(() => store.panActivationKeyPressed || panOnDrag);
    let isSelecting = derived(() => store.selectionKeyPressed || !!store.selectionRect || selectionOnDrag && panOnDragActive() !== true);
    let autoPanId = 0;
    function cleanupAutoPan() {
      cancelAnimationFrame(autoPanId);
      autoPanId = 0;
    }
    onDestroy(() => {
      if (typeof window !== "undefined") {
        cleanupAutoPan();
      }
    });
    $$renderer2.push(`<div${attr_class("svelte-flow__pane svelte-flow__container", void 0, {
      "draggable": panOnDrag === true || Array.isArray(panOnDrag) && panOnDrag.includes(0),
      "dragging": store.dragging,
      "selection": isSelecting()
    })}>`);
    children($$renderer2);
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { store });
  });
}
function Viewport($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { store = void 0, children } = $$props;
    $$renderer2.push(`<div class="svelte-flow__viewport xyflow__viewport svelte-flow__container"${attr_style("", {
      transform: `translate(${stringify(store.viewport.x)}px, ${stringify(store.viewport.y)}px) scale(${stringify(store.viewport.zoom)})`
    })}>`);
    children($$renderer2);
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { store });
  });
}
function A11yDescriptions($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { store } = $$props;
    $$renderer2.push(`<div${attr("id", `${ARIA_NODE_DESC_KEY}-${store.flowId}`)} class="a11y-hidden svelte-13pq11u">${escape_html(store.disableKeyboardA11y ? store.ariaLabelConfig["node.a11yDescription.default"] : store.ariaLabelConfig["node.a11yDescription.keyboardDisabled"])}</div> <div${attr("id", `${ARIA_EDGE_DESC_KEY}-${store.flowId}`)} class="a11y-hidden svelte-13pq11u">${escape_html(store.ariaLabelConfig["edge.a11yDescription.default"])}</div> `);
    if (!store.disableKeyboardA11y) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div${attr("id", `${ARIA_LIVE_MESSAGE}-${store.flowId}`)} aria-live="assertive" aria-atomic="true" class="a11y-live-msg svelte-13pq11u">${escape_html(store.ariaLiveMessage)}</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
const ARIA_NODE_DESC_KEY = "svelte-flow__node-desc";
const ARIA_EDGE_DESC_KEY = "svelte-flow__edge-desc";
const ARIA_LIVE_MESSAGE = "svelte-flow__aria-live";
function NodeWrapper($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      store = void 0,
      node,
      resizeObserver,
      nodeClickDistance,
      onnodeclick,
      onnodedrag,
      onnodedragstart,
      onnodedragstop,
      onnodepointerenter,
      onnodepointerleave,
      onnodepointermove,
      onnodecontextmenu
    } = $$props;
    let data = derived(() => fallback(node.data, () => ({}), true)), selected = derived(() => fallback(node.selected, false)), _draggable = derived(() => node.draggable), _selectable = derived(() => node.selectable), deletable = derived(() => fallback(node.deletable, true)), _connectable = derived(() => node.connectable), _focusable = derived(() => node.focusable), hidden = derived(() => fallback(node.hidden, false)), dragging = derived(() => fallback(node.dragging, false)), style = derived(() => fallback(node.style, "")), className = derived(() => node.class), type = derived(() => fallback(node.type, "default")), parentId = derived(() => node.parentId), sourcePosition = derived(() => node.sourcePosition), targetPosition = derived(() => node.targetPosition), measuredWidth = derived(() => fallback(node.measured, () => ({ width: 0, height: 0 }), true).width), measuredHeight = derived(() => fallback(node.measured, () => ({ width: 0, height: 0 }), true).height), initialWidth = derived(() => node.initialWidth), initialHeight = derived(() => node.initialHeight), width = derived(() => node.width), height = derived(() => node.height), dragHandle = derived(() => node.dragHandle), zIndex = derived(() => fallback(node.internals.z, 0)), positionX = derived(() => node.internals.positionAbsolute.x), positionY = derived(() => node.internals.positionAbsolute.y);
    let { id } = node;
    let draggable = derived(() => _draggable() ?? store.nodesDraggable);
    let selectable = derived(() => _selectable() ?? store.elementsSelectable);
    let connectable = derived(() => _connectable() ?? store.nodesConnectable);
    let hasDimensions = derived(() => nodeHasDimensions(node));
    let focusable = derived(() => _focusable() ?? store.nodesFocusable);
    function isInParentLookup(id2) {
      return store.parentLookup.has(id2);
    }
    let isParent = derived(() => isInParentLookup(id));
    type();
    sourcePosition();
    targetPosition();
    let NodeComponent = derived(() => store.nodeTypes[type()] ?? DefaultNode);
    let connectableContext = {
      get value() {
        return connectable();
      }
    };
    setNodeIdContext(id);
    setNodeConnectableContext(connectableContext);
    if (process.env.NODE_ENV === "development") ;
    let nodeStyle = derived(() => {
      const w = measuredWidth() === void 0 ? width() ?? initialWidth() : width();
      const h = measuredHeight() === void 0 ? height() ?? initialHeight() : height();
      if (w === void 0 && h === void 0 && style() === void 0) {
        return void 0;
      }
      return `${style()};${w ? `width:${toPxString(w)};` : ""}${h ? `height:${toPxString(h)};` : ""}`;
    });
    onDestroy(() => {
    });
    if (!hidden()) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div${attributes(
        {
          "data-id": id,
          class: clsx([
            "svelte-flow__node",
            `svelte-flow__node-${type()}`,
            className()
          ]),
          style: nodeStyle(),
          tabindex: focusable() ? 0 : void 0,
          role: node.ariaRole ?? (focusable() ? "group" : void 0),
          "aria-label": node.ariaLabel,
          "aria-roledescription": "node",
          "aria-describedby": store.disableKeyboardA11y ? void 0 : `${ARIA_NODE_DESC_KEY}-${store.flowId}`,
          ...node.domAttributes
        },
        void 0,
        {
          dragging,
          selected,
          draggable,
          connectable,
          selectable,
          nopan: draggable(),
          parent: isParent()
        },
        {
          "z-index": zIndex(),
          transform: `translate(${stringify(positionX())}px, ${stringify(positionY())}px)`,
          visibility: hasDimensions() ? "visible" : "hidden"
        }
      )}>`);
      if (NodeComponent()) {
        $$renderer2.push("<!--[-->");
        NodeComponent()($$renderer2, {
          data: data(),
          id,
          selected: selected(),
          selectable: selectable(),
          deletable: deletable(),
          sourcePosition: sourcePosition(),
          targetPosition: targetPosition(),
          zIndex: zIndex(),
          dragging: dragging(),
          draggable: draggable(),
          dragHandle: dragHandle(),
          parentId: parentId(),
          type: type(),
          isConnectable: connectable(),
          positionAbsoluteX: positionX(),
          positionAbsoluteY: positionY(),
          width: width(),
          height: height()
        });
        $$renderer2.push("<!--]-->");
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push("<!--]-->");
      }
      $$renderer2.push(`</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { store });
  });
}
function NodeRenderer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      store = void 0,
      nodeClickDistance,
      onnodeclick,
      onnodecontextmenu,
      onnodepointerenter,
      onnodepointermove,
      onnodepointerleave,
      onnodedrag,
      onnodedragstart,
      onnodedragstop
    } = $$props;
    const resizeObserver = typeof ResizeObserver === "undefined" ? null : new ResizeObserver((entries) => {
      const updates = /* @__PURE__ */ new Map();
      entries.forEach((entry) => {
        const id = entry.target.getAttribute("data-id");
        updates.set(id, { id, nodeElement: entry.target, force: true });
      });
      store.updateNodeInternals(updates);
    });
    onDestroy(() => {
      resizeObserver?.disconnect();
    });
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="svelte-flow__nodes"><!--[-->`);
      const each_array = ensure_array_like(store.visible.nodes.values());
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let node = each_array[$$index];
        NodeWrapper($$renderer3, {
          node,
          resizeObserver,
          nodeClickDistance,
          onnodeclick,
          onnodepointerenter,
          onnodepointermove,
          onnodepointerleave,
          onnodedrag,
          onnodedragstart,
          onnodedragstop,
          onnodecontextmenu,
          get store() {
            return store;
          },
          set store($$value) {
            store = $$value;
            $$settled = false;
          }
        });
      }
      $$renderer3.push(`<!--]--></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { store });
  });
}
function EdgeWrapper($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const {
      edge,
      store = void 0,
      onedgeclick,
      onedgecontextmenu,
      onedgepointerenter,
      onedgepointerleave
    } = $$props;
    let id = derived(() => edge.id), source = derived(() => edge.source), target = derived(() => edge.target), sourceX = derived(() => edge.sourceX), sourceY = derived(() => edge.sourceY), targetX = derived(() => edge.targetX), targetY = derived(() => edge.targetY), sourcePosition = derived(() => edge.sourcePosition), targetPosition = derived(() => edge.targetPosition), animated = derived(() => fallback(edge.animated, false)), selected = derived(() => fallback(edge.selected, false)), label = derived(() => edge.label), labelStyle = derived(() => edge.labelStyle), data = derived(() => fallback(edge.data, () => ({}), true)), style = derived(() => edge.style), interactionWidth = derived(() => edge.interactionWidth), type = derived(() => fallback(edge.type, "default")), sourceHandle = derived(() => edge.sourceHandle), targetHandle = derived(() => edge.targetHandle), markerStart = derived(() => edge.markerStart), markerEnd = derived(() => edge.markerEnd), _selectable = derived(() => edge.selectable), _focusable = derived(() => edge.focusable), deletable = derived(() => fallback(edge.deletable, true)), hidden = derived(() => edge.hidden), zIndex = derived(() => edge.zIndex), className = derived(() => edge.class), ariaLabel = derived(() => edge.ariaLabel);
    setEdgeIdContext(id());
    let selectable = derived(() => _selectable() ?? store.elementsSelectable);
    let focusable = derived(() => _focusable() ?? store.edgesFocusable);
    let EdgeComponent = derived(() => store.edgeTypes[type()] ?? BezierEdge);
    let markerStartUrl = derived(() => markerStart() ? `url('#${getMarkerId(markerStart(), store.flowId)}')` : void 0);
    let markerEndUrl = derived(() => markerEnd() ? `url('#${getMarkerId(markerEnd(), store.flowId)}')` : void 0);
    if (!hidden()) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<svg class="svelte-flow__edge-wrapper"${attr_style("", { "z-index": zIndex() })}><g${attributes(
        {
          class: clsx(["svelte-flow__edge", className()]),
          "data-id": id(),
          "aria-label": ariaLabel() === null ? void 0 : ariaLabel() ? ariaLabel() : `Edge from ${source()} to ${target()}`,
          "aria-describedby": focusable() ? `${ARIA_EDGE_DESC_KEY}-${store.flowId}` : void 0,
          role: edge.ariaRole ?? (focusable() ? "group" : "img"),
          "aria-roledescription": "edge",
          tabindex: focusable() ? 0 : void 0,
          ...edge.domAttributes
        },
        void 0,
        { animated, selected, selectable },
        void 0,
        3
      )}>`);
      if (EdgeComponent()) {
        $$renderer2.push("<!--[-->");
        EdgeComponent()($$renderer2, {
          id: id(),
          source: source(),
          target: target(),
          sourceX: sourceX(),
          sourceY: sourceY(),
          targetX: targetX(),
          targetY: targetY(),
          sourcePosition: sourcePosition(),
          targetPosition: targetPosition(),
          animated: animated(),
          selected: selected(),
          label: label(),
          labelStyle: labelStyle(),
          data: data(),
          style: style(),
          interactionWidth: interactionWidth(),
          selectable: selectable(),
          deletable: deletable(),
          type: type(),
          sourceHandleId: sourceHandle(),
          targetHandleId: targetHandle(),
          markerStart: markerStartUrl(),
          markerEnd: markerEndUrl()
        });
        $$renderer2.push("<!--]-->");
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push("<!--]-->");
      }
      $$renderer2.push(`</g></svg>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { store });
  });
}
function MarkerDefinition($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const store = useStore();
    $$renderer2.push(`<defs><!--[-->`);
    const each_array = ensure_array_like(store.markers);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let marker = each_array[$$index];
      Marker($$renderer2, spread_props([marker]));
    }
    $$renderer2.push(`<!--]--></defs>`);
  });
}
function Marker($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      id,
      type,
      width = 12.5,
      height = 12.5,
      markerUnits = "strokeWidth",
      orient = "auto-start-reverse",
      color = "none",
      strokeWidth
    } = $$props;
    $$renderer2.push(`<marker class="svelte-flow__arrowhead"${attr("id", id)}${attr("markerWidth", `${width}`)}${attr("markerHeight", `${height}`)} viewBox="-10 -10 20 20"${attr("markerUnits", markerUnits)}${attr("orient", orient)} refX="0" refY="0">`);
    if (type === MarkerType.Arrow) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<polyline class="arrow" fill="none" stroke-linecap="round" stroke-linejoin="round"${attr("stroke-width", strokeWidth)} points="-5,-4 0,0 -5,4"${attr_style("", { stroke: color })}></polyline>`);
    } else if (type === MarkerType.ArrowClosed) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<polyline class="arrowclosed" stroke-linecap="round" stroke-linejoin="round"${attr("stroke-width", strokeWidth)} points="-5,-4 0,0 -5,4 -5,-4"${attr_style("", { stroke: color, fill: color })}></polyline>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></marker>`);
  });
}
function EdgeRenderer($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      store = void 0,
      onedgeclick,
      onedgecontextmenu,
      onedgepointerenter,
      onedgepointerleave
    } = $$props;
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="svelte-flow__edges"><svg class="svelte-flow__marker">`);
      MarkerDefinition($$renderer3);
      $$renderer3.push(`<!----></svg> <!--[-->`);
      const each_array = ensure_array_like(store.visible.edges.values());
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let edge = each_array[$$index];
        EdgeWrapper($$renderer3, {
          edge,
          onedgeclick,
          onedgecontextmenu,
          onedgepointerenter,
          onedgepointerleave,
          get store() {
            return store;
          },
          set store($$value) {
            store = $$value;
            $$settled = false;
          }
        });
      }
      $$renderer3.push(`<!--]--></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { store });
  });
}
function Selection($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { x = 0, y = 0, width = 0, height = 0, isVisible = true } = $$props;
    if (isVisible) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="svelte-flow__selection svelte-1vr3gfi"${attr_style("", {
        width: typeof width === "string" ? width : toPxString(width),
        height: typeof height === "string" ? height : toPxString(height),
        transform: `translate(${x}px, ${y}px)`
      })}></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function NodeSelection($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      store = void 0,
      onnodedrag,
      onnodedragstart,
      onnodedragstop,
      onselectionclick,
      onselectioncontextmenu
    } = $$props;
    let bounds = derived(() => {
      if (store.selectionRectMode === "nodes") {
        store.nodes;
        const nodeBounds = getInternalNodesBounds(store.nodeLookup, { filter: (node) => !!node.selected });
        if (nodeBounds.width > 0 && nodeBounds.height > 0) {
          return nodeBounds;
        }
      }
      return null;
    });
    if (store.selectionRectMode === "nodes" && bounds() && isNumeric(bounds().x) && isNumeric(bounds().y)) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div${attr_class(clsx(["svelte-flow__selection-wrapper", store.noPanClass]), "svelte-sf2y5e")}${attr("role", store.disableKeyboardA11y ? void 0 : "button")}${attr("tabindex", store.disableKeyboardA11y ? void 0 : -1)}${attr_style("", {
        width: toPxString(bounds().width),
        height: toPxString(bounds().height),
        transform: `translate(${stringify(bounds().x)}px, ${stringify(bounds().y)}px)`
      })}>`);
      Selection($$renderer2, { width: "100%", height: "100%", x: 0, y: 0 });
      $$renderer2.push(`<!----></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { store });
  });
}
function useSvelteFlow() {
  const store = derived(useStore);
  const getNodeRect = (node) => {
    const nodeToUse = isNode(node) ? node : store().nodeLookup.get(node.id);
    const position = nodeToUse.parentId ? evaluateAbsolutePosition(nodeToUse.position, nodeToUse.measured, nodeToUse.parentId, store().nodeLookup, store().nodeOrigin) : nodeToUse.position;
    const nodeWithPosition = {
      ...nodeToUse,
      position,
      width: nodeToUse.measured?.width ?? nodeToUse.width,
      height: nodeToUse.measured?.height ?? nodeToUse.height
    };
    return nodeToRect(nodeWithPosition);
  };
  function updateNode(id, nodeUpdate, options = { replace: false }) {
    store().nodes = run(() => store().nodes).map((node) => {
      if (node.id === id) {
        const nextNode = typeof nodeUpdate === "function" ? nodeUpdate(node) : nodeUpdate;
        return options?.replace && isNode(nextNode) ? nextNode : { ...node, ...nextNode };
      }
      return node;
    });
  }
  function updateEdge(id, edgeUpdate, options = { replace: false }) {
    store().edges = run(() => store().edges).map((edge) => {
      if (edge.id === id) {
        const nextEdge = typeof edgeUpdate === "function" ? edgeUpdate(edge) : edgeUpdate;
        return options.replace && isEdge(nextEdge) ? nextEdge : { ...edge, ...nextEdge };
      }
      return edge;
    });
  }
  const getInternalNode = (id) => store().nodeLookup.get(id);
  return {
    zoomIn: store().zoomIn,
    zoomOut: store().zoomOut,
    getInternalNode,
    getNode: (id) => getInternalNode(id)?.internals.userNode,
    getNodes: (ids) => ids === void 0 ? store().nodes : getElements(store().nodeLookup, ids),
    getEdge: (id) => store().edgeLookup.get(id),
    getEdges: (ids) => ids === void 0 ? store().edges : getElements(store().edgeLookup, ids),
    setZoom: async (zoomLevel, options) => {
      const panZoom = store().panZoom;
      return panZoom ? panZoom.scaleTo(zoomLevel, options) : false;
    },
    getZoom: () => store().viewport.zoom,
    setViewport: async (nextViewport, options) => {
      const currentViewport = store().viewport;
      if (!store().panZoom) {
        return false;
      }
      await store().panZoom.setViewport(
        {
          x: nextViewport.x ?? currentViewport.x,
          y: nextViewport.y ?? currentViewport.y,
          zoom: nextViewport.zoom ?? currentViewport.zoom
        },
        options
      );
      return true;
    },
    getViewport: () => snapshot(store().viewport),
    setCenter: async (x, y, options) => store().setCenter(x, y, options),
    fitView: (options) => store().fitView(options),
    fitBounds: async (bounds, options) => {
      if (!store().panZoom) {
        return false;
      }
      const viewport = getViewportForBounds(bounds, store().width, store().height, store().minZoom, store().maxZoom, options?.padding ?? 0.1);
      await store().panZoom.setViewport(viewport, {
        duration: options?.duration,
        ease: options?.ease,
        interpolate: options?.interpolate
      });
      return true;
    },
    /**
     * Partial is defined as "the 2 nodes/areas are intersecting partially".
     * If a is contained in b or b is contained in a, they are both
     * considered fully intersecting.
     */
    getIntersectingNodes: (nodeOrRect, partially = true, nodesToIntersect) => {
      const isRect = isRectObject(nodeOrRect);
      const nodeRect = isRect ? nodeOrRect : getNodeRect(nodeOrRect);
      if (!nodeRect) {
        return [];
      }
      return (nodesToIntersect || store().nodes).filter((n) => {
        const internalNode = store().nodeLookup.get(n.id);
        if (!internalNode || !isRect && n.id === nodeOrRect.id) {
          return false;
        }
        const currNodeRect = nodeToRect(internalNode);
        const overlappingArea = getOverlappingArea(currNodeRect, nodeRect);
        const partiallyVisible = partially && overlappingArea > 0;
        return partiallyVisible || overlappingArea >= currNodeRect.width * currNodeRect.height || overlappingArea >= nodeRect.width * nodeRect.height;
      });
    },
    isNodeIntersecting: (nodeOrRect, area, partially = true) => {
      const isRect = isRectObject(nodeOrRect);
      const nodeRect = isRect ? nodeOrRect : getNodeRect(nodeOrRect);
      if (!nodeRect) {
        return false;
      }
      const overlappingArea = getOverlappingArea(nodeRect, area);
      const partiallyVisible = partially && overlappingArea > 0;
      return partiallyVisible || overlappingArea >= area.width * area.height || overlappingArea >= nodeRect.width * nodeRect.height;
    },
    deleteElements: async ({ nodes: nodesToRemove = [], edges: edgesToRemove = [] }) => {
      const { nodes: matchingNodes, edges: matchingEdges } = await getElementsToRemove({
        nodesToRemove,
        edgesToRemove,
        nodes: store().nodes,
        edges: store().edges,
        onBeforeDelete: store().onbeforedelete
      });
      if (matchingNodes) {
        store().nodes = run(() => store().nodes).filter((node) => !matchingNodes.some(({ id }) => id === node.id));
      }
      if (matchingEdges) {
        store().edges = run(() => store().edges).filter((edge) => !matchingEdges.some(({ id }) => id === edge.id));
      }
      if (matchingNodes.length > 0 || matchingEdges.length > 0) {
        store().ondelete?.({ nodes: matchingNodes, edges: matchingEdges });
      }
      return { deletedNodes: matchingNodes, deletedEdges: matchingEdges };
    },
    screenToFlowPosition: (position, options = { snapToGrid: true }) => {
      if (!store().domNode) {
        return position;
      }
      const _snapGrid = options.snapToGrid ? store().snapGrid : false;
      const { x, y, zoom } = store().viewport;
      const { x: domX, y: domY } = store().domNode.getBoundingClientRect();
      const correctedPosition = { x: position.x - domX, y: position.y - domY };
      return pointToRendererPoint(correctedPosition, [x, y, zoom], _snapGrid !== null, _snapGrid || [1, 1]);
    },
    /**
     *
     * @param position
     * @returns
     */
    flowToScreenPosition: (position) => {
      if (!store().domNode) {
        return position;
      }
      const { x, y, zoom } = store().viewport;
      const { x: domX, y: domY } = store().domNode.getBoundingClientRect();
      const rendererPosition = rendererPointToPoint(position, [x, y, zoom]);
      return { x: rendererPosition.x + domX, y: rendererPosition.y + domY };
    },
    toObject: () => {
      return structuredClone({
        nodes: [...store().nodes],
        edges: [...store().edges],
        viewport: { ...store().viewport }
      });
    },
    updateNode,
    updateNodeData: (id, dataUpdate, options) => {
      const node = store().nodeLookup.get(id)?.internals.userNode;
      if (!node) {
        return;
      }
      const nextData = typeof dataUpdate === "function" ? dataUpdate(node) : dataUpdate;
      updateNode(id, (node2) => ({
        ...node2,
        data: options?.replace ? nextData : { ...node2.data, ...nextData }
      }));
    },
    updateEdge,
    getNodesBounds: (nodes) => {
      return getNodesBounds(nodes, {
        nodeLookup: store().nodeLookup,
        nodeOrigin: store().nodeOrigin
      });
    },
    getHandleConnections: ({ type, id, nodeId }) => Array.from(store().connectionLookup.get(`${nodeId}-${type}-${id ?? null}`)?.values() ?? [])
  };
}
function getElements(lookup, ids) {
  const result = [];
  for (const id of ids) {
    const item = lookup.get(id);
    if (item) {
      const element = "internals" in item ? item.internals?.userNode : item;
      result.push(element);
    }
  }
  return result;
}
function KeyHandler($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      store = void 0,
      selectionKey = "Shift",
      multiSelectionKey = isMacOs() ? "Meta" : "Control",
      deleteKey = "Backspace",
      panActivationKey = " ",
      zoomActivationKey = isMacOs() ? "Meta" : "Control"
    } = $$props;
    useSvelteFlow();
    bind_props($$props, { store });
  });
}
function ConnectionLine($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { store = void 0, type, containerStyle, style, LineComponent } = $$props;
    let path = derived(() => {
      if (!store.connection.inProgress) {
        return "";
      }
      const pathParams = {
        sourceX: store.connection.from.x,
        sourceY: store.connection.from.y,
        sourcePosition: store.connection.fromPosition,
        targetX: store.connection.to.x,
        targetY: store.connection.to.y,
        targetPosition: store.connection.toPosition
      };
      switch (type) {
        case ConnectionLineType.Bezier: {
          const [path2] = getBezierPath(pathParams);
          return path2;
        }
        case ConnectionLineType.Straight: {
          const [path2] = getStraightPath(pathParams);
          return path2;
        }
        case ConnectionLineType.Step:
        case ConnectionLineType.SmoothStep: {
          const [path2] = getSmoothStepPath({
            ...pathParams,
            borderRadius: type === ConnectionLineType.Step ? 0 : void 0
          });
          return path2;
        }
      }
    });
    if (store.connection.inProgress) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<svg${attr("width", store.width)}${attr("height", store.height)} class="svelte-flow__connectionline"${attr_style(containerStyle)}><g${attr_class(clsx([
        "svelte-flow__connection",
        getConnectionStatus(store.connection.isValid)
      ]))}>`);
      if (LineComponent) {
        $$renderer2.push("<!--[-->");
        if (LineComponent) {
          $$renderer2.push("<!--[-->");
          LineComponent($$renderer2, {});
          $$renderer2.push("<!--]-->");
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push("<!--]-->");
        }
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<path${attr("d", path())}${attr_style(style)} fill="none" class="svelte-flow__connection-path"></path>`);
      }
      $$renderer2.push(`<!--]--></g></svg>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { store });
  });
}
function Panel($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      position = "top-right",
      style,
      class: className,
      children,
      $$slots,
      $$events,
      ...rest
    } = $$props;
    let positionClasses = derived(() => `${position}`.split("-"));
    $$renderer2.push(`<div${attributes({
      class: clsx(["svelte-flow__panel", className, ...positionClasses()]),
      style,
      ...rest
    })}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
  });
}
function Attribution($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { proOptions, position = "bottom-right" } = $$props;
    const link = `https://svelteflow.dev${process.env.NODE_ENV === "production" ? "?utm_source=attribution" : "/attribution"}`;
    if (!proOptions?.hideAttribution) {
      $$renderer2.push("<!--[-->");
      Panel($$renderer2, {
        position,
        class: "svelte-flow__attribution",
        "data-message": `Please only hide this attribution when you are subscribed to Svelte Flow Pro: ${link}`,
        children: ($$renderer3) => {
          $$renderer3.push(`<a${attr("href", link)} target="_blank" rel="noopener noreferrer" aria-label="Svelte Flow attribution">Svelte Flow</a>`);
        },
        $$slots: { default: true }
      });
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function Wrapper($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      width,
      height,
      colorMode,
      domNode = void 0,
      clientWidth = void 0,
      clientHeight = void 0,
      children,
      rest
    } = $$props;
    let className = derived(() => rest.class), divAttributes = derived(() => exclude_from_object(rest, [
      "id",
      "class",
      "nodeTypes",
      "edgeTypes",
      "colorMode",
      "isValidConnection",
      "onmove",
      "onmovestart",
      "onmoveend",
      "onflowerror",
      "ondelete",
      "onbeforedelete",
      "onbeforeconnect",
      "onconnect",
      "onconnectstart",
      "onconnectend",
      "onbeforereconnect",
      "onreconnect",
      "onreconnectstart",
      "onreconnectend",
      "onclickconnectstart",
      "onclickconnectend",
      "oninit",
      "onselectionchange",
      "onselectiondragstart",
      "onselectiondrag",
      "onselectiondragstop",
      "onselectionstart",
      "onselectionend",
      "clickConnect",
      "fitView",
      "fitViewOptions",
      "nodeOrigin",
      "nodeDragThreshold",
      "connectionDragThreshold",
      "minZoom",
      "maxZoom",
      "initialViewport",
      "connectionRadius",
      "connectionMode",
      "selectionMode",
      "selectNodesOnDrag",
      "snapGrid",
      "defaultMarkerColor",
      "translateExtent",
      "nodeExtent",
      "onlyRenderVisibleElements",
      "autoPanOnConnect",
      "autoPanOnNodeDrag",
      "colorModeSSR",
      "defaultEdgeOptions",
      "elevateNodesOnSelect",
      "elevateEdgesOnSelect",
      "nodesDraggable",
      "autoPanOnNodeFocus",
      "nodesConnectable",
      "elementsSelectable",
      "nodesFocusable",
      "edgesFocusable",
      "disableKeyboardA11y",
      "noDragClass",
      "noPanClass",
      "noWheelClass",
      "ariaLabelConfig",
      "autoPanSpeed",
      "panOnScrollSpeed",
      "zIndexMode",
      "autoPanOnSelection"
    ]));
    $$renderer2.push(`<div${attributes(
      {
        class: clsx([
          "svelte-flow",
          "svelte-flow__container",
          colorMode,
          className()
        ]),
        "data-testid": "svelte-flow__wrapper",
        role: "application",
        ...divAttributes()
      },
      "svelte-mkap6j",
      void 0,
      { width: toPxString(width), height: toPxString(height) }
    )}>`);
    children?.($$renderer2);
    $$renderer2.push(`<!----></div>`);
    bind_props($$props, { domNode, clientWidth, clientHeight });
  });
}
function SvelteFlow($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      width,
      height,
      proOptions,
      selectionKey,
      deleteKey,
      panActivationKey,
      multiSelectionKey,
      zoomActivationKey,
      paneClickDistance = 1,
      nodeClickDistance = 1,
      onmovestart,
      onmoveend,
      onmove,
      oninit,
      onnodeclick,
      onnodecontextmenu,
      onnodedrag,
      onnodedragstart,
      onnodedragstop,
      onnodepointerenter,
      onnodepointermove,
      onnodepointerleave,
      onselectionclick,
      onselectioncontextmenu,
      onselectionstart,
      onselectionend,
      onedgeclick,
      onedgecontextmenu,
      onedgepointerenter,
      onedgepointerleave,
      onpaneclick,
      onpanecontextmenu,
      panOnScrollMode = PanOnScrollMode.Free,
      preventScrolling = true,
      zoomOnScroll = true,
      zoomOnDoubleClick = true,
      zoomOnPinch = true,
      panOnScroll = false,
      panOnScrollSpeed = 0.5,
      panOnDrag = true,
      selectionOnDrag = false,
      autoPanOnSelection = true,
      connectionLineComponent,
      connectionLineStyle,
      connectionLineContainerStyle,
      connectionLineType = ConnectionLineType.Bezier,
      attributionPosition,
      children,
      nodes = [],
      edges = [],
      viewport = void 0,
      $$slots,
      $$events,
      ...props
    } = $$props;
    let store = createStore({
      props,
      width,
      height,
      get nodes() {
        return nodes;
      },
      set nodes(newNodes) {
        nodes = newNodes;
      },
      get edges() {
        return edges;
      },
      set edges(newEdges) {
        edges = newEdges;
      },
      get viewport() {
        return viewport;
      },
      set viewport(newViewport) {
        viewport = newViewport;
      }
    });
    const providerContext = getContext(key);
    if (providerContext && providerContext.setStore) {
      providerContext.setStore(store);
    }
    setContext(key, {
      provider: false,
      getStore() {
        return store;
      }
    });
    onDestroy(() => {
      store.reset();
    });
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      Wrapper($$renderer3, {
        colorMode: store.colorMode,
        width,
        height,
        rest: props,
        get domNode() {
          return store.domNode;
        },
        set domNode($$value) {
          store.domNode = $$value;
          $$settled = false;
        },
        get clientWidth() {
          return store.width;
        },
        set clientWidth($$value) {
          store.width = $$value;
          $$settled = false;
        },
        get clientHeight() {
          return store.height;
        },
        set clientHeight($$value) {
          store.height = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          KeyHandler($$renderer4, {
            selectionKey,
            deleteKey,
            panActivationKey,
            multiSelectionKey,
            zoomActivationKey,
            get store() {
              return store;
            },
            set store($$value) {
              store = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----> `);
          Zoom($$renderer4, {
            panOnScrollMode,
            preventScrolling,
            zoomOnScroll,
            zoomOnDoubleClick,
            zoomOnPinch,
            panOnScroll,
            panOnScrollSpeed,
            panOnDrag,
            paneClickDistance,
            selectionOnDrag,
            onmovestart,
            onmove,
            onmoveend,
            oninit,
            get store() {
              return store;
            },
            set store($$value) {
              store = $$value;
              $$settled = false;
            },
            children: ($$renderer5) => {
              Pane($$renderer5, {
                onpaneclick,
                onpanecontextmenu,
                onselectionstart,
                onselectionend,
                panOnDrag,
                paneClickDistance,
                selectionOnDrag,
                autoPanOnSelection,
                get store() {
                  return store;
                },
                set store($$value) {
                  store = $$value;
                  $$settled = false;
                },
                children: ($$renderer6) => {
                  Viewport($$renderer6, {
                    get store() {
                      return store;
                    },
                    set store($$value) {
                      store = $$value;
                      $$settled = false;
                    },
                    children: ($$renderer7) => {
                      $$renderer7.push(`<div class="svelte-flow__viewport-back svelte-flow__container"></div> `);
                      EdgeRenderer($$renderer7, {
                        onedgeclick,
                        onedgecontextmenu,
                        onedgepointerenter,
                        onedgepointerleave,
                        get store() {
                          return store;
                        },
                        set store($$value) {
                          store = $$value;
                          $$settled = false;
                        }
                      });
                      $$renderer7.push(`<!----> <div class="svelte-flow__edge-labels svelte-flow__container"></div> `);
                      ConnectionLine($$renderer7, {
                        type: connectionLineType,
                        LineComponent: connectionLineComponent,
                        containerStyle: connectionLineContainerStyle,
                        style: connectionLineStyle,
                        get store() {
                          return store;
                        },
                        set store($$value) {
                          store = $$value;
                          $$settled = false;
                        }
                      });
                      $$renderer7.push(`<!----> `);
                      NodeRenderer($$renderer7, {
                        nodeClickDistance,
                        onnodeclick,
                        onnodecontextmenu,
                        onnodepointerenter,
                        onnodepointermove,
                        onnodepointerleave,
                        onnodedrag,
                        onnodedragstart,
                        onnodedragstop,
                        get store() {
                          return store;
                        },
                        set store($$value) {
                          store = $$value;
                          $$settled = false;
                        }
                      });
                      $$renderer7.push(`<!----> `);
                      NodeSelection($$renderer7, {
                        onselectionclick,
                        onselectioncontextmenu,
                        onnodedrag,
                        onnodedragstart,
                        onnodedragstop,
                        get store() {
                          return store;
                        },
                        set store($$value) {
                          store = $$value;
                          $$settled = false;
                        }
                      });
                      $$renderer7.push(`<!----> <div class="svelte-flow__viewport-front svelte-flow__container"></div>`);
                    },
                    $$slots: { default: true }
                  });
                  $$renderer6.push(`<!----> `);
                  Selection($$renderer6, {
                    isVisible: !!(store.selectionRect && store.selectionRectMode === "user"),
                    width: store.selectionRect?.width,
                    height: store.selectionRect?.height,
                    x: store.selectionRect?.x,
                    y: store.selectionRect?.y
                  });
                  $$renderer6.push(`<!---->`);
                },
                $$slots: { default: true }
              });
            },
            $$slots: { default: true }
          });
          $$renderer4.push(`<!----> `);
          Attribution($$renderer4, { proOptions, position: attributionPosition });
          $$renderer4.push(`<!----> `);
          A11yDescriptions($$renderer4, { store });
          $$renderer4.push(`<!----> `);
          children?.($$renderer4);
          $$renderer4.push(`<!---->`);
        },
        $$slots: { default: true }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { nodes, edges, viewport });
  });
}
function SvelteFlowProvider($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { children } = $$props;
    let store = createStore({ props: {}, nodes: [], edges: [] });
    setContext(key, {
      provider: true,
      getStore() {
        return store;
      },
      setStore: (newStore) => {
        store = newStore;
      }
    });
    onDestroy(() => {
      store.reset();
    });
    children?.($$renderer2);
    $$renderer2.push(`<!---->`);
  });
}
function ControlButton($$renderer, $$props) {
  let {
    class: className,
    bgColor,
    bgColorHover,
    color,
    colorHover,
    borderColor,
    onclick,
    children,
    $$slots,
    $$events,
    ...restProps
  } = $$props;
  $$renderer.push(`<button${attributes(
    {
      type: "button",
      class: clsx(["svelte-flow__controls-button", className]),
      ...restProps
    },
    void 0,
    void 0,
    {
      "--xy-controls-button-background-color-props": bgColor,
      "--xy-controls-button-background-color-hover-props": bgColorHover,
      "--xy-controls-button-color-props": color,
      "--xy-controls-button-color-hover-props": colorHover,
      "--xy-controls-button-border-color-props": borderColor
    }
  )}>`);
  children?.($$renderer);
  $$renderer.push(`<!----></button>`);
}
function Plus($$renderer) {
  $$renderer.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M32 18.133H18.133V32h-4.266V18.133H0v-4.266h13.867V0h4.266v13.867H32z"></path></svg>`);
}
function Minus($$renderer) {
  $$renderer.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 5"><path d="M0 0h32v4.2H0z"></path></svg>`);
}
function Fit($$renderer) {
  $$renderer.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 30"><path d="M3.692 4.63c0-.53.4-.938.939-.938h5.215V0H4.708C2.13 0 0 2.054 0 4.63v5.216h3.692V4.631zM27.354 0h-5.2v3.692h5.17c.53 0 .984.4.984.939v5.215H32V4.631A4.624 4.624 0 0027.354 0zm.954 24.83c0 .532-.4.94-.939.94h-5.215v3.768h5.215c2.577 0 4.631-2.13 4.631-4.707v-5.139h-3.692v5.139zm-23.677.94c-.531 0-.939-.4-.939-.94v-5.138H0v5.139c0 2.577 2.13 4.707 4.708 4.707h5.138V25.77H4.631z"></path></svg>`);
}
function Lock($$renderer) {
  $$renderer.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 32"><path d="M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0 8 0 4.571 3.429 4.571 7.619v3.048H3.048A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047zm4.724-13.866H7.467V7.619c0-2.59 2.133-4.724 4.723-4.724 2.591 0 4.724 2.133 4.724 4.724v3.048z"></path></svg>`);
}
function Unlock($$renderer) {
  $$renderer.push(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 32"><path d="M21.333 10.667H19.81V7.619C19.81 3.429 16.38 0 12.19 0c-4.114 1.828-1.37 2.133.305 2.438 1.676.305 4.42 2.59 4.42 5.181v3.048H3.047A3.056 3.056 0 000 13.714v15.238A3.056 3.056 0 003.048 32h18.285a3.056 3.056 0 003.048-3.048V13.714a3.056 3.056 0 00-3.048-3.047zM12.19 24.533a3.056 3.056 0 01-3.047-3.047 3.056 3.056 0 013.047-3.048 3.056 3.056 0 013.048 3.048 3.056 3.056 0 01-3.048 3.047z"></path></svg>`);
}
function Controls($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      position = "bottom-left",
      orientation = "vertical",
      showZoom = true,
      showFitView = true,
      showLock = true,
      style,
      class: className,
      buttonBgColor,
      buttonBgColorHover,
      buttonColor,
      buttonColorHover,
      buttonBorderColor,
      fitViewOptions,
      children,
      before,
      after,
      $$slots,
      $$events,
      ...rest
    } = $$props;
    let store = derived(useStore);
    const buttonProps = derived(() => ({
      bgColor: buttonBgColor,
      bgColorHover: buttonBgColorHover,
      color: buttonColor,
      colorHover: buttonColorHover,
      borderColor: buttonBorderColor
    }));
    let isInteractive = derived(() => store().nodesDraggable || store().nodesConnectable || store().elementsSelectable);
    let minZoomReached = derived(() => store().viewport.zoom <= store().minZoom);
    let maxZoomReached = derived(() => store().viewport.zoom >= store().maxZoom);
    let ariaLabelConfig = derived(() => store().ariaLabelConfig);
    let orientationClass = derived(() => orientation === "horizontal" ? "horizontal" : "vertical");
    const onZoomInHandler = () => {
      store().zoomIn();
    };
    const onZoomOutHandler = () => {
      store().zoomOut();
    };
    const onFitViewHandler = () => {
      store().fitView(fitViewOptions);
    };
    const onToggleInteractivity = () => {
      let interactive = !isInteractive();
      store().nodesDraggable = interactive;
      store().nodesConnectable = interactive;
      store().elementsSelectable = interactive;
    };
    Panel($$renderer2, spread_props([
      {
        class: ["svelte-flow__controls", orientationClass(), className],
        position,
        "data-testid": "svelte-flow__controls",
        "aria-label": ariaLabelConfig()["controls.ariaLabel"],
        style
      },
      rest,
      {
        children: ($$renderer3) => {
          if (before) {
            $$renderer3.push("<!--[-->");
            before($$renderer3);
            $$renderer3.push(`<!---->`);
          } else {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (showZoom) {
            $$renderer3.push("<!--[-->");
            ControlButton($$renderer3, spread_props([
              {
                onclick: onZoomInHandler,
                class: "svelte-flow__controls-zoomin",
                title: ariaLabelConfig()["controls.zoomIn.ariaLabel"],
                "aria-label": ariaLabelConfig()["controls.zoomIn.ariaLabel"],
                disabled: maxZoomReached()
              },
              buttonProps(),
              {
                children: ($$renderer4) => {
                  Plus($$renderer4);
                },
                $$slots: { default: true }
              }
            ]));
            $$renderer3.push(`<!----> `);
            ControlButton($$renderer3, spread_props([
              {
                onclick: onZoomOutHandler,
                class: "svelte-flow__controls-zoomout",
                title: ariaLabelConfig()["controls.zoomOut.ariaLabel"],
                "aria-label": ariaLabelConfig()["controls.zoomOut.ariaLabel"],
                disabled: minZoomReached()
              },
              buttonProps(),
              {
                children: ($$renderer4) => {
                  Minus($$renderer4);
                },
                $$slots: { default: true }
              }
            ]));
            $$renderer3.push(`<!---->`);
          } else {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (showFitView) {
            $$renderer3.push("<!--[-->");
            ControlButton($$renderer3, spread_props([
              {
                class: "svelte-flow__controls-fitview",
                onclick: onFitViewHandler,
                title: ariaLabelConfig()["controls.fitView.ariaLabel"],
                "aria-label": ariaLabelConfig()["controls.fitView.ariaLabel"]
              },
              buttonProps(),
              {
                children: ($$renderer4) => {
                  Fit($$renderer4);
                },
                $$slots: { default: true }
              }
            ]));
          } else {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (showLock) {
            $$renderer3.push("<!--[-->");
            ControlButton($$renderer3, spread_props([
              {
                class: "svelte-flow__controls-interactive",
                onclick: onToggleInteractivity,
                title: ariaLabelConfig()["controls.interactive.ariaLabel"],
                "aria-label": ariaLabelConfig()["controls.interactive.ariaLabel"]
              },
              buttonProps(),
              {
                children: ($$renderer4) => {
                  if (isInteractive()) {
                    $$renderer4.push("<!--[-->");
                    Unlock($$renderer4);
                  } else {
                    $$renderer4.push("<!--[!-->");
                    Lock($$renderer4);
                  }
                  $$renderer4.push(`<!--]-->`);
                },
                $$slots: { default: true }
              }
            ]));
          } else {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (children) {
            $$renderer3.push("<!--[-->");
            children($$renderer3);
            $$renderer3.push(`<!---->`);
          } else {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]--> `);
          if (after) {
            $$renderer3.push("<!--[-->");
            after($$renderer3);
            $$renderer3.push(`<!---->`);
          } else {
            $$renderer3.push("<!--[!-->");
          }
          $$renderer3.push(`<!--]-->`);
        },
        $$slots: { default: true }
      }
    ]));
  });
}
var BackgroundVariant;
(function(BackgroundVariant2) {
  BackgroundVariant2["Lines"] = "lines";
  BackgroundVariant2["Dots"] = "dots";
  BackgroundVariant2["Cross"] = "cross";
})(BackgroundVariant || (BackgroundVariant = {}));
function DotPattern($$renderer, $$props) {
  let { radius, class: className } = $$props;
  $$renderer.push(`<circle${attr("cx", radius)}${attr("cy", radius)}${attr("r", radius)}${attr_class(clsx(["svelte-flow__background-pattern", "dots", className]))}></circle>`);
}
function LinePattern($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { lineWidth, dimensions, variant, class: className } = $$props;
    $$renderer2.push(`<path${attr("stroke-width", lineWidth)}${attr("d", `M${dimensions[0] / 2} 0 V${dimensions[1]} M0 ${dimensions[1] / 2} H${dimensions[0]}`)}${attr_class(clsx(["svelte-flow__background-pattern", variant, className]))}></path>`);
  });
}
const defaultSize = {
  [BackgroundVariant.Dots]: 1,
  [BackgroundVariant.Lines]: 1,
  [BackgroundVariant.Cross]: 6
};
function Background($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      id,
      variant = BackgroundVariant.Dots,
      gap = 20,
      size,
      lineWidth = 1,
      bgColor,
      patternColor,
      patternClass,
      class: className
    } = $$props;
    let store = derived(useStore);
    let isDots = derived(() => variant === BackgroundVariant.Dots);
    let isCross = derived(() => variant === BackgroundVariant.Cross);
    let gapXY = derived(() => Array.isArray(gap) ? gap : [gap, gap]);
    let patternId = derived(() => `background-pattern-${store().flowId}-${id ?? ""}`);
    let scaledGap = derived(() => [
      gapXY()[0] * store().viewport.zoom || 1,
      gapXY()[1] * store().viewport.zoom || 1
    ]);
    let scaledSize = derived(() => (size ?? defaultSize[variant]) * store().viewport.zoom);
    let patternDimensions = derived(() => isCross() ? [scaledSize(), scaledSize()] : scaledGap());
    let patternOffset = derived(() => isDots() ? [scaledSize() / 2, scaledSize() / 2] : [patternDimensions()[0] / 2, patternDimensions()[1] / 2]);
    $$renderer2.push(`<svg${attr_class(clsx([
      "svelte-flow__background",
      "svelte-flow__container",
      className
    ]))} data-testid="svelte-flow__background"${attr_style("", {
      "--xy-background-color-props": bgColor,
      "--xy-background-pattern-color-props": patternColor
    })}><pattern${attr("id", patternId())}${attr("x", store().viewport.x % scaledGap()[0])}${attr("y", store().viewport.y % scaledGap()[1])}${attr("width", scaledGap()[0])}${attr("height", scaledGap()[1])} patternUnits="userSpaceOnUse"${attr("patternTransform", `translate(-${patternOffset()[0]},-${patternOffset()[1]})`)}>`);
    if (isDots()) {
      $$renderer2.push("<!--[-->");
      DotPattern($$renderer2, { radius: scaledSize() / 2, class: patternClass });
    } else {
      $$renderer2.push("<!--[!-->");
      LinePattern($$renderer2, {
        dimensions: patternDimensions(),
        variant,
        lineWidth,
        class: patternClass
      });
    }
    $$renderer2.push(`<!--]--></pattern><rect x="0" y="0" width="100%" height="100%"${attr("fill", `url(#${patternId()})`)}></rect></svg>`);
  });
}
function useInternalNode(id) {
  const $$d = derived(useStore), nodeLookup = derived(() => $$d().nodeLookup), nodes = derived(() => $$d().nodes);
  const node = derived(() => {
    nodes();
    return nodeLookup().get(id);
  });
  return {
    get current() {
      return node();
    }
  };
}
function MinimapNode($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      id,
      x: xProp,
      y: yProp,
      width: widthProp,
      height: heightProp,
      borderRadius = 5,
      color,
      shapeRendering,
      strokeColor,
      strokeWidth = 2,
      selected,
      class: className,
      nodeComponent
    } = $$props;
    let internalNode = derived(() => useInternalNode(id));
    let $$d = derived(() => {
      if (!internalNode().current) {
        return { width: 0, height: 0, x: 0, y: 0 };
      }
      const { width: width2, height: height2 } = getNodeDimensions(internalNode().current);
      return {
        width: widthProp ?? width2,
        height: heightProp ?? height2,
        x: xProp ?? internalNode().current.internals.positionAbsolute.x,
        y: yProp ?? internalNode().current.internals.positionAbsolute.y
      };
    }), width = derived(() => $$d().width), height = derived(() => $$d().height), x = derived(() => $$d().x), y = derived(() => $$d().y);
    if (nodeComponent) {
      $$renderer2.push("<!--[-->");
      const CustomComponent = nodeComponent;
      if (CustomComponent) {
        $$renderer2.push("<!--[-->");
        CustomComponent($$renderer2, {
          id,
          x: x(),
          y: y(),
          width: width(),
          height: height(),
          borderRadius,
          class: className,
          color,
          shapeRendering,
          strokeColor,
          strokeWidth,
          selected
        });
        $$renderer2.push("<!--]-->");
      } else {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push("<!--]-->");
      }
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<rect${attr_class(clsx(["svelte-flow__minimap-node", className]), void 0, { "selected": selected })}${attr("x", x())}${attr("y", y())}${attr("rx", borderRadius)}${attr("ry", borderRadius)}${attr("width", width())}${attr("height", height())}${attr("shape-rendering", shapeRendering)}${attr_style("", {
        fill: color,
        stroke: strokeColor,
        "stroke-width": strokeWidth
      })}></rect>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
const getAttrFunction = (func) => func instanceof Function ? func : () => func;
function Minimap($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      position = "bottom-right",
      ariaLabel,
      nodeStrokeColor = "transparent",
      nodeColor,
      nodeClass = "",
      nodeBorderRadius = 5,
      nodeStrokeWidth = 2,
      nodeComponent,
      bgColor,
      maskColor,
      maskStrokeColor,
      maskStrokeWidth,
      width = 200,
      height = 150,
      pannable = true,
      zoomable = true,
      inversePan,
      zoomStep,
      class: className,
      $$slots,
      $$events,
      ...rest
    } = $$props;
    let store = derived(useStore);
    let ariaLabelConfig = derived(() => store().ariaLabelConfig);
    const shapeRendering = (
      // @ts-expect-error - TS doesn't know about chrome
      typeof window === "undefined" || !!window.chrome ? "crispEdges" : "geometricPrecision"
    );
    let labelledBy = derived(() => `svelte-flow__minimap-desc-${store().flowId}`);
    let viewBB = derived(() => ({
      x: -store().viewport.x / store().viewport.zoom,
      y: -store().viewport.y / store().viewport.zoom,
      width: store().width / store().viewport.zoom,
      height: store().height / store().viewport.zoom
    }));
    let boundingRect = derived(() => getBoundsOfRects(getInternalNodesBounds(store().nodeLookup, { filter: (n) => !n.hidden }), viewBB()));
    let scaledWidth = derived(() => boundingRect().width / width);
    let scaledHeight = derived(() => boundingRect().height / height);
    let viewScale = derived(() => Math.max(scaledWidth(), scaledHeight()));
    let viewWidth = derived(() => viewScale() * width);
    let viewHeight = derived(() => viewScale() * height);
    let offset = derived(() => 5 * viewScale());
    let x = derived(() => boundingRect().x - (viewWidth() - boundingRect().width) / 2 - offset());
    let y = derived(() => boundingRect().y - (viewHeight() - boundingRect().height) / 2 - offset());
    let viewboxWidth = derived(() => viewWidth() + offset() * 2);
    let viewboxHeight = derived(() => viewHeight() + offset() * 2);
    css_props($$renderer2, true, { "--xy-minimap-background-color-props": bgColor }, () => {
      Panel($$renderer2, spread_props([
        {
          position,
          class: ["svelte-flow__minimap", className],
          "data-testid": "svelte-flow__minimap"
        },
        rest,
        {
          children: ($$renderer3) => {
            if (store().panZoom) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<svg${attr("width", width)}${attr("height", height)}${attr("viewBox", `${stringify(x())} ${stringify(y())} ${stringify(viewboxWidth())} ${stringify(viewboxHeight())}`)} class="svelte-flow__minimap-svg" role="img"${attr("aria-labelledby", labelledBy())}${attr_style("", {
                "--xy-minimap-mask-background-color-props": maskColor,
                "--xy-minimap-mask-stroke-color-props": maskStrokeColor,
                "--xy-minimap-mask-stroke-width-props": maskStrokeWidth ? maskStrokeWidth * viewScale() : void 0
              })}>`);
              if (ariaLabel ?? ariaLabelConfig()["minimap.ariaLabel"]) {
                $$renderer3.push("<!--[-->");
                $$renderer3.push(`<title${attr("id", labelledBy())}>${escape_html(ariaLabel ?? ariaLabelConfig()["minimap.ariaLabel"])}</title>`);
              } else {
                $$renderer3.push("<!--[!-->");
              }
              $$renderer3.push(`<!--]--><!--[-->`);
              const each_array = ensure_array_like(store().nodes);
              for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
                let userNode = each_array[$$index];
                const node = store().nodeLookup.get(userNode.id);
                if (node && nodeHasDimensions(node) && !node.hidden) {
                  $$renderer3.push("<!--[-->");
                  MinimapNode($$renderer3, {
                    id: node.id,
                    selected: node.selected,
                    nodeComponent,
                    color: nodeColor === void 0 ? void 0 : getAttrFunction(nodeColor)(userNode),
                    borderRadius: nodeBorderRadius,
                    strokeColor: getAttrFunction(nodeStrokeColor)(userNode),
                    strokeWidth: nodeStrokeWidth,
                    shapeRendering,
                    class: getAttrFunction(nodeClass)(userNode)
                  });
                } else {
                  $$renderer3.push("<!--[!-->");
                }
                $$renderer3.push(`<!--]-->`);
              }
              $$renderer3.push(`<!--]--><path class="svelte-flow__minimap-mask"${attr("d", `M${stringify(x() - offset())},${stringify(y() - offset())}h${stringify(viewboxWidth() + offset() * 2)}v${stringify(viewboxHeight() + offset() * 2)}h${stringify(-viewboxWidth() - offset() * 2)}z
      M${stringify(viewBB().x)},${stringify(viewBB().y)}h${stringify(viewBB().width)}v${stringify(viewBB().height)}h${stringify(-viewBB().width)}z`)} fill-rule="evenodd" pointer-events="none"></path></svg>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]-->`);
          },
          $$slots: { default: true }
        }
      ]));
    });
  });
}
function defaultParams(type, catalogue) {
  const definition = catalogue?.types?.find((t) => t.type === type);
  const params = {};
  for (const field of definition?.params ?? []) {
    if (field.default !== void 0) params[field.key] = structuredClone(field.default);
  }
  return params;
}
function newNode(type, catalogue, position = { x: 0, y: 0 }) {
  return {
    id: v4().slice(0, 8),
    params: defaultParams(type, catalogue),
    position,
    type
  };
}
function newGraph(triggerType, catalogue) {
  return {
    edges: [],
    nodes: [newNode(triggerType, catalogue, { x: 0, y: 0 })],
    version: GRAPH_VERSION
  };
}
function toFlow(graph) {
  return {
    edges: (graph?.edges ?? []).map((edge) => ({
      deletable: true,
      id: edge.id,
      source: edge.from,
      sourceHandle: edge.fromHandle,
      target: edge.to,
      type: "deletable"
    })),
    nodes: (graph?.nodes ?? []).map((node) => ({
      data: { params: node.params ?? {}, type: node.type },
      id: node.id,
      position: node.position ?? { x: 0, y: 0 },
      type: node.type.split(".")[0]
    }))
  };
}
function createsCycle(edges, connection) {
  const next = /* @__PURE__ */ new Map();
  for (const edge of edges) {
    if (!next.has(edge.source)) next.set(edge.source, []);
    next.get(edge.source).push(edge.target);
  }
  const seen = /* @__PURE__ */ new Set();
  const stack = [connection.target];
  while (stack.length) {
    const id = stack.pop();
    if (id === connection.source) return true;
    if (seen.has(id)) continue;
    seen.add(id);
    stack.push(...next.get(id) ?? []);
  }
  return false;
}
const KEY = Symbol("automation-editor");
function createEditorState(initial = {}) {
  const editor = {
    catalogue: initial.catalogue ?? null,
    /** Automations a button may start: those triggered by a button press. */
    buttonAutomations: initial.buttonAutomations ?? [],
    /** `trigger.button.pressed` nodes in the graph being edited. */
    buttonTriggers: [],
    categories: initial.categories ?? [],
    channels: initial.channels ?? [],
    problems: [],
    questions: initial.questions ?? [],
    roles: initial.roles ?? [],
    selected: null
  };
  setContext(KEY, editor);
  return editor;
}
const editorState = () => getContext(KEY);
function BaseNode($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { id, data, selected } = $$props;
    const editor = editorState();
    const category = derived(() => categoryOf(data.type));
    const skin = derived(() => CATEGORY_META[category()] ?? CATEGORY_META.action);
    const definition = derived(() => editor.catalogue?.types?.find((t) => t.type === data.type));
    const problems = derived(() => editor.problems.filter((p) => p.nodeId === id));
    const broken = derived(() => problems().some((p) => p.severity === "error"));
    const outputs = derived(() => definition()?.outputs ?? ["out"]);
    const hasInput = derived(() => category() !== "trigger");
    if (hasInput()) {
      $$renderer2.push("<!--[-->");
      Handle($$renderer2, {
        type: "target",
        position: Position.Left,
        class: "!border-white !bg-gray-400 dark:!border-slate-800 dark:!bg-slate-400"
      });
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div${attr_class(`w-[260px] rounded-xl border-2 bg-white p-3 shadow-sm dark:bg-slate-700 ${stringify(broken() ? "border-red-500" : selected ? "border-blurple ring-2 ring-blurple/40" : skin().border)}`)}><div class="flex items-center gap-2"><i${attr_class(`fa-solid ${stringify(iconFor(data.type))} ${stringify(skin().icon)}`)}></i> <span class="min-w-0 flex-1 truncate font-medium">${escape_html(definition()?.label ?? data.type)}</span> `);
    if (broken()) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<i class="fa-solid fa-triangle-exclamation text-red-500"${attr("title", problems()[0].message)}></i>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div> <p class="mt-1 truncate text-sm text-gray-500 dark:text-slate-400">${escape_html(summarise({ params: data.params, type: data.type }, editor.catalogue))}</p> <span${attr_class(`mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${stringify(skin().chip)}`)}>${escape_html(skin().label.replace(/s$/, ""))}</span></div> <!--[-->`);
    const each_array = ensure_array_like(outputs());
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let handle = each_array[i];
      Handle($$renderer2, {
        type: "source",
        id: handle,
        position: Position.Right,
        style: outputs().length > 1 ? `top: ${30 + i * 40}%` : "",
        class: `!border-white dark:!border-slate-800 ${stringify(handle === "true" ? "!bg-green-500" : handle === "false" ? "!bg-red-400" : skin().handle)}`
      });
      $$renderer2.push(`<!----> `);
      if (outputs().length > 1) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span${attr_class(`pointer-events-none absolute -right-11 text-[10px] font-semibold ${stringify(handle === "true" ? "text-green-600 dark:text-green-400" : "text-red-500 dark:text-red-400")}`)}${attr_style(`top: calc(${stringify(30 + i * 40)}% - 7px)`)}>${escape_html(handle)}</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function ActionNode($$renderer, $$props) {
  let { id, data, selected } = $$props;
  BaseNode($$renderer, { id, data, selected });
}
function ConditionNode($$renderer, $$props) {
  let { id, data, selected } = $$props;
  BaseNode($$renderer, { id, data, selected });
}
function FlowNode($$renderer, $$props) {
  let { id, data, selected } = $$props;
  BaseNode($$renderer, { id, data, selected });
}
function TriggerNode($$renderer, $$props) {
  let { id, data, selected } = $$props;
  BaseNode($$renderer, { id, data, selected });
}
function DeletableEdge($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      id,
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      markerEnd
    } = $$props;
    useSvelteFlow();
    const bezier = derived(() => getBezierPath({
      sourcePosition,
      sourceX,
      sourceY,
      targetPosition,
      targetX,
      targetY
    }));
    BaseEdge($$renderer2, { id, path: bezier()[0], markerEnd });
    $$renderer2.push(`<!----> `);
    EdgeLabel($$renderer2, {
      x: bezier()[1],
      y: bezier()[2],
      transparent: true,
      class: "group",
      children: ($$renderer3) => {
        $$renderer3.push(`<button type="button" aria-label="Remove this connection" class="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs text-gray-400 opacity-0 shadow transition duration-200 hover:text-red-500 group-hover:opacity-100 dark:bg-slate-700 dark:text-slate-400"><i class="fa-solid fa-xmark"></i></button>`);
      },
      $$slots: { default: true }
    });
    $$renderer2.push(`<!---->`);
  });
}
function Canvas($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { nodes = void 0, edges = void 0, colorMode = "light" } = $$props;
    const editor = editorState();
    const nodeTypes = {
      action: ActionNode,
      condition: ConditionNode,
      flow: FlowNode,
      trigger: TriggerNode
    };
    const edgeTypes = { deletable: DeletableEdge };
    const typeOf = (id) => nodes.find((n) => n.id === id)?.data?.type;
    const isValidConnection = (connection) => {
      if (connection.source === connection.target) return false;
      if (String(typeOf(connection.target)).startsWith("trigger.")) return false;
      if (edges.some((e) => e.source === connection.source && e.sourceHandle === connection.sourceHandle && e.target === connection.target)) return false;
      return !createsCycle(edges, connection);
    };
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      SvelteFlow($$renderer3, {
        nodeTypes,
        edgeTypes,
        colorMode,
        isValidConnection,
        defaultEdgeOptions: {
          markerEnd: { height: 18, type: MarkerType.ArrowClosed, width: 18 },
          type: "deletable"
        },
        fitView: true,
        minZoom: 0.25,
        maxZoom: 2,
        snapGrid: [20, 20],
        deleteKey: ["Delete"],
        onnodeclick: ({ node }) => editor.selected = node.id,
        onpaneclick: () => editor.selected = null,
        get nodes() {
          return nodes;
        },
        set nodes($$value) {
          nodes = $$value;
          $$settled = false;
        },
        get edges() {
          return edges;
        },
        set edges($$value) {
          edges = $$value;
          $$settled = false;
        },
        children: ($$renderer4) => {
          Background($$renderer4, { variant: BackgroundVariant.Dots, gap: 20 });
          $$renderer4.push(`<!----> `);
          Controls($$renderer4, { position: "bottom-left" });
          $$renderer4.push(`<!----> `);
          if (nodes.length > 8) {
            $$renderer4.push("<!--[-->");
            Minimap($$renderer4, { pannable: true, zoomable: true });
          } else {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]-->`);
        },
        $$slots: { default: true }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    bind_props($$props, { nodes, edges });
  });
}
function BooleanField($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { field, value, onchange } = $$props;
    $$renderer2.push(`<label class="flex items-center gap-2 text-sm font-medium"><input type="checkbox" class="form-checkbox"${attr("checked", Boolean(value), true)}/> ${escape_html(field.label)}</label>`);
  });
}
function DurationField($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { field, value, onchange } = $$props;
    let text = run(() => value == null ? "" : humanShorthand(value));
    const parsed = derived(() => parseDuration(text));
    function humanShorthand(ms) {
      const units = [
        ["w", 6048e5],
        ["d", 864e5],
        ["h", 36e5],
        ["m", 6e4],
        ["s", 1e3]
      ];
      for (const [suffix, size] of units) if (ms % size === 0 && ms >= size) return `${ms / size}${suffix}`;
      return String(ms);
    }
    $$renderer2.push(`<input type="text" class="input form-input text-sm" placeholder="10m"${attr("value", text)}/> <p${attr_class(`mt-1 text-xs ${stringify(parsed() === null && text ? "text-red-500" : "text-gray-500 dark:text-slate-400")}`)}>`);
    if (!text) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`Try <code>30s</code>, <code>10m</code>, <code>2h</code> or <code>1d</code>.`);
    } else if (parsed() === null) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`Not a length of time.`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`= ${escape_html(humanDuration(parsed()))}${escape_html(field.max && parsed() > field.max ? " — too long" : "")}`);
    }
    $$renderer2.push(`<!--]--></p>`);
  });
}
function NumberField($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { field, value, onchange } = $$props;
    $$renderer2.push(`<input type="number" class="input form-input text-sm"${attr("max", field.max)}${attr("min", field.min)}${attr("value", value ?? "")}/>`);
  });
}
function RoleField($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { field, value, onchange, multiple = false } = $$props;
    const editor = editorState();
    const selected = derived(() => multiple ? value ?? [] : value);
    if (multiple) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<select multiple="" class="input form-multiselect h-40 text-sm"><!--[-->`);
      const each_array = ensure_array_like(editor.roles);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let role = each_array[$$index];
        $$renderer2.option(
          {
            value: role.id,
            selected: selected().includes(role.id),
            style: role._style
          },
          ($$renderer3) => {
            $$renderer3.push(`${escape_html(role.name)}`);
          }
        );
      }
      $$renderer2.push(`<!--]--></select>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.select(
        {
          class: "input form-multiselect text-sm",
          value: selected() ?? "",
          onchange: (e) => onchange(e.currentTarget.value || null)
        },
        ($$renderer3) => {
          $$renderer3.option({ value: "" }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(field.required ? "Pick a role" : "Any role")}`);
          });
          $$renderer3.push(`<!--[-->`);
          const each_array_1 = ensure_array_like(editor.roles);
          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
            let role = each_array_1[$$index_1];
            $$renderer3.option({ value: role.id, style: role._style }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(role.name)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
      );
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function SelectField($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { field, value, onchange } = $$props;
    $$renderer2.select(
      {
        class: "input form-multiselect text-sm",
        value: value ?? "",
        onchange: (e) => onchange(e.currentTarget.value)
      },
      ($$renderer3) => {
        if (!field.required) {
          $$renderer3.push("<!--[-->");
          $$renderer3.option({ value: "" }, ($$renderer4) => {
            $$renderer4.push(`Any`);
          });
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--><!--[-->`);
        const each_array = ensure_array_like(field.options ?? []);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let option = each_array[$$index];
          $$renderer3.option({ value: option.value }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(option.label)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      }
    );
  });
}
function TextField($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { field, value, onchange } = $$props;
    $$renderer2.push(`<input type="text" class="input form-input text-sm"${attr("maxlength", field.maxLength)}${attr("placeholder", field.placeholder ?? "")}${attr("value", value ?? "")}/>`);
  });
}
function TicketCategoryField($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { field, value, onchange, multiple = false } = $$props;
    const editor = editorState();
    const selected = derived(() => multiple ? value ?? [] : value);
    if (multiple) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<select multiple="" class="input form-multiselect h-32 text-sm"><!--[-->`);
      const each_array = ensure_array_like(editor.categories);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let category = each_array[$$index];
        $$renderer2.option(
          {
            value: category.id,
            selected: selected().includes(category.id)
          },
          ($$renderer3) => {
            $$renderer3.push(`${escape_html(category.name)}`);
          }
        );
      }
      $$renderer2.push(`<!--]--></select> <p class="mt-1 text-xs text-gray-500 dark:text-slate-400">${escape_html(selected().length === 0 ? "Every category." : `${selected().length} selected.`)}</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.select(
        {
          class: "input form-multiselect text-sm",
          value: selected() ?? "",
          onchange: (e) => onchange(e.currentTarget.value === "" ? null : Number(e.currentTarget.value))
        },
        ($$renderer3) => {
          $$renderer3.option({ value: "" }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(field.required ? "Pick a category" : "Any category")}`);
          });
          $$renderer3.push(`<!--[-->`);
          const each_array_1 = ensure_array_like(editor.categories);
          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
            let category = each_array_1[$$index_1];
            $$renderer3.option({ value: category.id }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(category.name)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
      );
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function ConditionRows($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { clauses = [], match = "all", onchange } = $$props;
    const editor = editorState();
    const fields = derived(() => editor.catalogue?.clauseFields ?? []);
    const ops = derived(() => editor.catalogue?.clauseOps ?? {});
    const limit = derived(() => editor.catalogue?.limits?.clauses ?? 10);
    const definitionOf = (name) => fields().find((f) => f.field === name);
    const WIDGETS = {
      boolean: BooleanField,
      category: TicketCategoryField,
      duration: DurationField,
      number: NumberField,
      priority: SelectField,
      regex: TextField,
      role: RoleField
    };
    const PRIORITY_OPTIONS = [
      { label: "Low", value: "LOW" },
      { label: "Medium", value: "MEDIUM" },
      { label: "High", value: "HIGH" }
    ];
    const update = (next, nextMatch = match) => onchange(next, nextMatch);
    const setClause = (i, patch) => update(clauses.map((clause, index) => index === i ? { ...clause, ...patch } : clause));
    const pickField = (i, name) => {
      const definition = definitionOf(name);
      setClause(i, { field: name, op: definition?.ops?.[0] ?? "is", value: null });
    };
    $$renderer2.push(`<div class="flex items-center gap-2"><span class="text-sm font-medium">Match</span> `);
    $$renderer2.select(
      {
        class: "input form-multiselect w-auto text-sm",
        value: match,
        onchange: (e) => update(clauses, e.currentTarget.value)
      },
      ($$renderer3) => {
        $$renderer3.option({ value: "all" }, ($$renderer4) => {
          $$renderer4.push(`all of these`);
        });
        $$renderer3.option({ value: "any" }, ($$renderer4) => {
          $$renderer4.push(`any of these`);
        });
      }
    );
    $$renderer2.push(`</div> <div class="mt-2 flex flex-col gap-2"><!--[-->`);
    const each_array = ensure_array_like(clauses);
    for (let i = 0, $$length = each_array.length; i < $$length; i++) {
      let clause = each_array[i];
      const definition = definitionOf(clause.field);
      const Widget = WIDGETS[definition?.operand];
      $$renderer2.push(`<div class="rounded-xl bg-gray-100/60 p-2 dark:bg-slate-800/50"><div class="flex items-start gap-2"><div class="min-w-0 flex-1 space-y-1">`);
      $$renderer2.select(
        {
          class: "input form-multiselect text-sm",
          value: clause.field ?? "",
          onchange: (e) => pickField(i, e.currentTarget.value)
        },
        ($$renderer3) => {
          $$renderer3.push(`<!--[-->`);
          const each_array_1 = ensure_array_like(fields());
          for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
            let option = each_array_1[$$index];
            $$renderer3.option({ value: option.field }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(option.label)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
      );
      $$renderer2.push(` `);
      $$renderer2.select(
        {
          class: "input form-multiselect text-sm",
          value: clause.op ?? "",
          onchange: (e) => setClause(i, { op: e.currentTarget.value })
        },
        ($$renderer3) => {
          $$renderer3.push(`<!--[-->`);
          const each_array_2 = ensure_array_like(definition?.ops ?? []);
          for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
            let op = each_array_2[$$index_1];
            $$renderer3.option({ value: op }, ($$renderer4) => {
              $$renderer4.push(`${escape_html(ops()[op] ?? op)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
      );
      $$renderer2.push(` `);
      if (clause.field === "ticket.answer") {
        $$renderer2.push("<!--[-->");
        $$renderer2.select(
          {
            class: "input form-multiselect text-sm",
            value: clause.questionId ?? "",
            onchange: (e) => setClause(i, { questionId: e.currentTarget.value })
          },
          ($$renderer3) => {
            $$renderer3.option({ value: "" }, ($$renderer4) => {
              $$renderer4.push(`Pick a question`);
            });
            $$renderer3.push(`<!--[-->`);
            const each_array_3 = ensure_array_like(editor.questions);
            for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
              let question = each_array_3[$$index_2];
              $$renderer3.option({ value: question.id }, ($$renderer4) => {
                $$renderer4.push(`${escape_html(question.label)}`);
              });
            }
            $$renderer3.push(`<!--]-->`);
          }
        );
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (Widget) {
        $$renderer2.push("<!--[-->");
        if (Widget) {
          $$renderer2.push("<!--[-->");
          Widget($$renderer2, {
            field: {
              key: "value",
              label: "Value",
              options: definition?.operand === "priority" ? PRIORITY_OPTIONS : void 0,
              required: true
            },
            value: clause.value,
            onchange: (v) => setClause(i, { value: v })
          });
          $$renderer2.push("<!--]-->");
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push("<!--]-->");
        }
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div> <button type="button" class="text-red-300 transition duration-300 hover:text-red-500 dark:text-red-500/50 dark:hover:text-red-500" title="Remove this condition"><i class="fa-solid fa-xmark"></i></button></div></div>`);
    }
    $$renderer2.push(`<!--]--></div> `);
    if (clauses.length < limit()) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<button type="button" class="link mt-2 text-sm"><i class="fa-solid fa-plus"></i> Add a condition</button>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function ButtonsField($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { field, value, onchange } = $$props;
    const editor = editorState();
    const buttons = derived(() => Array.isArray(value) ? value : []);
    const max = derived(() => field.maxItems ?? 5);
    const STYLES = [
      { label: "Blurple", value: "primary" },
      { label: "Grey", value: "secondary" },
      { label: "Green", value: "success" },
      { label: "Red", value: "danger" }
    ];
    const inGraph = derived(() => editor.buttonTriggers ?? []);
    const others = derived(() => editor.buttonAutomations ?? []);
    const hasTargets = derived(() => inGraph().length > 0 || others().length > 0);
    const valueOf = (button) => button.nodeId ? `node:${button.nodeId}` : button.automationKey ? `key:${button.automationKey}` : "";
    const pickTarget = (i, raw) => set(i, raw.startsWith("node:") ? { automationKey: void 0, nodeId: raw.slice(5) } : { automationKey: raw.slice(4), nodeId: void 0 });
    const set = (i, patch) => onchange(buttons().map((button, index) => index === i ? { ...button, ...patch } : button));
    if (!hasTargets()) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="rounded-lg bg-amber-400/10 p-2 text-xs text-amber-700 dark:text-amber-300">Add an <span class="font-semibold">A button is pressed</span> trigger to this automation first —
		that is what a button here runs.</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="flex flex-col gap-2"><!--[-->`);
      const each_array = ensure_array_like(buttons());
      for (let i = 0, $$length = each_array.length; i < $$length; i++) {
        let button = each_array[i];
        $$renderer2.push(`<div class="rounded-xl bg-gray-100/60 p-2 dark:bg-slate-800/50"><div class="flex items-start gap-2"><div class="min-w-0 flex-1 space-y-1"><input type="text" class="input form-input text-sm" maxlength="80" placeholder="Button label"${attr("value", button.label ?? "")}/> `);
        $$renderer2.select(
          {
            class: "input form-multiselect text-sm",
            value: valueOf(button),
            onchange: (e) => pickTarget(i, e.currentTarget.value)
          },
          ($$renderer3) => {
            $$renderer3.option({ value: "" }, ($$renderer4) => {
              $$renderer4.push(`Pick what it runs`);
            });
            if (inGraph().length > 0) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<optgroup label="In this automation"><!--[-->`);
              const each_array_1 = ensure_array_like(inGraph());
              for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
                let trigger = each_array_1[$$index];
                $$renderer3.option({ value: `node:${stringify(trigger.id)}` }, ($$renderer4) => {
                  $$renderer4.push(`${escape_html(trigger.label)}`);
                });
              }
              $$renderer3.push(`<!--]--></optgroup>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]-->`);
            if (others().length > 0) {
              $$renderer3.push("<!--[-->");
              $$renderer3.push(`<optgroup label="Another automation"><!--[-->`);
              const each_array_2 = ensure_array_like(others());
              for (let $$index_1 = 0, $$length2 = each_array_2.length; $$index_1 < $$length2; $$index_1++) {
                let target = each_array_2[$$index_1];
                $$renderer3.option({ value: `key:${stringify(target.key)}` }, ($$renderer4) => {
                  $$renderer4.push(`${escape_html(target.name)}`);
                });
              }
              $$renderer3.push(`<!--]--></optgroup>`);
            } else {
              $$renderer3.push("<!--[!-->");
            }
            $$renderer3.push(`<!--]-->`);
          }
        );
        $$renderer2.push(` `);
        $$renderer2.select(
          {
            class: "input form-multiselect text-sm",
            value: button.style ?? "primary",
            onchange: (e) => set(i, { style: e.currentTarget.value })
          },
          ($$renderer3) => {
            $$renderer3.push(`<!--[-->`);
            const each_array_3 = ensure_array_like(STYLES);
            for (let $$index_2 = 0, $$length2 = each_array_3.length; $$index_2 < $$length2; $$index_2++) {
              let style = each_array_3[$$index_2];
              $$renderer3.option({ value: style.value }, ($$renderer4) => {
                $$renderer4.push(`${escape_html(style.label)}`);
              });
            }
            $$renderer3.push(`<!--]-->`);
          }
        );
        $$renderer2.push(`</div> <button type="button" class="text-red-300 transition duration-300 hover:text-red-500 dark:text-red-500/50 dark:hover:text-red-500" title="Remove this button"><i class="fa-solid fa-xmark"></i></button></div></div>`);
      }
      $$renderer2.push(`<!--]--></div> `);
      if (buttons().length < max()) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<button type="button" class="link mt-2 text-sm"><i class="fa-solid fa-plus"></i> Add a button</button>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function ChannelField($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { field, value, onchange, multiple = false } = $$props;
    const editor = editorState();
    const TYPES = { "action.ticket.move": [4] };
    const allowed = derived(() => field.channelTypes ?? TYPES[field.key] ?? [0, 5, 15]);
    const options = derived(() => editor.channels.filter((c) => allowed().includes(c.type)));
    const selected = derived(() => multiple ? value ?? [] : value);
    if (multiple) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<select multiple="" class="input form-multiselect h-40 text-sm"><!--[-->`);
      const each_array = ensure_array_like(options());
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let channel = each_array[$$index];
        $$renderer2.option({ value: channel.id, selected: selected().includes(channel.id) }, ($$renderer3) => {
          $$renderer3.push(`#${escape_html(channel.name)}`);
        });
      }
      $$renderer2.push(`<!--]--></select>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.select(
        {
          class: "input form-multiselect text-sm",
          value: selected() ?? "",
          onchange: (e) => onchange(e.currentTarget.value || null)
        },
        ($$renderer3) => {
          $$renderer3.option({ value: "" }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(field.required ? "Pick a channel" : "Any channel")}`);
          });
          $$renderer3.push(`<!--[-->`);
          const each_array_1 = ensure_array_like(options());
          for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
            let channel = each_array_1[$$index_1];
            $$renderer3.option({ value: channel.id }, ($$renderer4) => {
              $$renderer4.push(`#${escape_html(channel.name)}`);
            });
          }
          $$renderer3.push(`<!--]-->`);
        }
      );
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function EmojiField($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { value, onchange } = $$props;
    let emoji = run(() => value ?? "");
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      EmojiPicker($$renderer3, {
        get value() {
          return emoji;
        },
        set value($$value) {
          emoji = $$value;
          $$settled = false;
        }
      });
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}
function TextAreaField($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { field, value, onchange } = $$props;
    const editor = editorState();
    const VARIABLES = ["{name}", "{displayname}", "{num}"];
    $$renderer2.push(`<textarea class="input form-input h-24 text-sm"${attr("maxlength", field.maxLength)}>`);
    const $$body = escape_html(value ?? "");
    if ($$body) {
      $$renderer2.push(`${$$body}`);
    }
    $$renderer2.push(`</textarea> <div class="mt-1 flex flex-wrap gap-1"><!--[-->`);
    const each_array = ensure_array_like(VARIABLES);
    for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
      let token = each_array[$$index];
      $$renderer2.push(`<button type="button" class="rounded bg-gray-200 px-1.5 py-0.5 font-mono text-xs text-gray-600 transition duration-200 hover:bg-blurple hover:text-white dark:bg-slate-800 dark:text-slate-400">${escape_html(token)}</button>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (field.maxLength) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span class="ml-auto text-xs text-gray-400 dark:text-slate-500">${escape_html((value ?? "").length)}/${escape_html(field.maxLength)}</span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (editor.catalogue === null) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<span></span>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function UserField($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { field, value, onchange } = $$props;
    const valid = derived(() => !value || /^\d{15,20}$/.test(String(value)));
    $$renderer2.push(`<input type="text" class="input form-input text-sm" placeholder="Discord user ID"${attr("value", value ?? "")}/> `);
    if (!valid()) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="mt-1 text-xs text-red-500">That does not look like a Discord ID.</p>`);
    } else if (!field.required) {
      $$renderer2.push("<!--[1-->");
      $$renderer2.push(`<p class="mt-1 text-xs text-gray-500 dark:text-slate-400">Enable Developer Mode to copy an ID.</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function ParamFields($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { node } = $$props;
    const editor = editorState();
    const { updateNodeData } = useSvelteFlow();
    const FIELDS = {
      boolean: BooleanField,
      buttons: ButtonsField,
      categories: TicketCategoryField,
      category: TicketCategoryField,
      channel: ChannelField,
      channels: ChannelField,
      cron: TextField,
      duration: DurationField,
      emoji: EmojiField,
      number: NumberField,
      priority: SelectField,
      regex: TextField,
      role: RoleField,
      roles: RoleField,
      select: SelectField,
      subject: SelectField,
      text: TextField,
      textarea: TextAreaField,
      timezone: TextField,
      url: TextField,
      user: UserField
    };
    const MULTI = /* @__PURE__ */ new Set(["categories", "channels", "roles"]);
    const definition = derived(() => editor.catalogue?.types?.find((t) => t.type === node?.data?.type));
    const params = derived(() => node?.data?.params ?? {});
    const problems = derived(() => editor.problems.filter((p) => p.nodeId === node?.id));
    const set = (key2, value) => updateNodeData(node.id, { params: { ...params(), [key2]: value } });
    const optionsFor = (field) => field.type === "subject" ? editor.catalogue?.subjects ?? [] : field.options ?? [];
    const visible = (field) => !(field.key === "channelId" && params().target !== "channel") && !(field.key === "channelIds" && params().scope !== "channels");
    if (definition()) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="flex flex-col gap-3"><!--[-->`);
      const each_array = ensure_array_like(definition().params);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let field = each_array[$$index];
        if (visible(field)) {
          $$renderer2.push("<!--[-->");
          const Field = FIELDS[field.type] ?? TextField;
          const problem = problems().find((p) => p.key === field.key);
          $$renderer2.push(`<div>`);
          if (field.type !== "boolean") {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<div class="text-sm font-medium">${escape_html(field.label)} `);
            if (field.required) {
              $$renderer2.push("<!--[-->");
              $$renderer2.push(`<span class="text-red-500">*</span>`);
            } else {
              $$renderer2.push("<!--[!-->");
            }
            $$renderer2.push(`<!--]--></div>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--> `);
          if (field.type === "clauses") {
            $$renderer2.push("<!--[-->");
            ConditionRows($$renderer2, {
              clauses: params().clauses ?? [],
              match: params().match ?? "all",
              onchange: (clauses, match) => updateNodeData(node.id, { params: { ...params(), clauses, match } })
            });
          } else {
            $$renderer2.push("<!--[!-->");
            $$renderer2.push(`<div${attr_class(clsx(problem ? "rounded ring-2 ring-red-500/60" : ""))}>`);
            if (Field) {
              $$renderer2.push("<!--[-->");
              Field($$renderer2, {
                field: { ...field, options: optionsFor(field) },
                multiple: MULTI.has(field.type),
                value: params()[field.key],
                onchange: (value) => set(field.key, value)
              });
              $$renderer2.push("<!--]-->");
            } else {
              $$renderer2.push("<!--[!-->");
              $$renderer2.push("<!--]-->");
            }
            $$renderer2.push(`</div>`);
          }
          $$renderer2.push(`<!--]--> `);
          if (problem) {
            $$renderer2.push("<!--[-->");
            $$renderer2.push(`<p class="mt-1 text-xs text-red-500">${escape_html(problem.message)}</p>`);
          } else if (field.help) {
            $$renderer2.push("<!--[1-->");
            $$renderer2.push(`<p class="mt-1 text-xs text-gray-500 dark:text-slate-400">${escape_html(field.help)}</p>`);
          } else {
            $$renderer2.push("<!--[!-->");
          }
          $$renderer2.push(`<!--]--></div>`);
        } else {
          $$renderer2.push("<!--[!-->");
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]--> `);
      if (definition().params.length === 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<p class="text-sm text-gray-500 dark:text-slate-400">This step has nothing to configure.</p>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function Inspector($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { node } = $$props;
    const editor = editorState();
    const { updateNodeData } = useSvelteFlow();
    const definition = derived(() => editor.catalogue?.types?.find((t) => t.type === node?.data?.type));
    const skin = derived(() => node ? CATEGORY_META[categoryOf(node.data.type)] ?? CATEGORY_META.action : null);
    const isTrigger = derived(() => node ? categoryOf(node.data.type) === "trigger" : false);
    const triggers = derived(() => (editor.catalogue?.types ?? []).filter((t) => t.category === "trigger").sort((a, b) => a.label.localeCompare(b.label)));
    const changeTrigger = (type) => {
      if (!type || type === node.data.type) return;
      updateNodeData(node.id, { params: defaultParams(type, editor.catalogue), type });
    };
    $$renderer2.push(`<div class="rounded-xl bg-white p-4 shadow-sm dark:bg-slate-700">`);
    if (!node) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="text-sm text-gray-500 dark:text-slate-400">Pick a step on the canvas to configure it, or add one from the list on the left.</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="mb-3 flex items-start gap-2"><i${attr_class(`fa-solid ${stringify(iconFor(node.data.type))} mt-1 ${stringify(skin().icon)}`)}></i> <div class="min-w-0 flex-1"><p class="truncate font-semibold">${escape_html(definition()?.label ?? node.data.type)}</p> <p class="text-xs text-gray-500 dark:text-slate-400">${escape_html(definition()?.description ?? "")}</p></div> `);
      if (!isTrigger()) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<button type="button" class="text-red-300 transition duration-300 hover:text-red-500 dark:text-red-500/50 dark:hover:text-red-500" title="Remove this step"><i class="fa-solid fa-trash"></i></button>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div> `);
      if (isTrigger()) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="mb-3"><div class="text-sm font-medium">When this happens</div> `);
        $$renderer2.select(
          {
            class: "input form-multiselect text-sm",
            value: node.data.type,
            onchange: (e) => changeTrigger(e.currentTarget.value)
          },
          ($$renderer3) => {
            $$renderer3.push(`<!--[-->`);
            const each_array = ensure_array_like(triggers());
            for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
              let trigger = each_array[$$index];
              $$renderer3.option({ value: trigger.type }, ($$renderer4) => {
                $$renderer4.push(`${escape_html(trigger.label)}`);
              });
            }
            $$renderer3.push(`<!--]-->`);
          }
        );
        $$renderer2.push(` <p class="mt-1 text-xs text-gray-500 dark:text-slate-400">Changing this keeps everything you have wired up; its own settings reset.</p></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      if (definition()?.durable) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<p class="mb-3 rounded-lg bg-violet-400/10 p-2 text-xs text-violet-700 dark:text-violet-300">Everything after this step is made durable — it survives a restart.</p>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> `);
      ParamFields($$renderer2, { node });
      $$renderer2.push(`<!---->`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function NodePalette($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const editor = editorState();
    let search = "";
    const grouped = derived(() => {
      const types = editor.catalogue?.types ?? [];
      const needle = search.trim().toLowerCase();
      return CATEGORY_ORDER.map((category) => ({
        category,
        items: types.filter((t) => t.category === category).filter((t) => !needle || t.label.toLowerCase().includes(needle) || t.description.toLowerCase().includes(needle)).sort((a, b) => a.label.localeCompare(b.label))
      })).filter((group) => group.items.length > 0);
    });
    $$renderer2.push(`<div class="rounded-xl bg-white p-3 shadow-sm dark:bg-slate-700"><input type="search" class="input form-input text-sm" placeholder="Search steps…"${attr("value", search)}/> <div class="mt-3 flex max-h-[60vh] flex-col gap-4 overflow-y-auto"><!--[-->`);
    const each_array = ensure_array_like(grouped());
    for (let $$index_1 = 0, $$length = each_array.length; $$index_1 < $$length; $$index_1++) {
      let group = each_array[$$index_1];
      const skin = CATEGORY_META[group.category];
      $$renderer2.push(`<div><p class="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-slate-500">${escape_html(skin.label)}</p> <div class="flex flex-col gap-1"><!--[-->`);
      const each_array_1 = ensure_array_like(group.items);
      for (let $$index = 0, $$length2 = each_array_1.length; $$index < $$length2; $$index++) {
        let item = each_array_1[$$index];
        $$renderer2.push(`<button type="button"${attr("title", item.description)} class="flex items-start gap-2 rounded-lg p-2 text-left transition duration-200 hover:bg-gray-100 dark:hover:bg-slate-800"><i${attr_class(`fa-solid ${stringify(iconFor(item.type))} mt-0.5 ${stringify(skin.icon)}`)}></i> <span class="min-w-0"><span class="block truncate text-sm font-medium">${escape_html(item.label)}</span> <span class="block truncate text-xs text-gray-500 dark:text-slate-400">${escape_html(item.description)}</span></span></button>`);
      }
      $$renderer2.push(`<!--]--></div></div>`);
    }
    $$renderer2.push(`<!--]--> `);
    if (grouped().length === 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<p class="text-sm text-gray-500 dark:text-slate-400">Nothing matches that.</p>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
function Toolbar($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { problems = [] } = $$props;
    editorState();
    useSvelteFlow();
    const errors = derived(() => problems.filter((p) => p.severity === "error"));
    $$renderer2.push(`<div class="flex flex-wrap items-center gap-2"><button type="button" class="link text-sm"><i class="fa-solid fa-wand-magic-sparkles"></i> Tidy up</button> <button type="button" class="link text-sm"><i class="fa-solid fa-expand"></i> Fit</button> `);
    if (problems.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="relative"><button type="button"${attr_class(`rounded-full px-3 py-1 text-xs font-medium transition duration-200 ${stringify(errors().length ? "bg-red-500/20 text-red-600 dark:text-red-400" : "bg-amber-500/20 text-amber-700 dark:text-amber-400")}`)}><i class="fa-solid fa-triangle-exclamation"></i> ${escape_html(problems.length)}
				${escape_html(problems.length === 1 ? "problem" : "problems")}</button> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
const NODE_W = 260;
const NODE_H = 110;
const GAP_X = 120;
const GAP_Y = 40;
function autoLayout(graph) {
  const rank = new Map(graph.nodes.map((n) => [n.id, 0]));
  const incoming = new Map(graph.nodes.map((n) => [n.id, 0]));
  const next = new Map(graph.nodes.map((n) => [n.id, []]));
  for (const edge of graph.edges) {
    if (!next.has(edge.from) || !incoming.has(edge.to)) continue;
    next.get(edge.from).push(edge.to);
    incoming.set(edge.to, incoming.get(edge.to) + 1);
  }
  const queue = graph.nodes.filter((n) => incoming.get(n.id) === 0).map((n) => n.id);
  const order = [];
  while (queue.length) {
    const id = queue.shift();
    order.push(id);
    for (const to of next.get(id) ?? []) {
      rank.set(to, Math.max(rank.get(to), rank.get(id) + 1));
      incoming.set(to, incoming.get(to) - 1);
      if (incoming.get(to) === 0) queue.push(to);
    }
  }
  for (const node of graph.nodes) if (!order.includes(node.id)) order.push(node.id);
  const perRank = /* @__PURE__ */ new Map();
  for (const id of order) {
    const node = graph.nodes.find((n) => n.id === id);
    const r = rank.get(id) ?? 0;
    const row = perRank.get(r) ?? 0;
    perRank.set(r, row + 1);
    node.position = { x: r * (NODE_W + GAP_X), y: row * (NODE_H + GAP_Y) };
  }
  return graph;
}
const needsLayout = (graph) => (graph?.nodes ?? []).some(
  (n) => !Number.isFinite(n.position?.x) || !Number.isFinite(n.position?.y)
);
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { data } = $$props;
    const theme = getContext("theme");
    const starting = (() => {
      const graph = data.automation?.graph ?? newGraph("trigger.ticket.created", data.catalogue);
      if (needsLayout(graph)) autoLayout(graph);
      return graph;
    })();
    const initial = toFlow(starting);
    let nodes = initial.nodes;
    let edges = initial.edges;
    let name = run(() => data.automation?.name ?? "New automation");
    let enabled = run(() => data.automation?.enabled ?? true);
    let testing = false;
    const editor = createEditorState(run(() => ({
      buttonAutomations: data.buttonAutomations,
      catalogue: data.catalogue,
      categories: data.categories,
      channels: data.channels,
      questions: data.categories.flatMap((c) => c.questions ?? []),
      roles: data.roles
    })));
    const selectedNode = derived(() => nodes.find((n) => n.id === editor.selected) ?? null);
    run(() => JSON.stringify({ enabled, graph: starting, name }));
    const blocking = derived(() => editor.problems.filter((p) => p.severity === "error"));
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      head("1nxjzup", $$renderer3, ($$renderer4) => {
        $$renderer4.title(($$renderer5) => {
          $$renderer5.push(`<title>${escape_html(name)}</title>`);
        });
      });
      {
        $$renderer3.push("<!--[!-->");
      }
      $$renderer3.push(`<!--]--> `);
      SvelteFlowProvider($$renderer3, {
        children: ($$renderer4) => {
          $$renderer4.push(`<div class="mb-4 flex flex-wrap items-center gap-3"><a href="../automations" class="link"><i class="fa-solid fa-angle-left"></i> Automations</a> <input type="text" class="input form-input w-auto flex-1 text-lg font-semibold" maxlength="100"${attr("value", name)}/> <label class="flex items-center gap-2 text-sm font-medium"><input type="checkbox" class="form-checkbox"${attr("checked", enabled, true)}/> Enabled</label> `);
          if (!data.isNew) {
            $$renderer4.push("<!--[-->");
            $$renderer4.push(`<button type="button"${attr("disabled", testing, true)} title="Run the graph without touching Discord, to see which branch it takes" class="rounded-lg bg-gray-200 px-4 py-2 font-medium transition duration-300 hover:bg-gray-300 disabled:opacity-50 dark:bg-slate-600 dark:hover:bg-slate-500"><i${attr_class(`fa-solid ${stringify("fa-flask")}`)}></i> Test</button>`);
          } else {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--> <button type="button"${attr("disabled", blocking().length > 0, true)} class="rounded-lg bg-green-300 px-4 py-2 font-medium transition duration-300 hover:bg-green-400 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-green-500/75 dark:hover:bg-green-500"><i${attr_class(`fa-solid ${stringify("fa-floppy-disk")}`)}></i> Save</button></div> <div class="mb-2">`);
          Toolbar($$renderer4, { problems: editor.problems });
          $$renderer4.push(`<!----></div> `);
          {
            $$renderer4.push("<!--[!-->");
          }
          $$renderer4.push(`<!--]--> <div class="grid grid-cols-1 gap-4 lg:grid-cols-[16rem_1fr_20rem]">`);
          NodePalette($$renderer4);
          $$renderer4.push(`<!----> <div class="automations-canvas h-[calc(100dvh-24rem)] min-h-[30rem] overflow-hidden rounded-xl bg-white shadow-sm dark:bg-slate-700 svelte-1nxjzup">`);
          Canvas($$renderer4, {
            colorMode: theme === "dark" ? "dark" : "light",
            get nodes() {
              return nodes;
            },
            set nodes($$value) {
              nodes = $$value;
              $$settled = false;
            },
            get edges() {
              return edges;
            },
            set edges($$value) {
              edges = $$value;
              $$settled = false;
            }
          });
          $$renderer4.push(`<!----></div> `);
          Inspector($$renderer4, { node: selectedNode() });
          $$renderer4.push(`<!----></div>`);
        }
      });
      $$renderer3.push(`<!----> `);
      ToastContainer($$renderer3, {
        placement: "bottom-right",
        duration: 4e3,
        children: invalid_default_snippet,
        $$slots: {
          default: ($$renderer4, { data: data2 }) => {
            BootstrapToast($$renderer4, { data: data2 });
          }
        }
      });
      $$renderer3.push(`<!---->`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
  });
}

export { _page as default };
//# sourceMappingURL=_page.svelte-Dk99lg2G.js.map
