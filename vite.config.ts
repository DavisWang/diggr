import { defineConfig } from 'vitest/config';

function resolveBasePath(): string {
  // GitHub Pages project sites are served from /<repo-name>/, while local dev
  // should stay at /. The workflow provides GITHUB_REPOSITORY automatically.
  if (process.env.GITHUB_ACTIONS !== 'true') {
    return '/';
  }

  const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
  return repositoryName ? `/${repositoryName}/` : '/';
}

export default defineConfig({
  base: resolveBasePath(),
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
});
