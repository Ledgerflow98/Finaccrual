const webpack = require("webpack");
const devCerts = require("office-addin-dev-certs");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

async function getHttpsOptions() {
  const options = await devCerts.getHttpsServerOptions();
  return { ca: options.ca, key: options.key, cert: options.cert };
}

module.exports = async (env, options) => {
  const isProduction = options.mode === "production";
  // macOS: backend runs HTTPS (office-addin-dev-certs) to satisfy Safari's
  // mixed-content policy. Windows: backend stays HTTP — Edge WebView2 allows
  // http://localhost from an HTTPS taskpane, and OAuth redirect URIs stay as-is.
  const backendProtocol = process.platform === 'darwin' ? 'https' : 'http';
  const apiBase = process.env.API_BASE || (isProduction ? "" : `${backendProtocol}://localhost:8000`);



  return {
    devtool: isProduction ? "source-map" : "eval-source-map",
    entry: {
      polyfill: ["core-js/stable", "regenerator-runtime/runtime"],
      taskpane: "./src/taskpane/index.jsx",
      commands: "./src/commands/commands.js"
    },
    output: { clean: true },
    resolve: { extensions: [".js", ".jsx"] },
    module: {
      rules: [{
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: { presets: [["@babel/preset-env", { targets: "defaults" }], ["@babel/preset-react", { runtime: "automatic" }]] }
        }
      }, {
        test: /\.(png|jpg|jpeg|gif|ico)$/i,
        type: "asset/resource",
        generator: { filename: "assets/[name][ext][query]" }
      }]
    },
    plugins: [
      new webpack.DefinePlugin({
        "process.env.API_BASE": JSON.stringify(apiBase),
        "process.env.NODE_ENV": JSON.stringify(options.mode || "development")
      }),
      new HtmlWebpackPlugin({ filename: "taskpane.html", template: "./src/taskpane/index.html", chunks: ["polyfill", "taskpane"], hash: true }),
      new HtmlWebpackPlugin({ filename: "commands.html", template: "./src/commands/commands.html", chunks: ["polyfill", "commands"], hash: true }),
      new HtmlWebpackPlugin({ filename: "trialselect.html", template: "./src/taskpane/trialselect.html", chunks: ["polyfill"], hash: true }),
      new CopyWebpackPlugin({ patterns: [
        { from: "assets/*", to: "assets/[name][ext][query]" },
        { from: "src/taskpane/taskpane.css", to: "taskpane.css" },
        { from: "src/taskpane/styles/*.css", to: "styles/[name][ext]" },
        { from: "manifest.xml", to: "manifest.xml" },
        { from: "manifest.prod.xml", to: "manifest.prod.xml", noErrorOnMissing: true }
      ] })
    ],
    devServer: {
      headers: { "Access-Control-Allow-Origin": "*" },
      server: { type: "https", options: env.WEBPACK_BUILD || options.https !== undefined ? options.https : await getHttpsOptions() },
      port: 3001
    }
  };
};
