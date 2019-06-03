/* this file is forked from https://raw.githubusercontent.com/css-modules/css-modules-loader-core/master/src/file-system-loader.js */

import Core from 'css-modules-loader-core'
import * as fs from 'fs'
import * as path from 'path'
import { Plugin } from "postcss";

// Sorts dependencies in the following way:
// AAA comes before AA and A
// AB comes after AA and before A
// All Bs come after all As
// This ensures that the files are always returned in the following order:
// - In the order they were required, except
// - After all their dependencies
const traceKeySorter = ( a: string, b: string ): number => {
  if ( a.length < b.length ) {
    return a < b.substring( 0, a.length ) ? -1 : 1
  } else if ( a.length > b.length ) {
    return a.substring( 0, b.length ) <= b ? -1 : 1
  } else {
    return a < b ? -1 : 1
  }
};

export type Dictionary<T> = {
  [key: string]: T | undefined;
};

export default class FileSystemLoader {
  private root: string;
  private sources: Dictionary<string>;
  private importNr: number;
  private core: Core;
  public tokensByFile: Dictionary<Core.ExportTokens>;

  constructor( root: string, plugins?: Array<Plugin<any>> ) {
    this.root = root
    this.sources = {}
    this.importNr = 0
    this.core = new Core(plugins)
    this.tokensByFile = {};
  }

  public fetch( _newPath: string, relativeTo: string, _trace?: string, initialContents?: string ): Promise<Core.ExportTokens> {
    let newPath = _newPath.replace( /^["']|["']$/g, "" ),
      trace = _trace || String.fromCharCode( this.importNr++ )
    return new Promise( ( resolve, reject ) => {
      let relativeDir = path.dirname( relativeTo ),
        rootRelativePath = path.resolve( relativeDir, newPath ),
        fileRelativePath = path.resolve( path.join( this.root, relativeDir ), newPath )

      // if the path is not relative or absolute, try to resolve it in node_modules
      if (newPath[0] !== '.' && newPath[0] !== '/') {
        try {
          fileRelativePath = require.resolve(newPath);
        }
        catch (e) {}
      }

      if(!initialContents) {
        const tokens = this.tokensByFile[fileRelativePath]
        if (tokens) { return resolve(tokens) }

        fs.readFile( fileRelativePath, "utf-8", ( err, source ) => {
          if ( err && relativeTo && relativeTo !== '/') {
            resolve({});
          }else if ( err && (!relativeTo || relativeTo === '/')) {
            reject(err);
          }else{
            this.core.load( source, rootRelativePath, trace, this.fetch.bind( this ) )
            .then( ( { injectableSource, exportTokens } ) => {
              this.sources[trace] = injectableSource
              this.tokensByFile[fileRelativePath] = exportTokens
              resolve( exportTokens )
            }, reject )
          }
        } )
      }else{
        this.core.load( initialContents, rootRelativePath, trace, this.fetch.bind(this) )
        .then( ( { injectableSource, exportTokens } ) => {
          this.sources[trace] = injectableSource
          this.tokensByFile[fileRelativePath] = exportTokens
          resolve( exportTokens )
        }, reject )
      }
    } )
  }

  private get finalSource(): string {
    return Object.keys( this.sources ).sort( traceKeySorter ).map( s => this.sources[s] )
    .join( "" )
  }

  private clear(): FileSystemLoader {
    this.tokensByFile = {};
    return this;
  }
}
