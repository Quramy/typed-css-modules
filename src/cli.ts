#!/usr/bin/env node

import * as path from 'path';
import * as chokidar from 'chokidar';
import glob from 'glob';
import * as yargs from 'yargs';
import chalk from 'chalk';
import {DtsCreator} from './dtsCreator';

let yarg = yargs.usage('Create .css.d.ts from CSS modules *.css files.\nUsage: $0 [options] <input directory>')
  .example('$0 src/styles', '')
  .example('$0 src -o dist', '')
  .example('$0 -p styles/**/*.icss -w', '')
  .detectLocale(false)
  .demand(['_'])
  .alias('c', 'camelCase').describe('c', 'Convert CSS class tokens to camelcase')
  .alias('o', 'outDir').describe('o', 'Output directory')
  .alias('p', 'pattern').describe('p', 'Glob pattern with css files')
  .alias('w', 'watch').describe('w', 'Watch input directory\'s css files or pattern').boolean('w')
  .alias('d', 'dropExtension').describe('d', 'Drop the input files extension').boolean('d')
  .alias('s', 'silent').describe('s', 'Silent output. Do not show "files written" messages').boolean('s')
  .alias('h', 'help').help('h')
  .version(() => require('../package.json').version);
let argv = yarg.argv;
let creator: DtsCreator;

function writeFile(f: string) {
  creator.create(f, undefined, !!argv.w)
  .then(content => content.writeFile())
  .then(content => {
    if (!argv.s) {
      console.log('Wrote ' + chalk.green(content.outputFilePath));
    }
  })
  .catch((reason: unknown) => console.error(chalk.red('[Error] ' + reason)));
};

let main = () => {
  let rootDir, searchDir;
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
  creator = new DtsCreator({
    rootDir,
    searchDir,
    outDir: argv.o,
    camelCase: argv.c,
    dropExtension: argv.d
  });

  if(!argv.w) {
    glob(filesPattern, {}, (err, files) => {
      if(err) {
        console.error(err);
        return;
      }
      if(!files || !files.length) return;
      files.forEach(writeFile);
    });
  } else {
    console.log('Watch ' + filesPattern + '...');

    var watcher = chokidar.watch([filesPattern.replace(/\\/g, "/")]);
    watcher.on('add', writeFile);
    watcher.on('change', writeFile);
  }
};

main();
