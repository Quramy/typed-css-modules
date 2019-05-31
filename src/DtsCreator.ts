import * as process from 'process';
import * as path from'path';
import * as os from 'os';
import camelcase from "camelcase"
import FileSystemLoader from './FileSystemLoader';
import {DtsContent} from "./DtsContent";


type CamelCaseOption = boolean | 'dashes' | undefined;

interface DtsCreatorOptions {
  rootDir?: string;
  searchDir?: string;
  outDir?: string;
  camelCase?: CamelCaseOption;
  dropExtension?: boolean;
  EOL?: string;
}

export class DtsCreator {
  private rootDir: string;
  private searchDir: string;
  private outDir: string;
  private loader: FileSystemLoader;
  private inputDirectory: string;
  private outputDirectory: string;
  private camelCase: boolean | 'dashes' | undefined;
  private dropExtension: boolean;
  private EOL: string;

  constructor(options?: DtsCreatorOptions) {
    if(!options) options = {};
    this.rootDir = options.rootDir || process.cwd();
    this.searchDir = options.searchDir || '';
    this.outDir = options.outDir || this.searchDir;
    this.loader = new FileSystemLoader(this.rootDir);
    this.inputDirectory = path.join(this.rootDir, this.searchDir);
    this.outputDirectory = path.join(this.rootDir, this.outDir);
    this.camelCase = options.camelCase;
    this.dropExtension = !!options.dropExtension;
    this.EOL = options.EOL || os.EOL;
  }

  create(filePath: string, initialContents?: string, clearCache: boolean = false): Promise<DtsContent> {
    return new Promise((resolve, reject) => {
      let rInputPath: string;
      if(path.isAbsolute(filePath)) {
        rInputPath = path.relative(this.inputDirectory, filePath);
      }else{
        rInputPath = path.relative(this.inputDirectory, path.join(process.cwd(), filePath));
      }
      if(clearCache) {
        this.loader.tokensByFile = {};
      }
      this.loader.fetch(filePath, "/", undefined, initialContents).then((res) => {
        if(res) {
          var tokens = res;
          var keys = Object.keys(tokens);

          var convertKey = this.getConvertKeyMethod(this.camelCase);

          var result = keys
            .map(k => convertKey(k))
            .map(k => 'readonly "' + k + '": string;')

          var content = new DtsContent({
            dropExtension: this.dropExtension,
            rootDir: this.rootDir,
            searchDir: this.searchDir,
            outDir: this.outDir,
            rInputPath,
            rawTokenList: keys,
            resultList: result,
            EOL: this.EOL
          });

          resolve(content);
        }else{
          reject(res);
        }
      }).catch(err => reject(err));
    });
  }

  private getConvertKeyMethod(camelCaseOption: CamelCaseOption): (str: string) => string {
    switch (camelCaseOption) {
      case true:
        return camelcase;
      case 'dashes':
        return this.dashesCamelCase;
      default:
        return (key) => key;
    }
  }

  /**
   * Replaces only the dashes and leaves the rest as-is.
   *
   * Mirrors the behaviour of the css-loader:
   * https://github.com/webpack-contrib/css-loader/blob/1fee60147b9dba9480c9385e0f4e581928ab9af9/lib/compile-exports.js#L3-L7
   */
  private dashesCamelCase(str: string): string {
    return str.replace(/-+(\w)/g, function(match, firstLetter) {
      return firstLetter.toUpperCase();
    });
  }


}
