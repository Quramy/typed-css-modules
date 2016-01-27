'use strict';

import process from 'process';
import fs from 'fs';
import path from'path';

import isThere from 'is-there';
import mkdirp from 'mkdirp';

import Core from 'css-modules-loader-core';
import {TokenValidator} from './tokenValidator';

let validator = new TokenValidator();
var rootDir = process.cwd();

// TODO
var validateKey = (key) => {
   return /^[$_a-zA-Z][0-9a-zA-Z$_]*$/.test(key);
};

export class DtsContent {
  constructor({
    rootDir,
    searchDir,
    outDir,
    rInputPath,
    rawTokenList,
    resultList,
    messageList
  }) {
    this.rootDir = rootDir;
    this.searchDir = searchDir;
    this.outDir = outDir;
    this.rInputPath = rInputPath;
    this.rawTokenList = rawTokenList;
    this.resultList = resultList;
    this.messageList = messageList;
  }

  get contents() {
    return this.resultList;
  }

  get formatted() {
    if(!this.resultList || !this.resultList.length) return null;
    return this.resultList.join('\n');
  }

  get tokens() {
    return this.rawTokenList;
  }

  get outputFilePath() {
    return path.join(this.rootDir, this.outDir, this.rInputPath + '.d.ts');
  }

  get inputFilePath() {
    return path.join(this.rootDir, this.searchDir, this.rInputPath);
  }

  writeFile() {
    var outPathDir = path.dirname(this.outputFilePath);
    if(!isThere(outPathDir)) {
      mkdirp.sync(outPathDir);
    }
    return new Promise((resolve, reject) => {
      fs.writeFile(this.outputFilePath, this.formatted, 'utf8', (err) => {
        if(err) {
          reject(err);
        }else{
          resolve(this);
        }
      });
    });
  }
}

export class DtsCreator {
  constructor(options) {
    if(!options) options = {};
    this.rootDir = options.rootDir || process.cwd();
    this.searchDir = options.searchDir || '';
    this.outDir = options.outDir || this.searchDir;
    this.core = new Core();
    this.inputDirectory = path.join(this.rootDir, this.searchDir);
    this.outputDirectory = path.join(this.rootDir, this.outDir);
  }

  create(filePath) {
    return new Promise((resolve, reject) => {
      fs.readFile(filePath, 'utf8', (err, contents) => {
        if(err) {
          reject(err);
        }
        this.core.load(contents, filePath, null).then((res) => {
          if(res && res.exportTokens) {
            var tokens = res.exportTokens;
            var keys = Object.keys(tokens);
            var validKeys = [], invalidKeys = [];
            var messageList = [];

            keys.forEach(key => {
              var ret = validator.validate(key);
              if(ret.isValid) {
                validKeys.push(key);
              }else{
                messageList.push(ret.message);
              }
            });

            var result = validKeys.map(k => ('export const ' + k + ': string;'));

            var rInputPath;
            if(path.isAbsolute) {
              rInputPath = path.relative(this.inputDirectory, filePath);
            }else{
              rInputpath = path.relative(this.inputDirectory, path.join(process.cwd(), filePath));
            }

            var content = new DtsContent({
              rootDir: this.rootDir,
              searchDir: this.searchDir,
              outDir: this.outDir,
              rInputPath,
              rawTokenList: keys,
              resultList: result,
              messageList
            });

            resolve(content);
          }else{
            reject(res);
          }
        });
      });
    });
  }

}

