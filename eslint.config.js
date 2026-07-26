import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tanstackQuery from "@tanstack/eslint-plugin-query";
import eslintConfigPrettier from "eslint-config-prettier";
// 1. Import the unused-imports plugin
import unusedImports from "eslint-plugin-unused-imports";

export default tseslint.config(
  {
    ignores: ["dist", "coverage", "node_modules"],
  },

  // 2. Register the plugin globally at the top level
  {
    plugins: {
      "unused-imports": unusedImports,
    },
  },

  {
    files: ["**/*.{ts,tsx}"],

    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },

    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...tanstackQuery.configs["flat/recommended"],
      eslintConfigPrettier,
    ],

    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },

    rules: {
      // React Hooks
      ...reactHooks.configs.recommended.rules,

      // React Fast Refresh
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
        },
      ],

      // Disable built-in unused variable rules
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",

      // 3. Add rule to automatically remove unused imports on --fix
      "unused-imports/no-unused-imports": "error",

      // Warn for unused variables
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],
    },
  },
);
