import { mkdirSync, writeFileSync, cpSync, existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Uso: node scripts/criar-noticia.mjs <slug-da-noticia>');
    console.error('Exemplo: node scripts/criar-noticia.mjs ucrania-guerra-hybrida');
    process.exit(1);
  }

  const templateDir = join(ROOT, 'src/content/noticias/_template');
  const targetDir = join(ROOT, 'src/content/noticias', slug);
  const imgTargetDir = join(ROOT, 'public/imagens/noticias', slug);

  if (existsSync(targetDir)) {
    console.error(`❌ Já existe uma notícia com o slug "${slug}".`);
    process.exit(1);
  }

  mkdirSync(targetDir, { recursive: true });
  mkdirSync(imgTargetDir, { recursive: true });

  const templateMd = join(templateDir, 'index.md');
  const targetMd = join(targetDir, 'index.md');
  let content = readFileSync(templateMd, 'utf-8');

  const now = new Date();
  const isoDate = now.toISOString().replace(/\.\d{3}Z$/, '');
  content = content.replace(/date:.*/, `date: ${isoDate}`);
  content = content.replace(/image:.*/, `image: '/imagens/noticias/${slug}/${slug}.jpg'`);

  writeFileSync(targetMd, content);

  console.log(`📰 Notícia criada: src/content/noticias/${slug}/`);
  console.log(`🖼️  Pasta de imagens: public/imagens/noticias/${slug}/`);
  console.log(`📅 Data: ${isoDate}`);
  console.log('');
  console.log('Próximos passos:');
  console.log(`  1. Edita src/content/noticias/${slug}/index.md (título, descrição, texto)`);
  console.log(`  2. Define sourceImage com a URL da foto da fonte`);
  console.log(`  3. Corre: node scripts/gerar-capa.mjs ${slug}`);
  console.log(`  4. Build + deploy`);
}

main();
