import path from 'node:path';
import fs from 'node:fs';
import isThere from 'is-there';
import { rimraf } from 'rimraf';
import { run } from './run';

describe(run, () => {
  beforeEach(async () => {
    await rimraf('example/style01.css.d.ts');
  });

  it('generates type definition files', async () => {
    await run('example', { watch: false });
    expect(isThere(path.normalize('example/style01.css.d.ts'))).toBeTruthy();
  });
});
