import path from 'node:path';
import isThere from 'is-there';
import { rimraf } from 'rimraf';
import { run } from './run';

describe(run, () => {
  let mockConsoleLog: jest.SpyInstance;

  beforeAll(() => {
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
  });

  beforeEach(async () => {
    await rimraf('example/style01.css.d.ts');
  });

  afterAll(() => {
    mockConsoleLog.mockRestore();
  });

  it('generates type definition files', async () => {
    await run('example', { watch: false });
    expect(isThere(path.normalize('example/style01.css.d.ts'))).toBeTruthy();
  });
});
