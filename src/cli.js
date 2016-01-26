#!/usr/bin/env node

'use strict';

import process from 'process';
import fs from 'fs';
import isThere from 'is-there';
import mkdirp from 'mkdirp';
import path from 'path';
import gaze from 'gaze';
import glob from 'glob';
import yargs from 'yargs';

import {DtsCreator} from './dtsCreator';

let yarg = yargs.usage('Create .css.d.ts from CSS modules *.css files.\nUsage: $0 [options] <input directory>')
  .example('$0 src/styles')
  .example('$0 src -o dist')
  .example('$0 -p styles/**/*.icss -w')
  .detectLocale(false)
  .demand(['_'])
  .alias('o', 'outDir').describe('o', 'Output directory')
  .alias('p', 'pattern').describe('p', 'Glob pattern with css files')
  .alias('w', 'watch').describe('w', 'Watch input directory\'s css files or pattern').boolean('w')
  .alias('h', 'help').help('h')
let argv = yarg.argv;

let rootDir, searchDir;
let creator;
let writeFile = f => {
  creator.create(f).then(result => {
    var od = argv.o ? path.join(rootDir, argv.o) : rootDir;
    var relativePath = path.relative(searchDir, f);
    var outPath = path.join(od, relativePath + '.d.ts');
    var outPathDir = path.join(od, path.dirname(relativePath));
    if(!isThere(outPathDir)) {
      mkdirp.sync(outPathDir);
    }
    fs.writeFile(outPath, result, 'utf8', (err) => {
      if(err) {
        console.error(err);
        return;
      }
      console.log('Wrote ' + outPath);
    });
  }).catch(err => console.error(err));
};

let main = () => {
  if(argv.h) {
    yarg.showHelp();
    return;
  }

  if(argv._ && argv._[0]) {
    searchDir = argv._[0];
  }else if(argv.p) {
    searchDir = './';
  }else{
    yarg.showHelp();
    return;
  }

  let filesPattern = path.join(searchDir, argv.p || '**/*.css');
  rootDir = process.cwd();
  creator = new DtsCreator({rootDir});

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
        let f = path.relative(rootDir, absPath);
        writeFile(f);
      });
      this.on('added', (absPath) => {
        let f = path.relative(rootDir, absPath);
        writeFile(f);
      });
    });
  }
};

main();

