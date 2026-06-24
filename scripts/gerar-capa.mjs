import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import matter from 'gray-matter';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const W = 1200;
const H = 630;

async function downloadImage(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

function wrapText(text, maxCharsPerLine) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + w).length > maxCharsPerLine && line.length > 0) {
      lines.push(line.trim());
      line = w;
    } else {
      line += (line ? ' ' : '') + w;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines;
}

function svgTextOverlay(lines) {
  const lineHeight = 70;
  const maxLines = 5;
  const displayLines = lines.slice(0, maxLines);
  const startY = 220;

  const texts = displayLines
    .map(
      (line, i) =>
        `<text x="${W / 2}" y="${startY + i * lineHeight}" text-anchor="middle" fill="white" font-family="Arial, Helvetica, sans-serif" font-weight="900" font-size="48" stroke="#000000" stroke-width="4" paint-order="stroke" stroke-linejoin="round">${line}</text>`,
    )
    .join('\n');

  let totalH = startY + displayLines.length * lineHeight + 40;
  if (totalH > H) totalH = H;

  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="fadeBottom" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,0,0,0)" />
      <stop offset="30%" stop-color="rgba(0,0,0,0)" />
      <stop offset="70%" stop-color="rgba(0,0,0,0.7)" />
      <stop offset="100%" stop-color="rgba(0,0,0,0.95)" />
    </linearGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#fadeBottom)" />
  ${texts}
</svg>`;
}

async function createCover(sourceImageUrl, title) {
  const photo = await downloadImage(sourceImageUrl);

  const bg = await sharp(photo)
    .resize({ width: W, height: H, fit: sharp.fit.cover, position: 'center' })
    .blur(6)
    .modulate({ brightness: 0.4, saturation: 0.5 })
    .jpeg({ quality: 85 })
    .toBuffer();

  const lines = wrapText(title, 32);
  const svg = Buffer.from(svgTextOverlay(lines));

  return sharp(bg)
    .composite([{ input: svg, top: 0, left: 0 }])
    .jpeg({ quality: 85 })
    .toBuffer();
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
  const { title, sourceImage } = data;

  if (!title) {
    console.error('A notícia não tem campo "title" no frontmatter.');
    process.exit(1);
  }

  if (!sourceImage) {
    console.error('A notícia não tem campo "sourceImage" (URL da foto da fonte).');
    console.error('Adiciona sourceImage: "https://..." ao frontmatter.');
    process.exit(1);
  }

  console.log(`📰 A gerar capa para: "${title}"`);
  console.log(`🖼️  Download da imagem fonte: ${sourceImage}`);
  console.log(`⏳ A processar (blur + título overlay)...`);

  const image = await createCover(sourceImage, title);

  const imgDir = join(ROOT, 'public/imagens/noticias', slug);
  mkdirSync(imgDir, { recursive: true });

  const filename = `${slug}.jpg`;
  const imgPath = join(imgDir, filename);
  writeFileSync(imgPath, image);

  console.log(`✅ Capa gerada: public/imagens/noticias/${slug}/${filename}`);
  console.log(`   Tamanho: ${(image.length / 1024).toFixed(1)} KB`);

  const imageField = `/imagens/noticias/${slug}/${filename}`;
  const newRaw = raw.replace(/image:.*/, `image: '${imageField}'`);
  writeFileSync(mdPath, newRaw);
  console.log(`✅ Frontmatter atualizado: image → '${imageField}'`);

  console.log('\n🚀 Pronto! Faz build e deploy.');
}

main().catch((err) => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});
