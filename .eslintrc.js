module.exports = {
    env: {
        "browser": true,
        "es6": true
    },
    extends: [
        'airbnb',
        'plugin:@typescript-eslint/recommended',
        // 'plugin:@typescript-eslint/recommended-requiring-type-checking'
    ],
    globals: {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly",
        "self": "readonly"
    },
    parserOptions: {
        "ecmaVersion": 2021,
        "sourceType": 'module',
        tsconfigRootDir: '.',
        project: ['./tsconfig.json'],
    },
    plugins: ['@typescript-eslint'],
    settings: {
        'import/resolver': {
            'typescript': {},

        }
    },
    rules: {
        "import/extensions": "off",
        "no-param-reassign": "off",
        "@typescript-eslint/no-explicit-any":"off",
        "@typescript-eslint/no-unused-vars": ["off"],
        'react/jsx-filename-extension': ["off", { 'extensions': ['.js', '.jsx', '.ts', '.tsx'] }],
        'react/jsx-props-no-spreading':'off',
        'import/prefer-default-export':'off',
        'max-classes-per-file':'off',
        'no-plusplus':["error",{allowForLoopAfterthoughts:true}],
        'react/require-default-props':'off',
        'camelcase':'off',
        "no-use-before-define": "off",
        "@typescript-eslint/no-use-before-define": ["error", { "functions": false, "classes": true }],
        'react/no-did-update-set-state':'warn',
        "no-shadow":["warn"],
        'class-methods-use-this':'off',
        'jsx-a11y/no-static-element-interactions':'off',
        'jsx-a11y/click-events-have-key-events':'off',
        '@typescript-eslint/no-empty-function':'off'
    }
};