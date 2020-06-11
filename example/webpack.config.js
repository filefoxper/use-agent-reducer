const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const webpack = require('webpack');
const apiMocker = require('webpack-api-mocker');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const pathBuilder = require('path');

const entryPath = pathBuilder.resolve('src', 'index.tsx');

const targetPath = pathBuilder.resolve('..', 'dist');

const templateHtmlPath = pathBuilder.resolve('template.index.html');

const indexHtml = pathBuilder.resolve('..', 'dist', 'index.html');

function entry(mode) {
  var isDev = mode === 'development';
  var splitChunks = {
    chunks: 'all',
    cacheGroups: {
      commons: {
        test: /[\\/]node_modules[\\/](redux|react|react-dom|react-router|react-router-dom|react-redux|axios|moment)[\\/]/,
        name: 'commons',
        chunks: "all"
      },
      antd_icons: {
        test: /[\\/]node_modules[\\/]@ant-design[\\/]icons[\\/]/,
        name: 'antd_icons',
        chunks: "all",
        enforce: true
      }
    }
  };
  return {
    mode: mode ? (mode === 'analyze' ? 'production' : mode) : 'production',
    devtool: false,
    entry: {
      bundle: entryPath
    },
    output: isDev ? {
      path: targetPath,
      filename: '[name].[hash:8].js'
    } : {
      path: targetPath,
      filename: '[name].[chunkhash:8].js'
    },
    optimization: isDev ? {
      noEmitOnErrors: true,
      minimize: false,
      namedChunks: true,
      splitChunks: splitChunks
    } : {
      noEmitOnErrors: true,
      minimize: true,
      namedChunks: true,
      splitChunks: splitChunks
    },
    resolve: {
      extensions: ['.js', '.ts', '.tsx', '.json', 'txt'],
      plugins: [
        new TsconfigPathsPlugin({configFile: "./tsconfig.json"})
      ]
    },
    module: {
      rules: [
        {
          test: /\.js$|\.ts$|\.tsx$/,
          exclude: /(node_modules|bower_components)/,
          use: [
            {
              loader: 'babel-loader',
              options: {
                cacheDirectory: true,
                plugins: [
                  ["@babel/plugin-transform-runtime"],
                  ['@babel/plugin-proposal-decorators', {legacy: true}],
                  ['@babel/plugin-proposal-export-namespace-from'],
                  [
                    '@babel/plugin-proposal-class-properties',
                    {loose: true},
                  ],
                  ["import", {
                    "libraryName": "antd",
                    "libraryDirectory": "es",
                    "style": "css"
                  }]
                ],
                presets: [
                  ['@babel/preset-env', {modules: false}],
                  '@babel/preset-react',
                  '@babel/preset-typescript'
                ]
              }
            }
          ]
        },
        {
          test: /\.(gif|png|jpg|jpeg)$/,
          exclude: /(node_modules|bower_components)/,
          use: {
            loader: 'url-loader',
            options: {
              limit: 1024
            }
          }
        },
        {
          test: /\.less$/,
          exclude: /(node_modules|bower_components)/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                modules: {
                  localIdentName: '[name]_[local]_[hash:base64:5]'
                }
              }
            },
            {
              loader: 'less-loader',
              options: {
                javascriptEnabled: true,
                modifyVars: {}
              }
            }
          ]
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader'
          ]
        },
        {
          test: /\.less$/,
          include: /(node_modules|bower_components)/,
          use: [
            'style-loader',
            'css-loader',
            {
              loader: 'less-loader',
              options: {
                javascriptEnabled: true,
                modifyVars: {}
              }
            }
          ]
        },
        {
          test: /\.(ttf|eot|woff|woff2|svg)$/,
          use: ['file-loader']
        }
      ]
    },
    plugins: [
      new webpack.ContextReplacementPlugin(/moment[\/\\]locale$/, /zh-cn/),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': JSON.stringify(isDev ? mode : 'production')
        }
      }),
      new HtmlWebpackPlugin({
        plugin: 'html',
        title: 'example/useAgent',
        filename: indexHtml,
        template: templateHtmlPath,
        inject:true
      })
    ]
  }
}

function buildDevServerConfig() {
  const proxyConfig = {
    proxy: {
      '/api/*': {
        target: 'http://127.0.0.1:9090',
        secure: false
      }
    }
  };
  return {
    historyApiFallback: {
      rewrites: {from: new RegExp('^/h5/*'), to: `/index.html`}
    },
    disableHostCheck: true,
    contentBase: targetPath,
    host: "0.0.0.0",
    port: 8080,
    ...proxyConfig
  };
}

module.exports = function (env) {
  var devServer = env.mode === 'development' ? {devServer: buildDevServerConfig()} : {};
  return Object.assign({}, entry(env.mode), devServer);
};
