#!/usr/bin/env node

'use strict';

var gaze = require('gaze');
var glob = require('glob');
var argv = require('optimist')
  .usage('Create .css.d.ts files. \nUsage: $0')
  .alias('d', 'directory').describe('d', 'Input directory includes .css files')
  .alias('w', 'watch').describe('w', 'Watch input directory')
  .argv
  ;

var process = require('process');
var fs = require('fs');
var path = require('path');

var rootDir = process.cwd();
var filesPattern = path.join(argv.d, '**/*.css');

var core = require('./index');
core.initLoader(rootDir);

var writeFile = f => {
  core.createContents(f).then(result => {
    var outPath = path.join(rootDir, f + '.d.ts');
    //console.log(outPath, result);
    fs.writeFile(outPath, result, 'utf8', (err) => {
      if(err) {
        console.error(err);
        return;
      }
      console.log('Wrote ' + outPath);
    });
  });
};

if(!argv.w) {
  glob(filesPattern, null, (err, files) => {
    if(err) {
      console.error(err);
      return;
    }
    if(!files || !files.length) return;
    files.forEach(f => writeFile(f));
  });
}else{
  console.log('Watch ' + filesPattern + '...');
  gaze(filesPattern, function(err, files) {
    this.on('changed', (absPath) => {
      var f = path.relative(rootDir, absPath);
      core.initLoader(rootDir);
      writeFile(f);
    });
    this.on('added', (absPath) => {
      var f = path.relative(rootDir, absPath);
      writeFile(f);
    });
  });
}
