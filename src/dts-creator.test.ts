import path from 'node:path';
import assert from 'node:assert';

import { DtsCreator } from './dts-creator';

describe(DtsCreator, () => {
  describe('#create', () => {
    it('returns DtsContent instance simple css', async () => {
      const content = await new DtsCreator().create('fixtures/testStyle.css');
      assert.equal(content.contents.length, 1);
      assert.equal(content.contents[0], 'readonly myClass: string;');
    });

    it('rejects an error with invalid CSS', async () => {
      await expect(() => new DtsCreator().create('fixtures/errorCss.css')).rejects.toMatchObject({
        name: 'CssSyntaxError',
      });
    });

    it('returns DtsContent instance from composing css', async () => {
      const content = await new DtsCreator().create('fixtures/composer.css');
      assert.equal(content.contents.length, 1);
      assert.equal(content.contents[0], 'readonly root: string;');
    });

    it('returns DtsContent instance from composing css whose has invalid import/composes', async () => {
      const content = await new DtsCreator().create('fixtures/invalidComposer.scss');
      assert.equal(content.contents.length, 1);
      assert.equal(content.contents[0], 'readonly myClass: string;');
    });

    it('returns DtsContent instance from the pair of path and contents', async () => {
      const content = await new DtsCreator().create('fixtures/somePath', `.myClass { color: red }`);
      assert.equal(content.contents.length, 1);
      assert.equal(content.contents[0], 'readonly myClass: string;');
    });

    it('returns DtsContent instance combined css', async () => {
      const content = await new DtsCreator().create('fixtures/combined/combined.css');
      assert.equal(content.contents.length, 3);
      assert.equal(content.contents[0], 'readonly block: string;');
      assert.equal(content.contents[1], 'readonly box: string;');
      assert.equal(content.contents[2], 'readonly myClass: string;');
    });
  });

  describe('#modify path', () => {
    it('can be set outDir', async () => {
      const content = await new DtsCreator({ searchDir: 'fixtures', outDir: 'dist' }).create(
        path.normalize('fixtures/testStyle.css'),
      );
      assert.equal(path.relative(process.cwd(), content.outputFilePath), path.normalize('dist/testStyle.css.d.ts'));
    });
  });

  describe('#allow arbitrary extensions', () => {
    it('can be set allowArbitraryExtensions', async () => {
      const content = await new DtsCreator({
        searchDir: 'fixtures',
        outDir: 'dist',
        allowArbitraryExtensions: true,
      }).create(path.normalize('fixtures/testStyle.css'));
      assert.equal(path.relative(process.cwd(), content.outputFilePath), path.normalize('dist/testStyle.d.css.ts'));
    });
  });
});
