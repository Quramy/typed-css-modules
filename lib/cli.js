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

var _yargs = require('yargs');

var _yargs2 = _interopRequireDefault(_yargs);

var _dtsCreator = require('./dtsCreator');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var yarg = _yargs2.default.usage('Create .css.d.ts from CSS modules *.css files.\nUsage: $0 [options] <input directory>').example('$0 src/styles').example('$0 -p styles/**/*.icss -w').detectLocale(false).demand(['_']).alias('p', 'pattern').describe('p', 'Glob pattern with css files').alias('w', 'watch').describe('w', 'Watch input directory\'s css files or pattern').boolean('w').alias('h', 'help').help('h');
var argv = yarg.argv;

var rootDir = undefined,
    searchDir = undefined;
var creator = undefined;
var writeFile = function writeFile(f) {
  creator.create(f).then(function (result) {
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

var main = function main() {
  if (argv.h) {
    yarg.showHelp();
    return;
  }

  if (argv._ && argv._[0]) {
    searchDir = argv._[0];
  } else if (argv.p) {
    searchDir = './';
  } else {
    yarg.showHelp();
    return;
  }

  var filesPattern = _path2.default.join(searchDir, argv.p || '**/*.css');
  rootDir = _process2.default.cwd();
  creator = new _dtsCreator.DtsCreator({ rootDir: rootDir });

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
};

main();