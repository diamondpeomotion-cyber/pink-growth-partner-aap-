// DEV-ONLY config for the Website Onboarding visual harness.
// The application build (`npm run build`) uses the root vite.config.ts and
// never includes anything from scripts/.
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  root: path.resolve(__dirname),
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5180,
    strictPort: true,
    allowedHosts: true as const,
    cors: true,
    fs: { allow: [path.resolve(__dirname, '../..')] },
  },
});
