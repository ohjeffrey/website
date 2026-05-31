const js = require("@eslint/js");

module.exports = [
  {
    ...js.configs.recommended,
    files: ["erp/**/*.gs"],
    languageOptions: {
      ecmaVersion: 2019,
      globals: {
        SpreadsheetApp: "readonly",
        DriveApp: "readonly",
        HtmlService: "readonly",
        PropertiesService: "readonly",
        Utilities: "readonly",
        Session: "readonly",
        Logger: "readonly",
        UrlFetchApp: "readonly",
        ScriptApp: "readonly",
        ContentService: "readonly",
      }
    },
    rules: {
      // GAS loads all .gs files as one script — cross-file refs are invisible to ESLint
      "no-undef": "off",
      "no-unused-vars": "off",
      "eqeqeq": "warn",
      "no-console": "off"
    }
  }
];
