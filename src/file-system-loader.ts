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
    initialContents?: string
  ): Promise<Core.ExportTokens> {
    const newPath = _newPath.replace(/^["']|["']$/g, '');
    const trace = _trace || String.fromCharCode(this.importNr++);

    const relativeDir = path.dirname(relativeTo);
    const rootRelativePath = path.resolve(relativeDir, newPath);
    let fileRelativePath = path.resolve(
      path.join(this.root, relativeDir),
      newPath
    );

    // if the path is not relative or absolute, try to resolve it in node_modules
    if (newPath[0] !== '.' && newPath[0] !== '/') {
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
      this.fetch.bind(this)
    );
    this.sources[trace] = injectableSource;
    this.tokensByFile[fileRelativePath] = exportTokens;
    return exportTokens;
  }
}
