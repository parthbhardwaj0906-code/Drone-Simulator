import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Enables local network exposure (0.0.0.0) for testing on mobile
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});