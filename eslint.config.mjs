import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      // Ignore generated Prisma client
      "src/generated/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Ignore seed scripts (CommonJS)
      "prisma/seed.js",
      // Ignore utility scripts (non-production code)
      "scripts/**",
    ],
  },
];

export default eslintConfig;
