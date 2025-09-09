import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";

export default [
  // Ignore build artifacts
  { ignores: ["dist/**", "node_modules/**"] },

  // Global environments for browser & node
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },

  // Base JS rules
  js.configs.recommended,

  // TypeScript (basic recommended rules)
  {
    files: ["**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {},
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...(tsPlugin.configs?.recommended?.rules || {}),
    },
  },

  // Svelte + recommended rules
  ...svelte.configs["flat/recommended"],
  // Disable stylistic rules that conflict with Prettier
  ...svelte.configs["flat/prettier"],

  // Ensure TS parsing inside <script lang="ts"> in .svelte files
  {
    files: ["**/*.svelte"],
    languageOptions: {
      parserOptions: {
        // Let svelte-eslint-parser (from plugin config) use TS parser for script blocks
        parser: tsParser,
        extraFileExtensions: [".svelte"],
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {},
  },
];
