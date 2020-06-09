var HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = env => {
  if (!env) {
    env = {}
  }
  return {
    mode: env.production ? 'production' : 'development',
    devtool: "source-map",
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".json"]
    },
    module: {
      rules: [
        {
          test: /\.ts(x?)$/,
          exclude: /node_modules/,
          use: [
            {
              loader: "awesome-typescript-loader"
            }
          ]
        },
        {
          enforce: "pre",
          test: /\.js$/,
          loader: "source-map-loader"
        }
      ]
    },
    optimization: {
      splitChunks: {
        chunks: 'all'
      }
    },
    plugins: [
      new HtmlWebpackPlugin({
        title: "Majsoul API Frontend"
      })
    ]
  };
};
