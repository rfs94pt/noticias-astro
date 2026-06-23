import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://noticiasdastro.site',
  output: 'static',
  integrations: [sitemap()],
});
