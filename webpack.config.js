const path = require("path");

module.exports = {
  mode: "production",
  entry: "index.ts",
  output: {
    globalObject: "this",
    path: path.resolve(__dirname, "dist"),
    filename: "index.js",
    library: "atp-api-logger",
    libraryTarget: "umd",
  },
  externals: {},
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts?$/,
        loader: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
};
