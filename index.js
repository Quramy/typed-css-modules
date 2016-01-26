'use strict';

var FileSystemLoader = require('css-modulesify/file-system-loader');
var process = require('process');

var loadersMap = {};

var rootDir = process.cwd();
var loader = new FileSystemLoader(rootDir);

//var relFilename = 'test/resource/style01.css';

var validateKey = (key) => {
   return /^[$_a-zA-Z][0-9a-zA-Z$_]*$/.test(key);
};

var initLoader = (rootDir) => {
  loader = new FileSystemLoader(rootDir);
};

var createContents = (relFilename) => {
  return loader.fetch(relFilename, '/').then(tokens => {
    var keys = Object.keys(tokens);
    var result = keys.filter(validateKey).map(k => ('export const ' + k + ': string;'));
    return result.join('\n');
  });
};

module.exports = {
  createContents: createContents,
  initLoader: initLoader
};

//createContents(relFilename).then(res => console.log(res));
