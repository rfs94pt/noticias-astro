import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://astro-blog-starter-template1.ricardoffcs.workers.dev',
  output: 'static',
  integrations: [sitemap()],
});
