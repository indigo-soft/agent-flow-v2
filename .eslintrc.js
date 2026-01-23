module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
    },
    env: {
        node: true,
        es6: true,
        jest: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/recommended',
        'plugin:import/typescript',
        'plugin:security/recommended',
    ],
    plugins: ['@typescript-eslint', 'import', 'security', 'unused-imports', 'simple-import-sort'],
    rules: {
        // TypeScript
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/no-unused-vars': 'off', // Use unused-imports/no-unused-vars instead

        // Unused imports
        'unused-imports/no-unused-imports': 'error',
        'unused-imports/no-unused-vars': [
            'warn',
            {
                vars: 'all',
                varsIgnorePattern: '^_',
                args: 'after-used',
                argsIgnorePattern: '^_',
            },
        ],

        // Import sorting
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',

        // Import rules
        'import/order': 'off', // Use simple-import-sort instead
        'import/no-unresolved': 'error',
        'import/no-cycle': 'error',

        // General
        'no-console': ['warn', {allow: ['warn', 'error']}],
        'prefer-const': 'error',
        'no-var': 'error',
    },
    settings: {
        'import/resolver': {
            typescript: {
                alwaysTryTypes: true,
                project: './tsconfig.json',
            },
        },
    },
    overrides: [
        {
            files: ['src/dashboard/**/*.{ts,tsx,js,jsx}'],
            extends: [
                'next/core-web-vitals',
                'plugin:react/recommended',
                'plugin:react-hooks/recommended',
                'plugin:jsx-a11y/recommended',
            ],
            plugins: ['react', 'react-hooks', 'jsx-a11y'],
            settings: {
                react: {
                    version: 'detect',
                },
            },
            rules: {
                'react/react-in-jsx-scope': 'off',
                'react/prop-types': 'off',
                'jsx-a11y/anchor-is-valid': [
                    'error',
                    {
                        components: ['Link'],
                        specialLink: ['hrefLeft', 'hrefRight'],
                        aspects: ['invalidHref', 'preferButton'],
                    },
                ],
            },
        },
    ],
};
