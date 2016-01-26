# typed-css-modules

Creates TypeScript definiton files from css-modules .css files.

If you have the following css, 

```css
.myClass {
  color: red;
}
```

this creates the following .d.ts files from it:

```ts
export const myClass: string;
```

So, you can use CSS modules in your .ts sources:

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
tcm -d src
```

Then, this creates `*.css.d.ts` file under the directory which has original .css file.

```text
(your project root)
- src/
    | myStyle.css
    | myStyle.css.d.ts [created]
```

#### watch
With `-w` or `--watch`, this CLI watches files in the input directory.

### API
T.B.D.

## License
This software is released under the MIT License, see LICENSE.txt.
