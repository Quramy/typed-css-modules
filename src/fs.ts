import * as fs from 'fs';


export function readFile(path: fs.PathLike): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        fs.readFile(path, 'utf-8', (err, data) => {
            if (err !== null) {
                reject(err);
                return;
            }

            resolve(data);
        });
    });
}

export function writeFile(path: fs.PathLike, data: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        fs.writeFile(path, data, 'utf-8', (err) => {
            if (err !== null) {
                reject(err);
                return;
            }

            resolve();
        });
    });
}
