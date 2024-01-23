# typed-css-modules [![github actions](https://github.com/Quramy/typed-css-modules/workflows/build/badge.svg)](https://github.com/Quramy/typed-css-modules/actions) [![npm version](https://badge.fury.io/js/typed-css-modules.svg)](http://badge.fury.io/js/typed-css-modules)

Creates TypeScript definition files from [CSS Modules](https://github.com/css-modules/css-modules) .css files.

If you have the following css,

```css
/* styles.css */

@value primary: red;

.myClass {
  color: primary;
}
```

typed-css-modules creates the following .d.ts files from the above css:

```ts
/* styles.css.d.ts */
declare const styles: {
  readonly primary: string;
  readonly myClass: string;
};
export = styles;
```

So, you can import CSS modules' class or variable into your TypeScript sources:

```ts
/* app.ts */
import styles from './styles.css';
console.log(`<div class="${styles.myClass}"></div>`);
console.log(`<div style="color: ${styles.primary}"></div>`);
```

## CLI

```sh
npm install -g typed-css-modules
```

And exec `tcm <input directory>` command.
For example, if you have .css files under `src` directory, exec the following:

```sh
tcm src
```

Then, this creates `*.css.d.ts` files under the directory which has the original .css file.

```text
(your project root)
- src/
    | myStyle.css
    | myStyle.css.d.ts [created]
```

#### output directory

Use `-o` or `--outDir` option.

For example:

```sh
tcm -o dist src
```

```text
(your project root)
- src/
    | myStyle.css
- dist/
    | myStyle.css.d.ts [created]
```

#### file name pattern

By default, this tool searches `**/*.css` files under `<input directory>`.
If you can customize the glob pattern, you can use `--pattern` or `-p` option.
Note the quotes around the glob to `-p` (they are required, so that your shell does not perform the expansion).

```sh
tcm -p 'src/**/*.css' .
```

#### watch

With `-w` or `--watch`, this CLI watches files in the input directory.

#### validating type files

With `-l` or `--listDifferent`, list any files that are different than those that would be generated.
If any are different, exit with a status code 1.

#### camelize CSS token

With `-c` or `--camelCase`, kebab-cased CSS classes(such as `.my-class {...}`) are exported as camelized TypeScript variable name(`export const myClass: string`).

You can pass `--camelCase dashes` to only camelize dashes in the class name. Since version `0.27.1` in the
webpack `css-loader`. This will keep upperCase class names intact, e.g.:

```css
.SomeComponent {
  height: 10px;
}
```

becomes

```typescript
declare const styles: {
  readonly SomeComponent: string;
};
export = styles;
```

See also [webpack css-loader's camelCase option](https://github.com/webpack/css-loader#camelcase).

#### named exports (enable tree shaking)

With `-e` or `--namedExports`, types are exported as named exports as opposed to default exports.
This enables support for the `namedExports` css-loader feature, required for webpack to tree shake the final CSS (learn more [here](https://webpack.js.org/loaders/css-loader/#namedexport)).

Use this option in combination with https://webpack.js.org/loaders/css-loader/#namedexport and https://webpack.js.org/loaders/style-loader/#namedexport (if you use `style-loader`).

When this option is enabled, the type definition changes to support named exports.

_NOTE: this option enables camelcase by default._

```css
.SomeComponent {
  height: 10px;
}
```

**Standard output:**

```typescript
declare const styles: {
  readonly SomeComponent: string;
};
export = styles;
```

**Named exports output:**

```typescript
export const someComponent: string;
```

#### arbitrary file extensions

With `-a` or `--allowArbitraryExtensions`, output filenames will be compatible with the "arbitrary file extensions" feature that was introduce in TypeScript 5.0. See [the docs](https://www.typescriptlang.org/tsconfig#allowArbitraryExtensions) for more info.

In essence, the `*.css.d.ts` extension now becomes `*.d.css.ts` so that you can import CSS modules in projects using ESM module resolution.

## API

```sh
npm install typed-css-modules
```

```js
import DtsCreator from 'typed-css-modules';
let creator = new DtsCreator();
creator.create('src/style.css').then(content => {
  console.log(content.tokens); // ['myClass']
  console.log(content.formatted); // 'export const myClass: string;'
  content.writeFile(); // writes this content to "src/style.css.d.ts"
});
```

### class DtsCreator

DtsCreator instance processes the input CSS and creates TypeScript definition contents.

#### `new DtsCreator(option)`

You can set the following options:

- `option.rootDir`: Project root directory(default: `process.cwd()`).
- `option.searchDir`: Directory which includes target `*.css` files(default: `'./'`).
- `option.outDir`: Output directory(default: `option.searchDir`).
- `option.camelCase`: Camelize CSS class tokens.
- `option.namedExports`: Use named exports as opposed to default exports to enable tree shaking. Requires `import * as style from './file.module.css';` (default: `false`)
- `option.allowArbitraryExtensions`: Output filenames that will be compatible with the "arbitrary file extensions" TypeScript feature
- `option.EOL`: EOL (end of line) for the generated `d.ts` files. Possible values `'\n'` or `'\r\n'`(default: `os.EOL`).

#### `create(filepath, contents) => Promise(dtsContent)`

Returns `DtsContent` instance.

- `filepath`: path of target .css file.
- `contents`(optional): the CSS content of the `filepath`. If set, DtsCreator uses the contents instead of the original contents of the `filepath`.

### class DtsContent

DtsContent instance has `*.d.ts` content, final output path, and function to write the file.

#### `writeFile(postprocessor) => Promise(dtsContent)`

Writes the DtsContent instance's content to a file. Returns the DtsContent instance.

- `postprocessor` (optional): a function that takes the formatted definition string and returns a modified string that will be the final content written to the file.

  You could use this, for example, to pass generated definitions through a formatter like Prettier, or to add a comment to the top of generated files:

  ```js
  dtsContent.writeFile(definition => `// Generated automatically, do not edit\n${definition}`);
  ```

#### `tokens`

An array of tokens is retrieved from the input CSS file.
e.g. `['myClass']`

#### `contents`

An array of TypeScript definition expressions.
e.g. `['export const myClass: string;']`.

#### `formatted`

A string of TypeScript definition expressions.

e.g.

```ts
export const myClass: string;
```

#### `messageList`

An array of messages. The messages contain invalid token information.
e.g. `['my-class is not valid TypeScript variable name.']`.

#### `outputFilePath`

Final output file path.

## Remarks

If your input CSS file has the following class names, these invalid tokens are not written to output `.d.ts` file.

```css
/* TypeScript reserved word */
.while {
  color: red;
}

/* invalid TypeScript variable */
/* If camelCase option is set, this token will be converted to 'myClass' */
.my-class {
  color: red;
}

/* it's ok */
.myClass {
  color: red;
}
```

## Example

There is a minimum example in this repository `example` folder. Clone this repository and run `cd example; npm i; npm start`.

Or please see [https://github.com/Quramy/typescript-css-modules-demo](https://github.com/Quramy/typescript-css-modules-demo). It's a working demonstration of CSS Modules with React and TypeScript.

## License

This software is released under the MIT License, see LICENSE.txt.
