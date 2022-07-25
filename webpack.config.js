const path = require('path')
const webpack = require('webpack')
const glob = require("glob");

const config = {
  plugins: [
    // Webpack 5 no longer polyfills 'process'
    new webpack.ProvidePlugin({
      process: 'process/browser',
    }),
    // as per https://github.com/webpack/changelog-v5/issues/10
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
    })
  ],
  target: 'web',
  resolve: {
    fallback: {
      // BREAKING CHANGE: webpack < 5 used to include polyfills for
      // node.js core modules by default. This is no longer the
      // case.
      'assert': false,
      "buffer": require.resolve("buffer/"),
      "fs": false,
      "path": require.resolve("path-browserify"),
      "stream": require.resolve("stream-browserify"),
      'util': false,
      "os": require.resolve("os-browserify")
    }
  }
}

module.exports = [{
  ...config,
  mode: 'production',
  entry: './src/main.js',
  output: {
    path: path.resolve('dist'),
    filename: 'fergies-inverted-index.js',
    library: 'FergiesInvertedIndex'
  }
}, {
  ...config,
  mode: 'development',
  entry: glob.sync('./test/src/*-test.js'),
  output: {
    path: path.resolve('test/sandbox'),
    filename: 'browser-tests.js'
  },
}]
