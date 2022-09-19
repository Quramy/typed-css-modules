'use strict';

import * as path from 'path';

import * as assert from 'assert';
import { DtsCreator } from '../src/dts-creator';
import SpyInstance = jest.SpyInstance;

describe('DtsCreator', () => {
  var creator = new DtsCreator();

  describe('#create', () => {
    it('returns DtsContent instance simple css', done => {
      creator.create('test/testStyle.css').then(content => {
        assert.equal(content.contents.length, 1);
        assert.equal(content.contents[0], 'readonly "myClass": string;');
        done();
      });
    });
    it('rejects an error with invalid CSS', done => {
      creator
        .create('test/errorCss.css')
        .then(content => {
          assert.fail();
        })
        .catch(err => {
          assert.equal(err.name, 'CssSyntaxError');
          done();
        });
    });
    it('returns DtsContent instance from composing css', done => {
      creator.create('test/composer.css').then(content => {
        assert.equal(content.contents.length, 1);
        assert.equal(content.contents[0], 'readonly "root": string;');
        done();
      });
    });
    it('returns DtsContent instance from composing css whose has invalid import/composes', done => {
      creator.create('test/invalidComposer.scss').then(content => {
        assert.equal(content.contents.length, 1);
        assert.equal(content.contents[0], 'readonly "myClass": string;');
        done();
      });
    });
    it('returns DtsContent instance from the pair of path and contents', done => {
      creator.create('test/somePath', `.myClass { color: red }`).then(content => {
        assert.equal(content.contents.length, 1);
        assert.equal(content.contents[0], 'readonly "myClass": string;');
        done();
      });
    });
    it('returns DtsContent instance combined css', done => {
      creator.create('test/combined/combined.css').then(content => {
        assert.equal(content.contents.length, 3);
        assert.equal(content.contents[0], 'readonly "block": string;');
        assert.equal(content.contents[1], 'readonly "myClass": string;');
        assert.equal(content.contents[2], 'readonly "box": string;');
        done();
      });
    });
  });

  describe('#modify path', () => {
    it('can be set outDir', done => {
      new DtsCreator({ searchDir: 'test', outDir: 'dist' })
        .create(path.normalize('test/testStyle.css'))
        .then(content => {
          assert.equal(path.relative(process.cwd(), content.outputFilePath), path.normalize('dist/testStyle.css.d.ts'));
          done();
        });
    });
  });
});

describe('DtsContent', () => {
  describe('#tokens', () => {
    it('returns original tokens', done => {
      new DtsCreator().create('test/testStyle.css').then(content => {
        assert.equal(content.tokens[0], 'myClass');
        done();
      });
    });
  });

  describe('#inputFilePath', () => {
    it('returns original CSS file name', done => {
      new DtsCreator().create(path.normalize('test/testStyle.css')).then(content => {
        assert.equal(path.relative(process.cwd(), content.inputFilePath), path.normalize('test/testStyle.css'));
        done();
      });
    });
  });

  describe('#relativeInputFilePath', () => {
    it('returns relative original CSS file name', done => {
      new DtsCreator().create(path.normalize('test/testStyle.css')).then(content => {
        assert.equal(content.relativeInputFilePath, 'test/testStyle.css');
        done();
      });
    });
  });

  describe('#outputFilePath', () => {
    it('adds d.ts to the original filename', done => {
      new DtsCreator().create(path.normalize('test/testStyle.css')).then(content => {
        assert.equal(path.relative(process.cwd(), content.outputFilePath), path.normalize('test/testStyle.css.d.ts'));
        done();
      });
    });

    it('can drop the original extension when asked', done => {
      new DtsCreator({ dropExtension: true }).create(path.normalize('test/testStyle.css')).then(content => {
        assert.equal(path.relative(process.cwd(), content.outputFilePath), path.normalize('test/testStyle.d.ts'));
        done();
      });
    });
  });

  describe('#relativeOutputFilePath', () => {
    it('adds d.ts to the original filename', done => {
      new DtsCreator().create(path.normalize('test/testStyle.css')).then(content => {
        assert.equal(
          path.relative(process.cwd(), content.relativeOutputFilePath),
          path.normalize('test/testStyle.css.d.ts'),
        );
        done();
      });
    });

    it('can drop the original extension when asked', done => {
      new DtsCreator({ dropExtension: true }).create(path.normalize('test/testStyle.css')).then(content => {
        assert.equal(
          path.relative(process.cwd(), content.relativeOutputFilePath),
          path.normalize('test/testStyle.d.ts'),
        );
        done();
      });
    });
  });

  describe('#formatted', () => {
    it('returns formatted .d.ts string', done => {
      new DtsCreator().create('test/testStyle.css').then(content => {
        assert.equal(
          content.formatted,
          `\
declare const styles: {
  readonly "myClass": string;
};
export = styles;

`,
        );
        done();
      });
    });

    it('returns named exports formatted .d.ts string', done => {
      new DtsCreator({ namedExports: true }).create('test/testStyle.css').then(content => {
        assert.equal(
          content.formatted,
          `\
export const __esModule: true;
export const myClass: string;

`,
        );
        done();
      });
    });

    it('returns camelcase names when using named exports as formatted .d.ts string', done => {
      new DtsCreator({ namedExports: true }).create('test/kebabedUpperCase.css').then(content => {
        assert.equal(
          content.formatted,
          `\
export const __esModule: true;
export const myClass: string;

`,
        );
        done();
      });
    });

    it('returns empty object exportion when the result list has no items', done => {
      new DtsCreator().create('test/empty.css').then(content => {
        assert.equal(content.formatted, '');
        done();
      });
    });

    describe('#camelCase option', () => {
      it('camelCase == true: returns camelized tokens for lowercase classes', done => {
        new DtsCreator({ camelCase: true }).create('test/kebabed.css').then(content => {
          assert.equal(
            content.formatted,
            `\
declare const styles: {
  readonly "myClass": string;
};
export = styles;

`,
          );
          done();
        });
      });

      it('camelCase == true: returns camelized tokens for uppercase classes ', done => {
        new DtsCreator({ camelCase: true }).create('test/kebabedUpperCase.css').then(content => {
          assert.equal(
            content.formatted,
            `\
declare const styles: {
  readonly "myClass": string;
};
export = styles;

`,
          );
          done();
        });
      });

      it('camelCase == "dashes": returns camelized tokens for dashes only', done => {
        new DtsCreator({ camelCase: 'dashes' }).create('test/kebabedUpperCase.css').then(content => {
          assert.equal(
            content.formatted,
            `\
declare const styles: {
  readonly "MyClass": string;
};
export = styles;

`,
          );
          done();
        });
      });
    });

    describe('#singleQuote option', () => {
      it('singleQuote == undefined: returns same as before', done => {
        new DtsCreator().create('test/kebabed.css').then(content => {
          assert.equal(
            content.formatted,
            `\
declare const styles: {
  readonly "my-class": string;
};
export = styles;

`,
          );
          done();
        });
      });

      it('singleQuote == true: returns kebab keys with single quote', done => {
        new DtsCreator({ singleQuote: true, EOL: '\n' }).create('test/kebabedUpperCase.css').then(content => {
          assert.equal(
            content.formatted,
            `\
declare const styles: {
  readonly 'My-class': string;
};
export = styles;

`,
          );
          done();
        });
      });
    });
  });

  describe('#checkFile', () => {
    let mockExit: SpyInstance;
    let mockConsoleLog: SpyInstance;
    let mockConsoleError: SpyInstance;

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

    it('return false if type file is missing', done => {
      new DtsCreator()
        .create('test/empty.css')
        .then(content => {
          return content.checkFile();
        })
        .then(result => {
          assert.equal(result, false);
          done();
        });
    });

    it('returns false if type file content is different', done => {
      new DtsCreator()
        .create('test/different.css')
        .then(content => {
          return content.checkFile();
        })
        .then(result => {
          assert.equal(result, false);
          done();
        });
    });

    it('returns true if type files match', done => {
      new DtsCreator()
        .create('test/testStyle.css')
        .then(content => {
          return content.checkFile();
        })
        .then(result => {
          assert.equal(result, true);
          done();
        });
    });
  });

  describe('#writeFile', () => {
    it('accepts a postprocessor function', done => {
      new DtsCreator()
        .create('test/testStyle.css')
        .then(content => {
          return content.writeFile(
            formatted => `// this banner was added to the .d.ts file automatically.\n${formatted}`,
          );
        })
        .then(() => {
          done();
        });
    });

    it('writes a file', done => {
      new DtsCreator()
        .create('test/testStyle.css')
        .then(content => {
          return content.writeFile();
        })
        .then(() => {
          done();
        });
    });
  });
});
