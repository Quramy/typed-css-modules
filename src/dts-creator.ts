import * as process from 'process';
import * as path from 'path';
import * as os from 'os';
import camelcase from 'camelcase';
import FileSystemLoader from './file-system-loader';
import { DtsContent } from './dts-content';
import { Plugin } from 'postcss';

type CamelCaseOption = boolean | 'dashes' | undefined;

interface DtsCreatorOptions {
  rootDir?: string;
  searchDir?: string;
  outDir?: string;
  camelCase?: CamelCaseOption;
  singleQuote?: boolean;
  dropExtension?: boolean;
  EOL?: string;
  loaderPlugins?: Plugin<any>[];
}

export class DtsCreator {
  private rootDir: string;
  private searchDir: string;
  private outDir: string;
  private loader: FileSystemLoader;
  private inputDirectory: string;
  private outputDirectory: string;
  private singleQuote?: boolean;
  private camelCase: boolean | 'dashes' | undefined;
  private dropExtension: boolean;
  private EOL: string;

  constructor(options?: DtsCreatorOptions) {
    if (!options) options = {};
    this.rootDir = options.rootDir || process.cwd();
    this.searchDir = options.searchDir || '';
    this.outDir = options.outDir || this.searchDir;
    this.loader = new FileSystemLoader(this.rootDir, options.loaderPlugins);
    this.inputDirectory = path.join(this.rootDir, this.searchDir);
    this.outputDirectory = path.join(this.rootDir, this.outDir);
    this.singleQuote = options.singleQuote;
    this.camelCase = options.camelCase;
    this.dropExtension = !!options.dropExtension;
    this.EOL = options.EOL || os.EOL;
  }

  public async create(
    filePath: string,
    initialContents?: string,
    clearCache: boolean = false
  ): Promise<DtsContent> {
    let rInputPath: string;
    if (path.isAbsolute(filePath)) {
      rInputPath = path.relative(this.inputDirectory, filePath);
    } else {
      rInputPath = path.relative(
        this.inputDirectory,
        path.join(process.cwd(), filePath)
      );
    }
    if (clearCache) {
      this.loader.tokensByFile = {};
    }

    const res = await this.loader.fetch(
      filePath,
      '/',
      undefined,
      initialContents
    );
    if (res) {
      const tokens = res;
      const keys = Object.keys(tokens);

      const convertKey = this.getConvertKeyMethod(this.camelCase);

      const result = keys
        .map(k => convertKey(k))
        .map(k => `readonly ${k.includes('-') ? `"${k}"` : k}: string;`);

      const content = new DtsContent({
        dropExtension: this.dropExtension,
        singleQuote: this.singleQuote,
        rootDir: this.rootDir,
        searchDir: this.searchDir,
        outDir: this.outDir,
        rInputPath,
        rawTokenList: keys,
        resultList: result,
        EOL: this.EOL
      });

      return content;
    } else {
      throw res;
    }
  }

  private getConvertKeyMethod(
    camelCaseOption: CamelCaseOption
  ): (str: string) => string {
    switch (camelCaseOption) {
      case true:
        return camelcase;
      case 'dashes':
        return this.dashesCamelCase;
      default:
        return key => key;
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
