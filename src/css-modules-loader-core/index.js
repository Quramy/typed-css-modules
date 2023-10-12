// Copied from https://github.com/css-modules/css-modules-loader-core

import postcss from 'postcss';
import localByDefault from 'postcss-modules-local-by-default';
import extractImports from 'postcss-modules-extract-imports';
import scope from 'postcss-modules-scope';
import values from 'postcss-modules-values';

import Parser from './parser';

export default class Core {
  constructor(plugins) {
    this.plugins = plugins || Core.defaultPlugins;
  }

  load(sourceString, sourcePath, trace, pathFetcher) {
    let parser = new Parser(pathFetcher, trace);

    return postcss(this.plugins.concat([parser.plugin]))
      .process(sourceString, { from: '/' + sourcePath })
      .then(result => {
        return {
          injectableSource: result.css,
          exportTokens: parser.exportTokens,
        };
      });
  }
}

Core.defaultPlugins = [values, localByDefault, extractImports, scope];
