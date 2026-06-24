import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import matter from 'gray-matter';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const CF_ACCOUNT_ID = '9fc117ff3c21e7b8e071d6480d263259';
const CF_TOKEN =
  'cfoat_mwqV5lfSi0VOLZrkuNQgdYhQ5StgSSdU46BBfRQu56g.iMGgW0XMkeoMmhjyHlPiJidoNaTRaAdP2wDos1khzi0';
const CF_API = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/ai/run/@cf/black-forest-labs/flux-1-schnell`;

async function generateImage(prompt) {
  const body = JSON.stringify({
    prompt,
    num_steps: 4,
    width: 1200,
    height: 630,
  });

  const res = await fetch(CF_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${CF_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudflare AI error ${res.status}: ${err}`);
  }

  const buffer = await res.arrayBuffer();
  return Buffer.from(buffer);
}

function buildPrompt(title, description) {
  return `Professional news article cover image. Editorial journalism style. 
Headline: "${title}". 
Context: ${description}. 
Style: clean, modern, photorealistic, no text overlay, dramatic lighting, wide composition 16:9 ratio, high quality, suitable for news website hero banner. Portuguese news context. Neutral colors with subtle red accent.`;
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
  console.log(`🎨 Prompt: ${buildPrompt(title, description).slice(0, 150)}...`);
  console.log('⏳ A chamar Cloudflare Workers AI (pode demorar ~15 segundos)...');

  const prompt = buildPrompt(title, description);
  const image = await generateImage(prompt);

  const imgDir = join(ROOT, 'public/imagens/noticias', slug);
  mkdirSync(imgDir, { recursive: true });

  const imgPath = join(imgDir, 'capa.jpg');
  writeFileSync(imgPath, image);

  console.log(`✅ Capa gerada: public/imagens/noticias/${slug}/capa.jpg`);
  console.log(`   Tamanho: ${(image.length / 1024).toFixed(1)} KB`);
  console.log('');
  console.log('📝 A atualizar frontmatter com o caminho da imagem...');

  const imageField = `/imagens/noticias/${slug}/capa.jpg`;
  const newRaw = raw.replace(
    /image:.*/,
    `image: '${imageField}'`,
  );
  writeFileSync(mdPath, newRaw);

  console.log(`✅ Frontmatter atualizado: image → '${imageField}'`);
  console.log('');
  console.log('🚀 Pronto! Faz build e deploy.');
}

main().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
