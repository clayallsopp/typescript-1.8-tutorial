# Migrating JavaScript to TypeScript 1.8

Types are a Good Idea. Computers are relentless at finding errors, humans not so much. You can get away without using types, but large projects and teams will run better with them.

TypeScript is a mature project to bring types to JavaScript. Originally TypeScript was pitched as a distinct language (like CoffeeScript), but it has since committed to being [a superset of standard JavaScript](https://blogs.msdn.microsoft.com/typescript/2014/10/22/typescript-and-the-road-to-2-0/).

Which sounds great, right? You already know JavaScript, you just need to learn the extra type syntax. But how do you actually start adding TypeScript to an existing (and probably large) JavaScript project? Read on to see how [TypeScript 1.8](https://github.com/Microsoft/TypeScript/wiki/What's-new-in-TypeScript#including-js-files-with---allowjs) adds a key feature that makes it much easier.

## How TypeScript Works, for JavaScript Developers

Coming from the React ecosystem, figuring out how TypeScript integrated into a project was unintuitive. I tried to fit it into my existing model of tooling, but it didn't quite work. Here's how I think of it now:

> TypeScript is an ES6 transpiler, type-checker, and module transformer. It can be used in place of Babel, Flow, and Browserify.

Out of the box, TypeScript is more on the monolith end of the spectrum and wants to be most of your toolchain - but you can configure it otherwise, which helps us integrate into an existing project.

The TypeScript compiler, _tsc_, will process all of the files in a directory and spit out their compiled JavaScript variants to a destination directory (or a single bundle file). It's unlike Webpack and Browserify, which generally take a single file as an argument and emit another file. Like other tools, TypeScript's compiler can be configured via command line arguments or a _tsconfig.json_ file.

Historically TypeScript only worked with _.ts_ and _.tsx_ files, which made it tough to integrate with _.js_ code. But TypeScript is moving to improve the JavaScript development experience (read up on [#4793](https://github.com/Microsoft/TypeScript/issues/4793) and [#4789](https://github.com/Microsoft/TypeScript/issues/4789)). An early step is for the TypeScript tooling to play nicely with _.js_ files, which is [shipping with TypeScript 1.8](https://github.com/Microsoft/TypeScript/wiki/What's-new-in-TypeScript#including-js-files-with---allowjs).


## Migration Strategy

Let's say we want to add some TypeScript to an existing React app, and our app is currently built with Webpack and Babel.

What we're going to do is run all of our project's files through the TypeScript compiler, and then change our Webpack config to read from that compiled output. So instead of Webpacking our JavaScript source code directly, we'll be Webpacking the Typescript output. (wait - is _Webpacking_ a verb?)

This isn't the only way to migrate your code, the whole subject is rapidly evolving, but it may spark some ideas. Let's walk through the mechanics of how this happens.

## Example

We're only going to TypeScript-ify code unrelated to React. TypeScript is very handy for React component definitions (you get compile-time checks to ensure your _props_ and _state_ are valid), but it adds a bit more tooling that's beyond the scope of this article ([external type definitions](https://github.com/typings/typings)). One of the benefits of moving your app over piecemeal like this is you can avoid adding such tooling complexity until you're ready.

Here's our pre-existing toy app (you can find the source [on Github](https://github.com/clayallsopp/typescript-1.8-tutorial/tree/master/pre-typescript)):

```
import * as React from 'react';
import * as ReactDOM from 'react-dom';

import { User } from './User';

class MyComponent extends React.Component {
  render() {
    return <div>{ this.props.user.handle }</div>;
  }
}

let user = new User('@clayallsopp');

let node = document.getElementById('container');
ReactDOM.render(<MyComponent user={ user } />, node);
```

```
export class User {
  constructor(handle) {
    this.handle = handle;
  }
}
```

Our Webpack config:

```
module.exports = {
  entry: "./src/index.js",
  output: {
    filename: "out.js",
    path: __dirname + "/dist",
  },
  module: {
    loaders: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        loader: "babel-loader",
        query: {
          presets: ['es2015', 'react']
        }
      }
    ],
  },
}
```

Finally, our build script looks like:

```
"scripts": {
  "build": "rm -rf ./dist/ && webpack && open index.html"
}
```

To add TypeScript, we install it via NPM:

```
$ npm install typescript@1.8.0 --save
```

TypeScript's compiler configuration lives in a file called _tsconfig.json_; we create that and configure it like so:

```
{
  "compilerOptions": {
    "allowJs": true,
    "outDir": "tsDist",
    "module": "es6",
    "target": "es6"
  },
  "exclude": [
    "node_modules",
    "tsDist",
    "dist",
    "webpack.config.js"
  ]
}
```

_allowJs_ is the option newly available in 1.8. The TypeScript compiler will run a quick sanity check on _.js_ files for syntax errors but otherwise passes them straight through to the output directory. The "_es6_" options mean that TypeScript will emit ES2015-compatible modules and code, instead of transforming them.

Note that we specified a "_tsDist_" output folder (_ourDir_). We need to tell Webpack to read from this folder, not the original "_src_" version:

```
module.exports = {
  entry: "./tsDist/index.js",
  // ...
};
```

Accordingly, our "_build_" script needs to change:

```
"scripts": {
  "build": "rm -rf ./dist/ && rm -rf ./tsDist/ && tsc && webpack && open index.html"
}
```

The folder naming conventions here aren't necessarily a recommendation you should do on your project, it's very much up to you.

Cool, time to actually write some TypeScript. We begin by renaming our `User` file:

```
$ mv src/User.js src/User.ts
```

When we build, we have a problem:

```
$ npm run build
...
src/User.ts(3,10): error TS2339: Property 'handle' does not exist on type 'User'.
```

It's alive! One of TypeScript's checks is that all properties of `this` must be declared. We can fix that pretty quickly:

```
export class User {
  handle: string;
  constructor(handle) {
    this.handle = handle;
  }
}
```

We can now build safely:

```
$ npm run build

...

Hash: 923de2cd435a90a150ce
Version: webpack 1.12.13
Time: 2260ms
 Asset    Size  Chunks             Chunk Names
out.js  679 kB       0  [emitted]  main
    + 160 hidden modules
```

Congratulations! This is a pretty trivial example, but you can imagine how it would benefit a larger project and as you integrate type definitions for third-party libraries.

## Beyond

Before TypeScript 1.8 it was a pain to migrate a codebase, but now there's a first-class path forward.

It's a bummer that the JavaScript community doesn't have a consensus on typing tools. The React ecosystem is invested in [Flow](http://flowtype.org), but in my experience the community and usage of TypeScript is much more active. Microsoft is implementing deep IDE support, Angular has adopted TypeScript, and my own Palantir is a heavy user of TypeScript (check out [Plottable](http://plottablejs.org/) and [TSLint](http://palantir.github.io/tslint/)).

I think the TypeScript team has the right idea to make the JavaScript migration experience better with features like _allowJs_. TypeScript is iterating incredibly fast, and I'm excited to see what happens over the next year.
