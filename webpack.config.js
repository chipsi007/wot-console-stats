const path = require('path');

module.exports = {
  entry: ['whatwg-fetch', './src/index.jsx'],
  output: {
    path: path.resolve(__dirname, "web/static/"),
    filename: 'app.js',
    publicPath: '/static/'
  },
  module: {
    rules: [
      { 
        test: /\.(jsx|js)$/,
        loader: 'babel-loader',
        exclude: ['node_modules/'],
        options: {
          presets: ['react', 'env']
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  }
};