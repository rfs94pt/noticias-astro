import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://noticias-astro.ricardoffcs.workers.dev',
  output: 'static',
  integrations: [sitemap()],
});
