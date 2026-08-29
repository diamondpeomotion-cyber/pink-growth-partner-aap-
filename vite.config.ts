import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      // Split the heavy third-party libraries out of the app bundle. Previously
      // everything landed in one ~1.3 MB chunk that had to be downloaded before
      // the first paint.
      //
      // NOTE: recharts is intentionally NOT listed here. It is only consumed by
      // DetailedAnalytics, which is React.lazy()-loaded from the dashboard, so it
      // must live inside that lazy chunk rather than a named manual chunk. Adding
      // it here would force Vite to treat the charts chunk as part of the initial
      // preload graph, re-adding ~360 kB of recharts to the first-paint critical
      // path despite the lazy import.
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            motion: ['motion'],
            icons: ['lucide-react'],
          },
        },
      },
      chunkSizeWarningLimit: 700,
    },
    server: {
      // Allow preview/proxy hosts (e.g. sandbox preview domains).
      allowedHosts: true as const,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
