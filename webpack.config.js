import glob from 'glob'
import path from 'path'
import webpack from 'webpack'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

const config = {
  plugins: [
    // Webpack 5 no longer polyfills 'process'
    new webpack.ProvidePlugin({
      process: 'process/browser.js'
    }),
    // as per https://github.com/webpack/changelog-v5/issues/10
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    })
  ],
  target: ['web'],
  resolve: {
    fallback: {
      // BREAKING CHANGE: webpack < 5 used to include polyfills for
      // node.js core modules by default. This is no longer the
      // case.
      assert: false,
      buffer: require.resolve('buffer/'),
      fs: false,
      path: require.resolve('path-browserify'),
      stream: require.resolve('stream-browserify'),
      util: false,
      os: require.resolve('os-browserify')
    }
  }
}

export default [
  {
    ...config,
    mode: 'production',
    entry: './src/browser.js',
    output: {
      path: path.resolve('dist'),
      filename: 'fergies-inverted-index.js',
      library: 'FergiesInvertedIndex'
    }
  },
  {
    ...config,
    mode: 'production',
    entry: glob.sync('./test/src/*-test.js'),
    output: {
      path: path.resolve('test/sandbox'),
      filename: 'browser-tests.js'
    }
  }
]
