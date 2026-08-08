import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { webcrypto } from 'node:crypto';

if (!globalThis.crypto || !globalThis.crypto.getRandomValues) {
  // Polyfill for Node v16 compatibility
  (globalThis as any).crypto = webcrypto;
}

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  }
});
