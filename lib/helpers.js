/**
 * @module helpers
 * @fileoverview Helpers for winston-mongodb
 * @license MIT
 * @author 0@39.yt (Yurij Mikhalevich)
 */
'use strict';
const ObjectID = require('mongodb').ObjectID;
//const cloneDeepWith = require('lodash.clonedeepwith');
//const cloneDeepWith = require('lodash.keysin');
const _ = require('lodash');


/**
 * Prepares metadata to store into database.
 * 1) Remove objects circular refences
 * 2) Clean field names
 * 3) Clone safely, handling special objects such as Error and ObjectID
 * @param {*} meta Metadata
 * @return {*}
 */
exports.prepareMetaData = meta => {
  if (typeof meta === 'object' && meta !== null) {
    meta = makeObjectNonCircular(meta);
    cleanFieldNames(meta);
  }
  //meta = common.clone(meta);
  // cloneDeep keep __proto__ property such that objects keep their inheritance
  meta = _.cloneDeepWith(meta, cloneDeepCustomizer);
  return meta;
};

function cloneDeepCustomizer(value, key, obj) {
  if (value instanceof Date) {
    return new Date(value);
  }
  if (value instanceof ObjectID) {
    return new ObjectID(value);
  }
  if (value instanceof Error) {
    return _.assignIn({}, _.cloneDeepWith(value, cloneDeepCustomizer));
  }
  // Return undefined so Lodash will handle cloning
  return void 0;
}

/**
 * Removes mongodb incompatible characters from metadata field names.
 * @param {Object} object Object to clean
 */
function cleanFieldNames(object) {
  for (let field in object) {
    if (!Object.prototype.hasOwnProperty.call(object, field)) {
      continue;
    }
    let value = object[field];
    if (field.includes('.') || field.includes('$')) {
      delete object[field];
      object[field.replace(/\./g, '[dot]').replace(/\$/g, '[$]')] = value;
    }
    if (typeof value === 'object') {
      cleanFieldNames(value);
    }
  }
}


/**
 * Cleans object from circular references, replaces them with string '[Circular]'
 * @param {Object} node Current object or its leaf
 * @param {Array=} opt_parents Object's parents
 */
function makeObjectNonCircular(node, opt_parents) {
  opt_parents = opt_parents || [];
  opt_parents.push(node);
  let copy = Array.isArray(node) ? [] : {};
  if (node instanceof Error) {
    // This is needed because Error's message, name and stack isn't accessible when cycling through properties
    copy = {
      message: node.message,
      name: node.name,
      stack: node.stack
    };
  }
  for (let key in node) {
    if (!Object.prototype.hasOwnProperty.call(node, key)) {
      continue;
    }
    let value = node[key];
    if (typeof value === 'object' && !(value instanceof ObjectID) && !(value instanceof Date)) {
      if (opt_parents.indexOf(value) === -1) {
        copy[key] = makeObjectNonCircular(value, opt_parents);
      } else {
        copy[key] = '[Circular]';
      }
    } else {
      copy[key] = value;
    }
  }
  opt_parents.pop();
  return copy;
}