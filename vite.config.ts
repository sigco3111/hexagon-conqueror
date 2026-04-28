import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'mapbox-gl': path.resolve(__dirname, 'node_modules/maplibre-gl/dist/maplibre-gl.js'),
    },
  },
});
