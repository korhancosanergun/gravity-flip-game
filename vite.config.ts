import { defineConfig } from 'vite';
import { readFileSync, existsSync } from 'node:fs';

function getBuildVersion(): string {
  const p = './version.json';
  if (!existsSync(p)) return 'dev';
  try {
    return (JSON.parse(readFileSync(p, 'utf-8')) as { version: string }).version;
  } catch {
    return 'dev';
  }
}

const BUILD_VERSION = getBuildVersion();

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(BUILD_VERSION),
  },
  build: {
    target: 'es2020',
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('three'))     return 'three';
          if (id.includes('cannon-es')) return 'cannon-es';
        },
      },
    },
  },
});
