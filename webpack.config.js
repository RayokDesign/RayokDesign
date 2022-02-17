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
  entry: path.join(__dirname, './public/src/finances.js'),
  output: {
    filename: 'finances_bundle.js',
    path: path.join(__dirname, './public/dist'),
  },
};

module.exports = appConfig;
