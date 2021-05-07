module.exports = {
    plugins: [
        ["@babel/plugin-transform-runtime"],
        ['@babel/plugin-proposal-export-namespace-from'],
        [
            '@babel/plugin-proposal-class-properties',
            {loose: true},
        ]
    ],
    presets: [
        '@babel/preset-typescript'
    ]
}