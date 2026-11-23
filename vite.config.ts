import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'OzoneUI',
      fileName: () => 'ozone.js',
      formats: ['es']
    },
    outDir: 'dist',
    emptyOutDir: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'ozone.css';
          }
          return '[name][extname]';
        }
      }
    }
  }
});
