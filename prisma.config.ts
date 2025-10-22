import { defineConfig } from 'prisma/config';

export default defineConfig({
  seed: 'ts-node -r tsconfig-paths/register prisma/seed.ts',
});
