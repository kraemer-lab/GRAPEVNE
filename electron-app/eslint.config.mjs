import eslint from "@typescript-eslint/parser";

export default [
  {
      env: {
          browser: true,
          es2021: true
      },
      extends: [
          "eslint:recommended",
          "plugin:@typescript-eslint/recommended"
      ],
      overrides: [],
      parser: "@typescript-eslint/parser",
      parserOptions: {
          "ecmaVersion": "latest",
          "sourceType": "module"
      },
      plugins: {
        eslint: eslint
      },
      rules: {
      }
  }
];
