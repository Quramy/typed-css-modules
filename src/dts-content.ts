import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import isThere from 'is-there';
import * as mkdirp from 'mkdirp';
import * as util from 'util';
import camelcase from 'camelcase';
import chalk from 'chalk';

const writeFile = util.promisify(fs.writeFile);
const readFile = util.promisify(fs.readFile);

export type CamelCaseOption = boolean | 'dashes' | undefined;

interface DtsContentOptions {
  dropExtension: boolean;
  rootDir: string;
  searchDir: string;
  outDir: string;
  rInputPath: string;
  rawTokenList: string[];
  namedExports: boolean;
  camelCase: CamelCaseOption;
  singleQuote?: boolean;
  EOL: string;
}

export class DtsContent {
  private dropExtension: boolean;
  private rootDir: string;
  private searchDir: string;
  private outDir: string;
  private rInputPath: string;
  private rawTokenList: string[];
  private namedExports: boolean;
  private camelCase: CamelCaseOption;
  private singleQuote?: boolean;
  private resultList: string[];
  private EOL: string;

  constructor(options: DtsContentOptions) {
    this.dropExtension = options.dropExtension;
    this.rootDir = options.rootDir;
    this.searchDir = options.searchDir;
    this.outDir = options.outDir;
    this.rInputPath = options.rInputPath;
    this.rawTokenList = options.rawTokenList;
    this.namedExports = options.namedExports;
    this.camelCase = options.camelCase;
    this.singleQuote = options.singleQuote;
    this.EOL = options.EOL;

    // when using named exports, camelCase must be enabled by default
    // (see https://webpack.js.org/loaders/css-loader/#namedexport)
    // we still accept external control for the 'dashes' option,
    // so we only override in case is false or undefined
    if (this.namedExports && !this.camelCase) {
      this.camelCase = true;
    }

    this.resultList = this.createResultList();
  }

  public get contents(): string[] {
    return this.resultList;
  }

  public get formatted(): string {
    if (!this.resultList || !this.resultList.length) return '';

    if (this.namedExports) {
      return (
        ['export const __esModule: true;', ...this.resultList.map(line => 'export ' + line), ''].join(os.EOL) + this.EOL
      );
    }

    const data = (
      ['declare const styles: {', ...this.resultList.map(line => '  ' + line), '};', 'export = styles;', ''].join(
        os.EOL,
      ) + this.EOL
    );

    return this.singleQuote ? data.replace(/\"/g, "'") : data;
  }

  public get tokens(): string[] {
    return this.rawTokenList;
  }

  public get outputFilePath(): string {
    return path.join(this.rootDir, this.outDir, this.outputFileName);
  }

  public get relativeOutputFilePath(): string {
    return path.join(this.outDir, this.outputFileName);
  }

  public get inputFilePath(): string {
    return path.join(this.rootDir, this.searchDir, this.rInputPath);
  }

  public get relativeInputFilePath(): string {
    return path.join(this.searchDir, this.rInputPath);
  }

  public async checkFile(postprocessor = (formatted: string) => formatted): Promise<boolean> {
    if (!isThere(this.outputFilePath)) {
      console.error(chalk.red(`[ERROR] Type file needs to be generated for '${this.relativeInputFilePath}'`));
      return false;
    }

    const finalOutput = postprocessor(this.formatted);
    const fileContent = (await readFile(this.outputFilePath)).toString();

    if (fileContent !== finalOutput) {
      console.error(chalk.red(`[ERROR] Check type definitions for '${this.relativeOutputFilePath}'`));
      return false;
    }
    return true;
  }

  public async writeFile(postprocessor = (formatted: string) => formatted): Promise<void> {
    const finalOutput = postprocessor(this.formatted);

    const outPathDir = path.dirname(this.outputFilePath);
    if (!isThere(outPathDir)) {
      mkdirp.sync(outPathDir);
    }

    let isDirty = false;

    if (!isThere(this.outputFilePath)) {
      isDirty = true;
    } else {
      const content = (await readFile(this.outputFilePath)).toString();

      if (content !== finalOutput) {
        isDirty = true;
      }
    }

    if (isDirty) {
      await writeFile(this.outputFilePath, finalOutput, 'utf8');
    }
  }

  private createResultList(): string[] {
    const convertKey = this.getConvertKeyMethod(this.camelCase);

    const result = this.rawTokenList
      .map(k => convertKey(k))
      .map(k => (!this.namedExports ? 'readonly "' + k + '": string;' : 'const ' + k + ': string;'));

    return result;
  }

  private getConvertKeyMethod(camelCaseOption: CamelCaseOption): (str: string) => string {
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
    return str.replace(/-+(\w)/g, function (match, firstLetter) {
      return firstLetter.toUpperCase();
    });
  }

  private get outputFileName(): string {
    const outputFileName = this.dropExtension ? removeExtension(this.rInputPath) : this.rInputPath;
    return outputFileName + '.d.ts';
  }
}

function removeExtension(filePath: string): string {
  const ext = path.extname(filePath);
  return filePath.replace(new RegExp(ext + '$'), '');
}
