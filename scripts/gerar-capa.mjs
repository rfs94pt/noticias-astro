import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import matter from 'gray-matter';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function buildPrompt(title, description) {
  return `Professional news article cover image. Editorial journalism photography style. ${title}. Context: ${description}. Cinematic lighting, photorealistic, wide 16:9 composition, professional color grading, no text overlay, Portuguese news media style, high quality, sharp focus, dramatic but tasteful.`.replace(
    /\s+/g,
    ' ',
  );
}

async function generateImage(prompt) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1200&height=630&model=flux&nologo=true`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Pollinations error ${res.status}`);
  }

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
}

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Uso: node scripts/gerar-capa.mjs <slug-da-noticia>');
    process.exit(1);
  }

  const mdPath = join(ROOT, 'src/content/noticias', slug, 'index.md');
  if (!existsSync(mdPath)) {
    console.error(`Notícia não encontrada: ${mdPath}`);
    process.exit(1);
  }

  const raw = readFileSync(mdPath, 'utf-8');
  const { data } = matter(raw);
  const { title, description } = data;

  if (!title) {
    console.error('A notícia não tem campo "title" no frontmatter.');
    process.exit(1);
  }

  console.log(`📰 A gerar capa para: "${title}"`);

  const prompt = buildPrompt(title, description);
  console.log(`⏳ A chamar Pollinations AI (grátis)...`);

  const image = await generateImage(prompt);

  const imgDir = join(ROOT, 'public/imagens/noticias', slug);
  mkdirSync(imgDir, { recursive: true });

  const imgPath = join(imgDir, 'capa.jpg');
  writeFileSync(imgPath, image);

  console.log(`✅ Capa gerada: public/imagens/noticias/${slug}/capa.jpg`);
  console.log(`   Tamanho: ${(image.length / 1024).toFixed(1)} KB`);

  const imageField = `/imagens/noticias/${slug}/capa.jpg`;
  if (!raw.includes(imageField)) {
    const newRaw = raw.replace(/image:.*/, `image: '${imageField}'`);
    writeFileSync(mdPath, newRaw);
    console.log(`✅ Frontmatter atualizado: image → '${imageField}'`);
  }

  console.log('\n🚀 Pronto! Faz build e deploy.');
}

main().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
