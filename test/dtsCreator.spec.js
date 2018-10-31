'use strict';

var path = require('path');
var assert = require('assert');
var DtsCreator = require('../lib/dtsCreator').DtsCreator;
var os = require('os');

describe('DtsCreator', () => {
  var creator = new DtsCreator();

  describe('#create', () => {
    it('returns DtsContent instance simple css', done => {
      creator.create('test/testStyle.css').then(content => {
        assert.equal(content.contents.length, 1);
        assert.equal(content.contents[0], "export const myClass: string;")
        done();
      });
    });
    it('rejects an error with invalid CSS', done => {
      creator.create('test/errorCss.css').then(content => {
        assert.fail();
      }).catch(err => {
        assert.equal(err.name, 'CssSyntaxError');
        done();
      });
    });
    it('returns DtsContent instance from composing css', done => {
      creator.create('test/composer.css').then(content => {
        assert.equal(content.contents.length, 1);
        assert.equal(content.contents[0], "export const root: string;")
        done();
      });
    })
    it('returns DtsContent instance from composing css whose has invalid import/composes', done => {
      creator.create('test/invalidComposer.scss').then(content => {
        assert.equal(content.contents.length, 1);
        assert.equal(content.contents[0], "export const myClass: string;")
        done();
      });
    });
    it('returns DtsContent instance from the pair of path and contents', done => {
      creator.create('test/somePath', `.myClass { color: red }`).then(content => {
        assert.equal(content.contents.length, 1);
        assert.equal(content.contents[0], "export const myClass: string;")
        done();
      });
    });
  });

  describe('#modify path', () => {
    it('can be set outDir', done => {
      new DtsCreator({searchDir: "test", outDir: "dist"}).create(path.normalize('test/testStyle.css')).then(content => {
        assert.equal(path.relative(process.cwd(), content.outputFilePath), path.normalize("dist/testStyle.css.d.ts"));
        done();
      });
    });
  });

});

describe('DtsContent', () => {

  describe('#tokens', () => {
    it('returns original tokens', done => {
      new DtsCreator().create('test/testStyle.css').then(content => {
        assert.equal(content.tokens[0], "myClass");
        done();
      });
    });
  });

  describe('#inputFilePath', () => {
    it('returns original CSS file name', done => {
      new DtsCreator().create(path.normalize('test/testStyle.css')).then(content => {
        assert.equal(path.relative(process.cwd(), content.inputFilePath), path.normalize("test/testStyle.css"));
        done();
      });
    });
  });

  describe('#outputFilePath', () => {
    it('adds d.ts to the original filename', done => {
      new DtsCreator().create(path.normalize('test/testStyle.css')).then(content => {
        assert.equal(path.relative(process.cwd(), content.outputFilePath), path.normalize("test/testStyle.css.d.ts"));
        done();
      });
    });

    it('can drop the original extension when asked', done => {
      new DtsCreator({dropExtension: true}).create(path.normalize('test/testStyle.css')).then(content => {
        assert.equal(path.relative(process.cwd(), content.outputFilePath), path.normalize("test/testStyle.d.ts"));
        done();
      });
    });
  });

  describe('#formatted', () => {
    it('returns formatted .d.ts string', done => {
      new DtsCreator().create('test/testStyle.css').then(content => {
        assert.equal(content.formatted, "export const myClass: string;" + os.EOL);
        done();
      });
    });

    it('returns empty object exportion when the result list has no items', done => {
      new DtsCreator().create('test/empty.css').then(content => {
        assert.equal(content.formatted, "");
        done();
      });
    });

    describe('#camelCase option', () => {
      it('camelCase == true: returns camelized tokens for lowercase classes', done => {
        new DtsCreator({camelCase: true}).create('test/kebabed.css').then(content => {
          assert.equal(content.formatted, "export const myClass: string;" + os.EOL);
          done();
        });
      });

      it('camelCase == true: returns camelized tokens for uppercase classes ', done => {
        new DtsCreator({camelCase: true}).create('test/kebabedUpperCase.css').then(content => {
          assert.equal(content.formatted, "export const myClass: string;" + os.EOL);
          done();
        });
      });

      it('camelCase == "dashes": returns camelized tokens for dashes only', done => {
        new DtsCreator({camelCase: 'dashes'}).create('test/kebabedUpperCase.css').then(content => {
          assert.equal(content.formatted, "export const MyClass: string;" + os.EOL);
          done();
        });
      });
    });

  });

  describe('#writeFile', () => {
    it('writes a file', done => {
      new DtsCreator().create('test/testStyle.css').then(content => {
        return content.writeFile();
      }).then(() => {
        done();
      });
    });
  });

});
