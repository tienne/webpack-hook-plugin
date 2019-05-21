const path = require('path');
const webpack = require('webpack');

const WebpackHookPlugin = require('./dist/webpack-hook-plugin.umd');

module.exports = {
  watch: true,
  entry: path.resolve(__dirname, 'test/entry.js'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new WebpackHookPlugin({
      onBuildStart: ['node test.js'],
      onBuildEnd: ['echo "Webpack End"'],
      safe: true
    }),
    new webpack.HotModuleReplacementPlugin()
  ]
};
