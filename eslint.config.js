import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: [
      "node_modules/**",
      ".venv/**",
      "**/data/**",
      "slopes/app_data/**",
      "**/*.min.js",
      "coverage/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_", varsIgnorePattern: "^_" }],
      "no-console": "off",
      // The browser games are loaded as classic <script> tags that share globals
      // across files, so `no-undef` would flag every cross-file reference.
      // New, self-contained modules under src/js/ are checked strictly below.
      "no-undef": "off",
    },
  },
  {
    files: ["src/js/**/*.js", "tests/**/*.js"],
    rules: {
      "no-undef": "error",
    },
  },
];
