/* this file is forked from https://raw.githubusercontent.com/css-modules/css-modules-loader-core/master/src/file-system-loader.js */

import Core from 'css-modules-loader-core';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { Plugin } from 'postcss';

type Dictionary<T> = {
  [key: string]: T | undefined;
};

const readFile = util.promisify(fs.readFile);

export default class FileSystemLoader {
  private root: string;
  private sources: Dictionary<string>;
  private importNr: number;
  private core: Core;
  public tokensByFile: Dictionary<Core.ExportTokens>;

  constructor(root: string, plugins?: Array<Plugin<any>>) {
    this.root = root;
    this.sources = {};
    this.importNr = 0;
    this.core = new Core(plugins);
    this.tokensByFile = {};
  }

  public async fetch(
    _newPath: string,
    relativeTo: string,
    _trace?: string,
    initialContents?: string,
  ): Promise<Core.ExportTokens> {
    const newPath = _newPath.replace(/^["']|["']$/g, '');
    const trace = _trace || String.fromCharCode(this.importNr++);

    const relativeDir = path.dirname(relativeTo);
    const rootRelativePath = path.resolve(relativeDir, newPath);
    let fileRelativePath = path.resolve(path.join(this.root, relativeDir), newPath);

    const isNodeModule = (fileName: string) => fileName[0] !== '.' && fileName[0] !== '/';

    // if the path is not relative or absolute, try to resolve it in node_modules
    if (isNodeModule(newPath)) {
      try {
        fileRelativePath = require.resolve(newPath);
      } catch (e) {}
    }

    let source: string;

    if (!initialContents) {
      const tokens = this.tokensByFile[fileRelativePath];
      if (tokens) {
        return tokens;
      }

      try {
        source = await readFile(fileRelativePath, 'utf-8');
      } catch (error) {
        if (relativeTo && relativeTo !== '/') {
          return {};
        }

        throw error;
      }
    } else {
      source = initialContents;
    }

    const { injectableSource, exportTokens } = await this.core.load(
      source,
      rootRelativePath,
      trace,
      this.fetch.bind(this),
    );

    const re = new RegExp(/@import\s['"](\D+?)['"];/, 'gm');

    let importTokens: Core.ExportTokens = {};

    let result;

    while ((result = re.exec(injectableSource))) {
      const importFile = result?.[1];

      if (importFile) {
        let importFilePath = isNodeModule(importFile)
          ? importFile
          : path.resolve(path.dirname(fileRelativePath), importFile);

        const localTokens = await this.fetch(importFilePath, relativeTo, undefined, initialContents);
        Object.assign(importTokens, localTokens);
      }
    }

    const tokens = { ...exportTokens, ...importTokens };

    this.sources[trace] = injectableSource;
    this.tokensByFile[fileRelativePath] = tokens;
    return tokens;
  }
}
