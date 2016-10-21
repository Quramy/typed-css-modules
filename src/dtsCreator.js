'use strict';

if (!process) {
  const process = require('process');
}
import fs from 'fs';
import path from'path';

import isThere from 'is-there';
import mkdirp from 'mkdirp';
import camelcase from "camelcase"

import {TokenValidator} from './tokenValidator';
import FileSystemLoader from './fileSystemLoader';
import os from 'os';

let validator = new TokenValidator();

class DtsContent {
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
    if(!this.resultList || !this.resultList.length) return 'export default {};';
    return this.resultList.join(os.EOL);
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
      fs.writeFile(this.outputFilePath, this.formatted + os.EOL, 'utf8', (err) => {
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
    this.loader = new FileSystemLoader(this.rootDir);
    this.inputDirectory = path.join(this.rootDir, this.searchDir);
    this.outputDirectory = path.join(this.rootDir, this.outDir);
    this.camelCase = !!options.camelCase;
  }

  create(filePath, initialContents, clearCache = false) {
    return new Promise((resolve, reject) => {
      var rInputPath;
      if(path.isAbsolute(filePath)) {
        rInputPath = path.relative(this.inputDirectory, filePath);
      }else{
        rInputPath = path.relative(this.inputDirectory, path.join(process.cwd(), filePath));
      }
      if(clearCache) {
        this.loader.tokensByFile = {};
      }
      this.loader.fetch(filePath, "/", undefined, initialContents).then(res => {
        if(res) {
          var tokens = res;
          var keys = Object.keys(tokens);
          var validKeys = [], invalidKeys = [];
          var messageList = [];

          keys.forEach(key => {
            const convertedKey = this.camelCase ? camelcase(key) : key;
            var ret = validator.validate(convertedKey);
            if(ret.isValid) {
              validKeys.push(convertedKey);
            }else{
              messageList.push(ret.message);
            }
          });

          var result = validKeys.map(k => ('export const ' + k + ': string;'));

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
      }).catch(err => reject(err));
    });
  }
}
