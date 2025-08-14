import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'static',
  base: '/static/',
  
  build: {
    outDir: '../staticfiles/dist',
    emptyOutDir: false,
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'static/css/main.css'),
        'layout-editor': resolve(__dirname, 'static/js/layout-editor.js'),
        'inspection': resolve(__dirname, 'static/js/inspection.js'),
        'alpine-extensions': resolve(__dirname, 'static/js/alpine-extensions.js')
      },
      output: {
        entryFileNames: 'js/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const extType = info[info.length - 1];
          if (/\.(css)$/.test(assetInfo.name)) {
            return 'css/[name]-[hash].[ext]';
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return 'img/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        }
      }
    }
  },
  
  server: {
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3001
    }
  },
  
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: '@import "./styles/variables.scss";'
      }
    }
  },
  
  plugins: [],
  
  resolve: {
    alias: {
      '@': resolve(__dirname, 'static'),
      '@css': resolve(__dirname, 'static/css'),
      '@js': resolve(__dirname, 'static/js'),
      '@img': resolve(__dirname, 'static/img')
    }
  },
  
  optimizeDeps: {
    include: [
      'konva'
    ]
  }
});
