import path from 'node:path';
import assert from 'node:assert';

import { DtsCreator } from './dts-creator';

describe('DtsContent', () => {
  describe('#tokens', () => {
    it('returns original tokens', async () => {
      const content = await new DtsCreator().create('fixtures/testStyle.css');
      assert.equal(content.tokens[0], 'myClass');
    });
  });

  describe('#inputFilePath', () => {
    it('returns original CSS file name', async () => {
      const content = await new DtsCreator().create(path.normalize('fixtures/testStyle.css'));
      assert.equal(path.relative(process.cwd(), content.inputFilePath), path.normalize('fixtures/testStyle.css'));
    });
  });

  describe('#relativeInputFilePath', () => {
    it('returns relative original CSS file name', async () => {
      const content = await new DtsCreator().create(path.normalize('fixtures/testStyle.css'));
      assert.equal(content.relativeInputFilePath, 'fixtures/testStyle.css');
    });
  });

  describe('#outputFilePath', () => {
    it('adds d.ts to the original filename', async () => {
      const content = await new DtsCreator().create(path.normalize('fixtures/testStyle.css'));
      assert.equal(path.relative(process.cwd(), content.outputFilePath), path.normalize('fixtures/testStyle.css.d.ts'));
    });

    it('can drop the original extension when asked', async () => {
      const content = await new DtsCreator({ dropExtension: true }).create(path.normalize('fixtures/testStyle.css'));
      assert.equal(path.relative(process.cwd(), content.outputFilePath), path.normalize('fixtures/testStyle.d.ts'));
    });
  });

  describe('#relativeOutputFilePath', () => {
    it('adds d.ts to the original filename', async () => {
      const content = await new DtsCreator().create(path.normalize('fixtures/testStyle.css'));
      assert.equal(
        path.relative(process.cwd(), content.relativeOutputFilePath),
        path.normalize('fixtures/testStyle.css.d.ts'),
      );
    });

    it('can drop the original extension when asked', async () => {
      const content = await new DtsCreator({ dropExtension: true }).create(path.normalize('fixtures/testStyle.css'));
      assert.equal(
        path.relative(process.cwd(), content.relativeOutputFilePath),
        path.normalize('fixtures/testStyle.d.ts'),
      );
    });
  });

  describe('#formatted', () => {
    it('returns formatted .d.ts string', async () => {
      const content = await new DtsCreator().create('fixtures/testStyle.css');
      assert.equal(
        content.formatted,
        `\
declare const styles: {
  readonly "myClass": string;
};
export = styles;

`,
      );
    });

    it('returns named exports formatted .d.ts string', async () => {
      const content = await new DtsCreator({ namedExports: true }).create('fixtures/testStyle.css');
      assert.equal(
        content.formatted,
        `\
export const __esModule: true;
export const myClass: string;

`,
      );
    });

    it('returns camelcase names when using named exports as formatted .d.ts string', async () => {
      const content = await new DtsCreator({ namedExports: true }).create('fixtures/kebabedUpperCase.css');
      assert.equal(
        content.formatted,
        `\
export const __esModule: true;
export const myClass: string;

`,
      );
    });

    it('returns empty object exportion when the result list has no items', async () => {
      const content = await new DtsCreator().create('fixtures/empty.css');
      assert.equal(content.formatted, 'export {};');
    });

    describe('#camelCase option', () => {
      it('camelCase == true: returns camelized tokens for lowercase classes', async () => {
        const content = await new DtsCreator({ camelCase: true }).create('fixtures/kebabed.css');
        assert.equal(
          content.formatted,
          `\
declare const styles: {
  readonly "myClass": string;
};
export = styles;

`,
        );
      });

      it('camelCase == true: returns camelized tokens for uppercase classes ', async () => {
        const content = await new DtsCreator({ camelCase: true }).create('fixtures/kebabedUpperCase.css');
        assert.equal(
          content.formatted,
          `\
declare const styles: {
  readonly "myClass": string;
};
export = styles;

`,
        );
      });

      it('camelCase == "dashes": returns camelized tokens for dashes only', async () => {
        const content = await new DtsCreator({ camelCase: 'dashes' }).create('fixtures/kebabedUpperCase.css');
        assert.equal(
          content.formatted,
          `\
declare const styles: {
  readonly "MyClass": string;
};
export = styles;

`,
        );
      });
    });
  });

  describe('#checkFile', () => {
    let mockExit: jest.SpyInstance;
    let mockConsoleLog: jest.SpyInstance;
    let mockConsoleError: jest.SpyInstance;

    beforeAll(() => {
      mockExit = jest.spyOn(process, 'exit').mockImplementation(exitCode => {
        throw new Error(`process.exit: ${exitCode}`);
      });
      mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
      mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    afterAll(() => {
      mockExit.mockRestore();
      mockConsoleLog.mockRestore();
      mockConsoleError.mockRestore();
    });

    it('return false if type file is missing', async () => {
      const content = await new DtsCreator().create('fixtures/empty.css');
      const result = await content.checkFile();
      assert.equal(result, false);
    });

    it('returns false if type file content is different', async () => {
      const content = await new DtsCreator().create('fixtures/different.css');
      const result = await content.checkFile();
      assert.equal(result, false);
    });

    it('returns true if type files match', async () => {
      const content = await new DtsCreator().create('fixtures/testStyle.css');
      const result = await content.checkFile();
      assert.equal(result, true);
    });
  });

  describe('#writeFile', () => {
    it('accepts a postprocessor sync function', async () => {
      const content = await new DtsCreator().create('fixtures/testStyle.css');
      await content.writeFile(formatted => `// this banner was added to the .d.ts file automatically.\n${formatted}`);
    });

    it('accepts a postprocessor async function', async () => {
      const content = await new DtsCreator().create('fixtures/testStyle.css');
      await content.writeFile(
        async formatted => `// this banner was added to the .d.ts file automatically.\n${formatted}`,
      );
    });

    it('writes a file', async () => {
      const content = await new DtsCreator().create('fixtures/testStyle.css');
      await content.writeFile();
    });
  });
  describe('#deleteFile', () => {
    it('delete a file', async () => {
      const content = await new DtsCreator().create('fixtures/none.css', undefined, false, true);
      await content.deleteFile();
    });
  });
});
