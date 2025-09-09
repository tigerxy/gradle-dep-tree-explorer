module.exports = {
  plugins: ["prettier-plugin-svelte"],
  semi: true,
  singleQuote: false,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  overrides: [
    { files: "*.svelte", options: { parser: "svelte" } },
    { files: "*.ts", options: { parser: "typescript" } },
  ],
};
