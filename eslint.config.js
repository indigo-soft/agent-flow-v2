const {defineConfig, globalIgnores} = require("eslint/config");
const tsParser = require("@typescript-eslint/parser");
const globals = require("globals");
const {fixupConfigRules, fixupPluginRules} = require("@eslint/compat");
const {FlatCompat} = require("@eslint/eslintrc");
const js = require("@eslint/js");

const typescriptEslint = require("@typescript-eslint/eslint-plugin");
const _import = require("eslint-plugin-import");
const security = require("eslint-plugin-security");
const unusedImports = require("eslint-plugin-unused-imports");
const simpleImportSort = require("eslint-plugin-simple-import-sort");
const react = require("eslint-plugin-react");
const reactHooks = require("eslint-plugin-react-hooks");
const jsxA11Y = require("eslint-plugin-jsx-a11y");
const nextConfig = require("eslint-config-next");
const prettierConfig = require("eslint-config-prettier");

/** Files that belong to the Next.js dashboard application */
const DASHBOARD_GLOB = ["src/components/dashboard/**/*.{ts,tsx,js,jsx}"];

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

module.exports = defineConfig([
  // ── Global ignores ────────────────────────────────────────────────────────
  globalIgnores([
    "**/node_modules",
    "**/dist",
    "**/build",
    "**/.next",
    "**/out",
    "**/coverage",
    "**/*.log",
    "**/.eslintrc.js",
    "**/commitlint.config.js",
    "logs/",
  ]),

  // ── Base: ESLint recommended + TypeScript + imports (via FlatCompat) ──────
  // FlatCompat is only used for plugins that do NOT yet ship native flat configs
  ...fixupConfigRules(
      compat.extends(
          "eslint:recommended",
          "plugin:@typescript-eslint/recommended",
          "plugin:import/recommended",
          "plugin:import/typescript"
      )
  ),

  // ── Security — uses its own native flat config object ─────────────────────
  security.configs.recommended,

  // ── Main shared config ────────────────────────────────────────────────────
  {
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: "module",

      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: __dirname,
      },

      globals: {
        ...globals.node,
        ...globals.jest,
      },
    },

    plugins: {
      "@typescript-eslint": fixupPluginRules(typescriptEslint),
      import: fixupPluginRules(_import),
      "unused-imports": unusedImports,
      "simple-import-sort": simpleImportSort,
    },

    rules: {
      "@typescript-eslint/explicit-function-return-type": "off",
      "@typescript-eslint/explicit-module-boundary-types": "off",
      // Enforced as error — project standard: strictly no `any`
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": "off",
      "unused-imports/no-unused-imports": "error",

      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "import/order": "off",
      "import/no-unresolved": "error",
      "import/no-cycle": "error",

      "no-console": ["warn", {allow: ["warn", "error"]}],
      "prefer-const": "error",
      "no-var": "error",
    },

    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
      },
    },
  },

  // ── Dashboard: Next.js config (already ships as a flat config array) ──────
  // Exclude its own `ignores` entry — we manage ignores globally above
  ...nextConfig
      .filter((cfg) => !cfg.ignores)
      .map((cfg) => ({...cfg, files: DASHBOARD_GLOB})),

  // ── Dashboard: React / ReactHooks / jsx-a11y — native flat configs ────────
  {...react.configs.flat.recommended, files: DASHBOARD_GLOB},
  {...reactHooks.configs.flat["recommended-latest"], files: DASHBOARD_GLOB},
  {...jsxA11Y.flatConfigs.recommended, files: DASHBOARD_GLOB},

  // ── Dashboard: project-specific overrides ─────────────────────────────────
  {
    files: DASHBOARD_GLOB,

    plugins: {
      react,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11Y,
    },

    settings: {
      react: {version: "detect"},
    },

    rules: {
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",

      "jsx-a11y/anchor-is-valid": [
        "error",
        {
          components: ["Link"],
          specialLink: ["hrefLeft", "hrefRight"],
          aspects: ["invalidHref", "preferButton"],
        },
      ],
    },
  },

  // ── Prettier — must be last to disable all formatting-related rules ────────
  prettierConfig,
]);
