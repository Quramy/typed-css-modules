import chalk from 'chalk';
import chokidar from 'chokidar';
import { glob } from 'glob';
import { minimatch } from 'minimatch';

import { DtsCreator } from './dts-creator';
import { DtsContent } from './dts-content';

interface RunOptions {
  pattern?: string;
  outDir?: string;
  watch?: boolean;
  camelCase?: boolean;
  namedExports?: boolean;
  allowArbitraryExtensions?: boolean;
  dropExtension?: boolean;
  silent?: boolean;
  listDifferent?: boolean;
}

export async function run(searchDir: string, options: RunOptions = {}): Promise<void> {
  const filesPattern = searchDir.replace(/\\/g, '/') + '/' + (options.pattern || '**/*.css');

  const creator = new DtsCreator({
    rootDir: process.cwd(),
    searchDir,
    outDir: options.outDir,
    camelCase: options.camelCase,
    namedExports: options.namedExports,
    allowArbitraryExtensions: options.allowArbitraryExtensions,
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
      // If we're watching recheck the file against the pattern since
      // chokidar does not filter files inside symlinks and we don't
      // know (without checking every parent) if the file is inside a
      // symlink.
      //
      // Chokidar issue:
      //
      //   https://github.com/paulmillr/chokidar/issues/967
      //
      // When that's fixed this can be removed (from deleteFile too),
      // but the issue is 2 years old already (reported 2020).
      if (!!options.watch && !minimatch(f, filesPattern)) {
        return;
      }

      const content: DtsContent = await creator.create(f, undefined, !!options.watch);
      await content.writeFile();

      if (!options.silent) {
        console.log('Wrote ' + chalk.green(content.outputFilePath));
      }
    } catch (error) {
      console.error(chalk.red('[Error] ' + error));
    }
  };

  const deleteFile = async (f: string): Promise<void> => {
    try {
      // Recheck patterh, see writeFile for explanation.
      if (!!options.watch && !minimatch(f, filesPattern)) {
        return;
      }

      const content: DtsContent = await creator.create(f, undefined, !!options.watch, true);

      await content.deleteFile();

      console.log('Delete ' + chalk.green(content.outputFilePath));
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

    const watcher = chokidar.watch([filesPattern]);
    watcher.on('add', writeFile);
    watcher.on('change', writeFile);
    watcher.on('unlink', deleteFile);
    await waitForever();
  }
}

async function waitForever(): Promise<void> {
  return new Promise<void>(() => {});
}
