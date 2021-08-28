module.exports = {
  parser: "@typescript-eslint/parser",

  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended" // Uses the recommended rules from the @typescript-eslint/eslint-plugin
  ],
  env: {
    "browser": true,
    "es6": true,
    "jest": true,
    "node": true
  },
  parserOptions: {
    ecmaVersion: 2020, // Allows for the parsing of modern ECMAScript features
    sourceType: "module", // Allows for the use of imports
    ecmaFeatures: {
      jsx: true // Allows for the parsing of JSX
    }
  },
  "rules": {
    "keyword-spacing": 2,
    //"indent": [2, 2, {"VariableDeclarator": { "var": 2, "let": 2, "const": 3}, "SwitchCase": 1}], // disable due to issue
    "indent": "off",
    "semi": [2, "always"],
    "space-before-blocks": 2,
    "quotes": [2, "double", {"allowTemplateLiterals": true}],
    "space-infix-ops": 2,
    "comma-dangle": ["error", "only-multiline"],
    "curly": ["error", "all"],
    "no-var": "error",
    "one-var": ["error", "never"],
    "comma-spacing": ["error", { "before": false, "after": true }],
    "prefer-const": "error",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^[_$]" }],
  }
};
