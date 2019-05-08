# Webpack Hook Plugin

This plugin allows you to run any shell commands before or after webpack builds. This will work for both webpack and webpack-dev-server.

Goes great with running cron jobs, reporting tools, or tests such as selenium, protractor, phantom, ect.

## Installation

`npm install --save-dev webpack-hook-plugin`

## Setup
In `webpack.config.js`:

```js
import WebpackHookPlugin from 'webpack-hook-plugin';

module.exports = {
  //...
  //...
  plugins: [
    new WebpackHookPlugin({
      onBuildStart:['echo "Webpack Start"'],
      onBuildEnd:['echo "Webpack End"']
    })
  ],
  //...
}
```

## Example

Insert into your webpack.config.js:

```js
import WebpackHookPlugin from 'webpack-hook-plugin';
const path = require('path');

var plugins = [];

plugins.push(new WebpackHookPlugin({
  onBuildStart: ['echo "Starting"'],
  onBuildEnd: ['python script.py && node script.js']
}));

var config = {
  entry: {
    app: path.resolve(__dirname, 'src/app.js')
  },
  output: {
    path: path.resolve(__dirname, 'dist'), // regular webpack
    filename: 'bundle.js'
  },
  devServer: {
    contentBase: path.resolve(__dirname, 'src') // dev server
  },
  plugins: plugins,
  module: {
    loaders: [
      {test: /\.js$/, loaders: 'babel'},
      {test: /\.scss$/, loader: 'style!css!scss?'},
      {test: /\.html$/, loader: 'html-loader'}
    ]
  }
}

module.exports = config;

```
Once the build finishes, a child process is spawned firing both a python and node script.

### API
* `onBuildStart`: array of scripts to execute on the initial build. **Default: [ ]**
* `onBuildEnd`: array of scripts to execute after files are emitted at the end of the compilation. **Default: [ ]**
* `onBuildExit`: array of scripts to execute after webpack's process is complete. *Note: this event also fires in `webpack --watch` when webpack has finished updating the bundle.* **Default: [ ]**
* `onCompile`: array of scripts to execute on every compile. **Default: [ ]**
* `dev`: switch for development environments. This causes scripts to execute once. Useful for running HMR on webpack-dev-server or webpack watch mode. **Default: true**
* `safe`: switches script execution process from spawn to exec. If running into problems with spawn, turn this setting on. **Default: false**
