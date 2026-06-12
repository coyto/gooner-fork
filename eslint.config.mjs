import eslintConfigPrettier from "eslint-config-prettier";
import prettier from "eslint-plugin-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...eslintConfigPrettier,
  ...prettier.configs.recommended,
  globalIgnores([
    ".claude/**",
    "out/**",
    "dist/**"
  ]),
]);

export default eslintConfig;
