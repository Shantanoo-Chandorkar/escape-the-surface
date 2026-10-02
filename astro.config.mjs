import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import mdx from '@astrojs/mdx';
import netlify from '@astrojs/netlify';
import remarkGfm from 'remark-gfm';
import AstroPWA from '@vite-pwa/astro';

export default defineConfig({
  adapter: netlify(),
  integrations: [
    mdx({
      remarkPlugins: [remarkGfm],
    }),
    react(),
    AstroPWA({
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'EscapeTheSurface',
        short_name: 'EscapeTheSurface',
        description:
          'Master the internal mechanisms of the Frontend. A deep-dive platform for engineering high-caliber React developers.',
        theme_color: '#a65d57',
        background_color: '#fbfbf9',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        shortcuts: [
          {
            name: 'Continue Reading',
            short_name: 'Continue',
            description: 'Resume your last visited lesson',
            url: '/continue',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Search',
            short_name: 'Search',
            description: 'Search lessons',
            url: '/?search=1',
            icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
      },
      workbox: {
        // Shell only - the 74 lesson pages cache on visit via runtimeCaching below, not here.
        globPatterns: ['**/*.{js,css}', 'icons/*.png'],
        // Forces sw.js to change on every build so content-only deploys still trigger the update prompt.
        additionalManifestEntries: [{ url: '/', revision: Date.now().toString() }],
        navigateFallback: null,
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages-cache',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 100, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
    }),
  ],
  markdown: {
    shikiConfig: {
      // Theme that closely matches the current dark code block aesthetic
      theme: 'github-dark',
      wrap: true,
    },
  },
});
