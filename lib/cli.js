#!/usr/bin/env node


'use strict';

var _process = require('process');

var _process2 = _interopRequireDefault(_process);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _gaze = require('gaze');

var _gaze2 = _interopRequireDefault(_gaze);

var _glob = require('glob');

var _glob2 = _interopRequireDefault(_glob);

var _optimist = require('optimist');

var _optimist2 = _interopRequireDefault(_optimist);

var _dtsCreator = require('./dtsCreator');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var argv = _optimist2.default.usage('Create .css.d.ts files. \nUsage: $0').alias('d', 'directory').describe('d', 'Input directory includes .css files').alias('w', 'watch').describe('w', 'Watch input directory').argv;

var rootDir = _process2.default.cwd();
var createor = new _dtsCreator.DtsCreator({ rootDir: rootDir });
var filesPattern = _path2.default.join(argv.d, '**/*.css');

var writeFile = function writeFile(f) {
  createor.create(f).then(function (result) {
    var outPath = _path2.default.join(rootDir, f + '.d.ts');
    _fs2.default.writeFile(outPath, result, 'utf8', function (err) {
      if (err) {
        console.error(err);
        return;
      }
      console.log('Wrote ' + outPath);
    });
  }).catch(function (err) {
    return console.error(err);
  });
};

if (!argv.w) {
  (0, _glob2.default)(filesPattern, null, function (err, files) {
    if (err) {
      console.error(err);
      return;
    }
    if (!files || !files.length) return;
    files.forEach(function (f) {
      return writeFile(f);
    });
  });
} else {
  console.log('Watch ' + filesPattern + '...');
  (0, _gaze2.default)(filesPattern, function (err, files) {
    this.on('changed', function (absPath) {
      var f = _path2.default.relative(rootDir, absPath);
      writeFile(f);
    });
    this.on('added', function (absPath) {
      var f = _path2.default.relative(rootDir, absPath);
      writeFile(f);
    });
  });
}