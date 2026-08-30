import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import vercel from '@astrojs/vercel';

export default defineConfig({
  output: 'server',
  adapter: vercel(),
  integrations: [
    react(),
    tailwind({ applyBaseStyles: false }),
  ],
  security: {
    // CSRF origin validation stays enabled (checkOrigin defaults to true).
    // On Vercel, the serverless function sees an internal hostname while the
    // browser sends the public deployment URL as the Origin header. Without
    // allowedDomains, Astro ignores X-Forwarded-Host/X-Forwarded-Proto, so
    // url.origin (internal) != Origin (public) and same-origin POSTs get 403.
    // Listing the deployment domain here makes Astro trust the forwarded
    // headers for that origin, so url.origin resolves to the public URL and
    // matches the browser's Origin header. Cross-site requests are still blocked.
    allowedDomains: [
      { hostname: 'dashboard-mvp-snowy.vercel.app', protocol: 'https' },
      { hostname: '**.vercel.app', protocol: 'https' },
    ],
  },
  vite: {
    resolve: {
      alias: {
        '@': '/src',
      },
    },
  },
});
