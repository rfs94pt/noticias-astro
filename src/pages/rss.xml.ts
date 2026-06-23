import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE } from '../site.config';

export async function GET() {
  const noticias = await getCollection('noticias');
  const sorted = noticias.sort(
    (a, b) => b.data.date.getTime() - a.data.date.getTime(),
  );

  return rss({
    title: SITE.title,
    description: SITE.description,
    site: SITE.url,
    trailingSlash: false,
    items: sorted.map((n) => ({
      title: n.data.title,
      description: n.data.description,
      pubDate: n.data.date,
      link: `/noticias/${n.slug}`,
      categories: [n.data.category, ...(n.data.tags ?? [])],
    })),
    customData: `<language>pt</language>`,
  });
}
