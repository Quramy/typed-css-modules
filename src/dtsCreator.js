'use strict';

import process from 'process';
import fs from 'fs';
import path from'path';

import isThere from 'is-there';
import mkdirp from 'mkdirp';
import camelcase from "camelcase"

import {TokenValidator} from './tokenValidator';
import FileSystemLoader from './fileSystemLoader';
import os from 'os';

let validator = new TokenValidator();

function removeExtension(filePath) {
  const ext = path.extname(filePath);
  return filePath.replace(new RegExp(ext + '$'), '');
}

class DtsContent {
  constructor({
    dropExtension,
    rootDir,
    searchDir,
    outDir,
    rInputPath,
    rawTokenList,
    resultList,
    messageList,
    EOL
  }) {
    this.dropExtension = dropExtension;
    this.rootDir = rootDir;
    this.searchDir = searchDir;
    this.outDir = outDir;
    this.rInputPath = rInputPath;
    this.rawTokenList = rawTokenList;
    this.resultList = resultList;
    this.messageList = messageList;
    this.EOL = EOL;
  }

  get contents() {
    return this.resultList;
  }

  get formatted() {
    if(!this.resultList || !this.resultList.length || this.resultList.length === 0) return '';

    const formatted = `declare const styles: {
${this.resultList.join('\n')}
};

export = styles;
`;

    return formatted.replace(/\n/g, this.EOL);
  }

  get tokens() {
    return this.rawTokenList;
  }

  get outputFilePath() {
    const outputFileName = this.dropExtension ? removeExtension(this.rInputPath) : this.rInputPath;
    return path.join(this.rootDir, this.outDir, outputFileName + '.d.ts');
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
    this.loader = new FileSystemLoader(this.rootDir);
    this.inputDirectory = path.join(this.rootDir, this.searchDir);
    this.outputDirectory = path.join(this.rootDir, this.outDir);
    this.camelCase = options.camelCase;
    this.dropExtension = !!options.dropExtension;
    this.EOL = options.EOL || os.EOL;
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

          var convertKey = this.getConvertKeyMethod(this.camelCase);
          const resultList = [];

          keys.forEach(key => {
            const convertedKey = convertKey(key);
            var ret = validator.validate(convertedKey);
            if(ret.isValidVariableName) {
              validKeys.push(convertedKey);
              resultList.push(`  readonly ${convertedKey}: string;`);
            }else if (ret.isValidObjectKeyName) {
              resultList.push(`  readonly '${convertedKey}': string;`);
            }else{
              messageList.push(ret.message);
            }
          });

          var content = new DtsContent({
            dropExtension: this.dropExtension,
            rootDir: this.rootDir,
            searchDir: this.searchDir,
            outDir: this.outDir,
            rInputPath,
            rawTokenList: keys,
            resultList,
            messageList,
            EOL: this.EOL
          });

          resolve(content);
        }else{
          reject(res);
        }
      }).catch(err => reject(err));
    });
  }

  getConvertKeyMethod(camelCaseOption) {
    switch (camelCaseOption) {
      case true:
        return camelcase;
      case 'dashes':
        return this.dashesCamelCase;
      default:
        return (key) => key;
    }
  }

  /**
   * Replaces only the dashes and leaves the rest as-is.
   *
   * Mirrors the behaviour of the css-loader:
   * https://github.com/webpack-contrib/css-loader/blob/1fee60147b9dba9480c9385e0f4e581928ab9af9/lib/compile-exports.js#L3-L7
   */
  dashesCamelCase(str) {
    return str.replace(/-+(\w)/g, function(match, firstLetter) {
      return firstLetter.toUpperCase();
    });
  }


}
