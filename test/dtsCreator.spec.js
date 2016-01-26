'use strict';

var assert = require('assert');
var DtsCreator = require('../lib/dtsCreator').DtsCreator;

describe('DtsCreator', () => {
  var creator = new DtsCreator();
  describe('#create', () => {
    it('returns type definition', done => {
      creator.create('test/testStyle.css').then(result => {
        assert.equal(result, "export const myClass: string;")
        done();
      });
    });
  });
});
