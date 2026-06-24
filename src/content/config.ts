import { defineCollection, z } from 'astro:content';

const noticias = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.date(),
    category: z.string(),
    image: z.string().optional(),
    tags: z.array(z.string()).optional(),
    author: z.string().optional().default("Notícias d'Astro"),
    source: z.string().optional(),
    sourceImage: z.string().optional(),
  }),
});

export const collections = { noticias };
