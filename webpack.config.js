module.exports = {
  entry: ['whatwg-fetch', './src/index.jsx'],
  output: {
    filename: './web/static/app.js'
  },
  module: {
    loaders: [
      { 
        test: /\.(jsx|js)$/,
        loader: 'babel-loader',
        exclude: /node_modules/,
        query: {
          presets: ["react", "env"]
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx'],
  }
};