#!/usr/bin/env node

'use strict';

import process from 'process';
import fs from 'fs';
import path from 'path';
import gaze from 'gaze';
import glob from 'glob';
import optimist from 'optimist';

import {DtsCreator} from './dtsCreator';

var argv = optimist.usage('Create .css.d.ts files. \nUsage: $0')
  .alias('d', 'directory').describe('d', 'Input directory includes .css files')
  .alias('w', 'watch').describe('w', 'Watch input directory')
  .argv;

var rootDir = process.cwd();
var createor = new DtsCreator({rootDir});
var filesPattern = path.join(argv.d, '**/*.css');

var writeFile = f => {
  createor.create(f).then(result => {
    var outPath = path.join(rootDir, f + '.d.ts');
    fs.writeFile(outPath, result, 'utf8', (err) => {
      if(err) {
        console.error(err);
        return;
      }
      console.log('Wrote ' + outPath);
    });
  }).catch(err => console.error(err));
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
      writeFile(f);
    });
    this.on('added', (absPath) => {
      var f = path.relative(rootDir, absPath);
      writeFile(f);
    });
  });
}

