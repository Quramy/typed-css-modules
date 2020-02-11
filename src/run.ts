import chalk from "chalk";
import * as chokidar from "chokidar";
import _glob from 'glob';
import * as path from "path";
import * as util from "util";
import {DtsContent} from "./dts-content";
import {DtsCreator} from "./dts-creator";

const glob = util.promisify(_glob);


interface RunOptions {
    pattern?: string;
    outDir?: string;
    watch?: boolean;
    camelCase?: boolean;
    dropExtension?: boolean;
    silent?: boolean;
    extension?: string;
}

export async function run(searchDir: string, options: RunOptions = {}): Promise<void> {
    const filesPattern = path.join(searchDir, options.pattern || '**/*.css');

    const creator = new DtsCreator({
        rootDir: process.cwd(),
        searchDir,
        outDir: options.outDir,
        camelCase: options.camelCase,
        dropExtension: options.dropExtension,
        extension: options.extension,
    });

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

    if (!options.watch) {
        const files = await glob(filesPattern);
        await Promise.all(files.map(writeFile));
    } else {
        console.log('Watch ' + filesPattern + '...');

        const watcher = chokidar.watch([filesPattern.replace(/\\/g, "/")]);
        watcher.on('add', writeFile);
        watcher.on('change', writeFile);
        await waitForever();
    }
}

async function waitForever(): Promise<void> {
    return new Promise<void>(() => {
    });
}
