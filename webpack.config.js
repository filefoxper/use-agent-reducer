const webpack = require('webpack');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const pathBuilder = require('path');

const entryPath = pathBuilder.resolve('src', 'index.ts');

const targetPath = pathBuilder.resolve('dist');

const reactExternal = {
    root: 'React',
    commonjs2: 'react',
    commonjs: 'react',
    amd: 'react',
};

const reactDOMExternal = {
    root: 'ReactDOM',
    commonjs2: 'react-dom',
    commonjs: 'react-dom',
    amd: 'react-dom',
};

const agentReducerExternal = {
    root: 'AgentReducer',
    commonjs2: 'agent-reducer',
    commonjs: 'agent-reducer',
    amd: 'agent-reducer',
};

function entry(env) {
    return {
        externals: {
            'react': reactExternal,
            'react-dom': reactDOMExternal,
            'agent-reducer':agentReducerExternal
        },
        mode: 'production',
        devtool: false,
        entry: {
            ['use-agent-reducer']: entryPath,
            ['use-agent-reducer.min']: entryPath
        },
        output: {
            path: targetPath,
            filename: '[name].js',
            library: 'use-agent-reducer',
            libraryTarget: 'umd'
        },
        optimization: {
            noEmitOnErrors: true,
            minimize: true,
            minimizer: [
                new UglifyJsPlugin({
                    include: /\.min\.js$/
                }),
            ],
            namedChunks: true
        },
        resolve: {
            extensions: ['.js', '.ts', '.tsx', '.json', 'txt']
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
                                    ['@babel/plugin-proposal-export-namespace-from'],
                                    [
                                        '@babel/plugin-proposal-class-properties',
                                        {loose: true},
                                    ]
                                ],
                                presets: [
                                    [
                                        '@babel/preset-env',
                                        {
                                            modules: false,
                                            targets: {
                                                "browsers": ["last 2 versions", "ie >=9"]
                                            },
                                            useBuiltIns: "usage",
                                            corejs: {version: 3, proposals: true}
                                        }
                                    ],
                                    '@babel/preset-react'
                                ]
                            }
                        },
                        "ts-loader"
                    ]
                }
            ]
        },
        plugins: [
            new webpack.DefinePlugin({
                'process.env': {
                    'NODE_ENV': JSON.stringify('production')
                }
            })
        ].concat(env.analyze ? new BundleAnalyzerPlugin() : [])
    }
}

module.exports = function (env) {
    return entry(env);
};
