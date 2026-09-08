import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import {VitePWA} from 'vite-plugin-pwa';

export default defineConfig(() => {
  const isGitHubPagesBuild = process.env.GITHUB_ACTIONS === 'true';
  const appBase = isGitHubPagesBuild ? '/A/' : '/';

  return {
    base: appBase,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.ts',
        includeAssets: ['favicon.ico', 'favicon-32x32.png', 'favicon-64x64.png', 'apple-touch-icon.png'],
        manifest: {
          name: 'منصة نحن معك',
          short_name: 'نحن معك',
          description: 'منصة نحن معك التعليمية للطلاب',
          lang: 'ar',
          dir: 'rtl',
          start_url: appBase,
          scope: appBase,
          display: 'standalone',
          theme_color: '#050505',
          background_color: '#050505',
          icons: [
            {src: `${appBase}pwa-192x192.png`, sizes: '192x192', type: 'image/png'},
            {src: `${appBase}pwa-512x512.png`, sizes: '512x512', type: 'image/png'},
            {src: `${appBase}pwa-512x512.png`, sizes: '512x512', type: 'image/png', purpose: 'any maskable'},
          ],
        },
        injectManifest: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        },
        devOptions: {enabled: false},
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
