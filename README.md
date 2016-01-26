# typed-css-modules [![Build Status](https://travis-ci.org/Quramy/typed-css-modules.svg?branch=master)](https://travis-ci.org/Quramy/typed-css-modules) [![npm version](https://badge.fury.io/js/typed-css-modules.svg)](http://badge.fury.io/js/typed-css-modules)

Creates TypeScript definition files from [CSS Modules](https://github.com/css-modules/css-modules) .css files.

If you have the following css, 

```css
/* styles.css */
.myClass {
  color: red;
}
```

this creates the following .d.ts files from the above css:

```ts
/* styles.css.d.ts */
export const myClass: string;
```

So, you can import CSS modules in your .ts sources:

```ts
import * as styles from './styles.css';
console.log(`<div class="${styles.myClass}"></div>`);
```

## usage

### CLI

```sh
npm install -g typed-css-modules
```

```sh
tcm <input directory>
```

Then, this creates `*.css.d.ts` file under the directory which has original .css file.

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
tcm src -o dist src
```

```text
(your project root)
- src/
    | myStyle.css
- dist/
    | myStyle.css.d.ts [created]
```

#### file name pattern

By the default, this tool searches `**/*.css` files under `<input directory>`.
If you can customize glob pattern, you can use `--pattern` or `-p` option.

```sh
tcm -p src/**/*.icss
```

#### watch
With `-w` or `--watch`, this CLI watches files in the input directory.

### API
T.B.D.

## License
This software is released under the MIT License, see LICENSE.txt.
