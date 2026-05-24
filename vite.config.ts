import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
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
