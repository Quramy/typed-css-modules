'use strict';

import process from 'process';
import fs from 'fs';
import path from'path';
import Core from 'css-modules-loader-core';

var rootDir = process.cwd();

// TODO
var validateKey = (key) => {
   return /^[$_a-zA-Z][0-9a-zA-Z$_]*$/.test(key);
};

var createDef = (root, rel, cb) => {
  if(!cb) cb = () => {};
  var sourcePath = path.join(root, rel)
  fs.readFile(sourcePath, 'utf8', (err, contents) => {
    if(err) {
      cb(err, null);
    }
    core.load(contents, sourcePath, null).then((res) => {
      if(res && res.exportTokens) {
        var tokens = res.exportTokens;
        var keys = Object.keys(tokens);
        var result = keys.filter(validateKey).map(k => ('export const ' + k + ': string;'));
        cb(null, result.join('\n'));
      }
    });
  });
};

export class DtsCreator {
  constructor(options) {
    if(!options) options = {};
    this.rootDir = options.rootDir || process.cwd();
    this.core = new Core();
  }

  create(relativePath) {
    return new Promise((resolve, reject) => {
      var sourcePath = path.join(this.rootDir, relativePath)
      fs.readFile(sourcePath, 'utf8', (err, contents) => {
        if(err) {
          reject(err);
        }
        this.core.load(contents, sourcePath, null).then((res) => {
          if(res && res.exportTokens) {
            var tokens = res.exportTokens;
            var keys = Object.keys(tokens);
            var result = keys.filter(validateKey).map(k => ('export const ' + k + ': string;'));
            resolve(result.join('\n'));
          }else{
            reject(res);
          }
        });
      });
    });
  }

}

