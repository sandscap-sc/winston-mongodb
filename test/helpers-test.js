/**
 * @module 'helpers-test'
 * @fileoverview Tests for winston-mongodb internal helpers methods
 * @license MIT
 * @author 0@39.yt (Yurij Mikhalevich)
 */
'use strict';
const vows = require('vows');
const assert = require('assert');
const helpers = require('../lib/helpers');
const mongodb = require('mongodb');

class CustomError extends Error {
  constructor() {
    super();
    this.testField = 'custom error';
  }
}

const originalData = {
  customDate: new Date(),
  standardError: new Error('some error'),
  customError: new CustomError(),
  complexObj: {
    objId: new mongodb.ObjectID()
  },
  circularRef: null
};

originalData.circularRef = originalData;

vows.describe('winston-mongodb-helpers').addBatch({
  'prepareMetaData': {
    topic: helpers.prepareMetaData(originalData),
    'should preserve Date instances': function (preparedData) {
      assert.isTrue(preparedData.customDate instanceof Date);
      assert.equal(+preparedData.customDate, +originalData.customDate);
    },
    'should store Error objects': function (preparedData) {
      assert.isTrue(preparedData.standardError instanceof Object);
      assert.isFalse(preparedData.standardError instanceof Error);
      assert.equal(preparedData.standardError.message, originalData.standardError.message);
      assert.equal(preparedData.standardError.name, originalData.standardError.name);
      assert.equal(preparedData.standardError.stack, originalData.standardError.stack);
    },
    'should store extra fields for custom Error objects': function (preparedData) {
      assert.isTrue(preparedData.customError instanceof Object);
      assert.isFalse(preparedData.customError instanceof Error);
      assert.equal(preparedData.customError.message, originalData.customError.message);
      assert.equal(preparedData.customError.name, originalData.customError.name);
      assert.equal(preparedData.customError.stack, originalData.customError.stack);
      assert.equal(preparedData.customError.testField, originalData.customError.testField);
    },
    'should prepare ObjectID to be a valid ObjectID': function (preparedData) {
      assert.isTrue(mongodb.ObjectID.isValid(preparedData.complexObj.objId));
      assert.equal(typeof preparedData.complexObj.objId.toHexString, 'function');
    },
    'should handle circular references in objects': function (preparedData) {
      assert.equal(preparedData.circularRef, '[Circular]')
    }
  }
}).export(module);