import * as path from 'path';
import * as util from 'util';
import chalk from 'chalk';
import * as chokidar from 'chokidar';
import _glob from 'glob';
import { DtsCreator } from './dts-creator';
import { DtsContent } from './dts-content';

const glob = util.promisify(_glob);

interface RunOptions {
  pattern?: string;
  outDir?: string;
  watch?: boolean;
  camelCase?: boolean;
  singleQuote?: boolean;
  namedExports?: boolean;
  dropExtension?: boolean;
  silent?: boolean;
  listDifferent?: boolean;
}

export async function run(searchDir: string, options: RunOptions = {}): Promise<void> {
  const filesPattern = path.join(searchDir, options.pattern || '**/*.css');

  const creator = new DtsCreator({
    rootDir: process.cwd(),
    searchDir,
    outDir: options.outDir,
    camelCase: options.camelCase,
    singleQuote: options.singleQuote,
    namedExports: options.namedExports,
    dropExtension: options.dropExtension,
  });

  const checkFile = async (f: string): Promise<boolean> => {
    try {
      const content: DtsContent = await creator.create(f, undefined, false);
      return await content.checkFile();
    } catch (error) {
      console.error(chalk.red(`[ERROR] An error occurred checking '${f}':\n${error}`));
      return false;
    }
  };

  const writeFile = async (f: string): Promise<void> => {
    try {
      const content: DtsContent = await creator.create(f, undefined, !!options.watch);
      await content.writeFile();

      if (!options.silent) {
        console.log('Wrote ' + chalk.green(content.outputFilePath));
      }
    } catch (error) {
      console.error(chalk.red('[Error] ' + error));
    }
  };

  if (options.listDifferent) {
    const files = await glob(filesPattern);
    const hasErrors = (await Promise.all(files.map(checkFile))).includes(false);
    if (hasErrors) {
      process.exit(1);
    }
    return;
  }

  if (!options.watch) {
    const files = await glob(filesPattern);
    await Promise.all(files.map(writeFile));
  } else {
    console.log('Watch ' + filesPattern + '...');

    const watcher = chokidar.watch([filesPattern.replace(/\\/g, '/')]);
    watcher.on('add', writeFile);
    watcher.on('change', writeFile);
    await waitForever();
  }
}

async function waitForever(): Promise<void> {
  return new Promise<void>(() => {});
}
