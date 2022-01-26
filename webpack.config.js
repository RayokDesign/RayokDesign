const path = require('path');

const rootConfig = {
  mode: 'development',
  optimization: {
    usedExports: true, // tells webpack to tree-shake
  },
  devtool: 'eval-source-map'
};

const appConfig = {
  ...rootConfig,
  entry: './public/src/finances.js',
  output: {
    filename: 'finances_bundle.js',
    path: path.resolve(__dirname, 'public/dist'),
  },
};

module.exports = appConfig;
