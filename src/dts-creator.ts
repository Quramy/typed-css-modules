import * as process from 'process';
import * as path from 'path';
import * as os from 'os';
import FileSystemLoader from './file-system-loader';
import { DtsContent, CamelCaseOption } from './dts-content';
import { Plugin } from 'postcss';

interface DtsCreatorOptions {
  rootDir?: string;
  searchDir?: string;
  outDir?: string;
  camelCase?: CamelCaseOption;
  singleQuote?: boolean;
  namedExports?: boolean;
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
  private camelCase: CamelCaseOption;
  private singleQuote?: boolean;
  private namedExports: boolean;
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
    this.namedExports = !!options.namedExports;
    this.dropExtension = !!options.dropExtension;
    this.EOL = options.EOL || os.EOL;
  }

  public async create(filePath: string, initialContents?: string, clearCache: boolean = false): Promise<DtsContent> {
    let rInputPath: string;
    if (path.isAbsolute(filePath)) {
      rInputPath = path.relative(this.inputDirectory, filePath);
    } else {
      rInputPath = path.relative(this.inputDirectory, path.join(process.cwd(), filePath));
    }
    if (clearCache) {
      this.loader.tokensByFile = {};
    }

    const res = await this.loader.fetch(filePath, '/', undefined, initialContents);
    if (res) {
      const tokens = res;
      const keys = Object.keys(tokens);

      const content = new DtsContent({
        dropExtension: this.dropExtension,
        singleQuote: this.singleQuote,
        rootDir: this.rootDir,
        searchDir: this.searchDir,
        outDir: this.outDir,
        rInputPath,
        rawTokenList: keys,
        namedExports: this.namedExports,
        camelCase: this.camelCase,
        EOL: this.EOL,
      });

      return content;
    } else {
      throw res;
    }
  }
}
