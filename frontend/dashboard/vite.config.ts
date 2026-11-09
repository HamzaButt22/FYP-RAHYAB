import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The build must emit no inline scripts or styles, so the strict CSP in infra/docker/Caddyfile
// (script-src 'self') works without nonces.
export default defineConfig({
  plugins: [react()],
  build: { assetsInlineLimit: 0, sourcemap: false },
  server: { port: 5173 },
});
