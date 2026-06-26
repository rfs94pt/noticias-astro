# Notícias d'Astro — Workflow Automatizado

## Resumo do Projeto

Site de notícias estático gerado com **Astro 5**, hospedado na **Cloudflare Pages** (domínio `noticiasdastro.site`). O conteúdo é baseado em artigos do Correio da Manhã (`cmjornal.pt`), reescritos em português com estrutura própria.

- **Repositório:** `git@github.com:rfs94pt/noticias-astro.git`
- **Domínio:** `https://noticiasdastro.site`
- **Pages dev:** `https://noticias-astro.pages.dev`
- **Workers dev:** `https://noticias-astro.ricardoffcs.workers.dev` (testes)
- **Cloudflare account:** `ricardoffcs@gmail.com`

---

## Estrutura de Pastas

```
src/
  content/
    config.ts              # Schema das notícias (title, description, date, category, image, tags, source, sourceImage)
    noticias/
      _template/index.md   # Template base para novas notícias
      <slug>/index.md      # Cada notícia é uma pasta com index.md
  pages/
    index.astro            # Homepage (lista as últimas notícias, herói = a mais recente)
    noticias/[slug].astro  # Página de detalhe de notícia
    categorias/[categoria].astro
  layouts/
    NoticiaLayout.astro    # Layout com sidebar de ads
  components/
    ads/                   # Componentes de anúncios (AdSense, Vidverto, MGID)
    NoticiaCard.astro      # Card de notícia para listas
  styles/global.css        # Estilos globais + .video-container

scripts/
  criar-noticia.mjs        # Cria a estrutura de uma nova notícia a partir do template
  gerar-capa.mjs           # Gera imagem de capa (1200x630): blur + overlay do título

public/imagens/noticias/<slug>/  # Imagens de capa geradas
dist/                            # Build output (upload para Cloudflare Pages)
```

---

## Fluxo Completo para Criar uma Notícia

### 1. Obter o link do CM

O utilizador fornece um URL do Correio da Manhã, ex:
`https://www.cmjornal.pt/mundo/detalhe/mulher-da-a-luz-entre-os-escombros-apos-sismos-que-atingiram-a-venezuela`

### 2. Extrair informações do artigo

Fazer fetch da página (modo markdown e html) para obter:
- **Título** — da tag `<h1>` ou `<title>`
- **Descrição** — do lead ou meta description
- **Data de publicação** — do artigo
- **Categoria** — Mundo, Sociedade, Desporto, Política, etc.
- **Imagem** — URL da imagem principal do artigo (normalmente em `cdn.cmjornal.pt`), usar como `sourceImage`
- **Corpo do texto** — reescrever num estilo jornalístico próprio, com 2-4 parágrafos, subtítulos, citações, tabelas
- **Fonte** — "Correio da Manhã" (acrescentar agências como Lusa, AP, 20 Minutos, etc.)
- **Vídeo** — se o artigo tiver vídeo, procurar no YouTube ou na CMTV

### 3. Encontrar o vídeo no YouTube (SE aplicável)

Se a notícia tem vídeo:
1. Fazer fetch da página de vídeo CMTV (`/cmtv/videos/detalhe/<slug>`)
2. Procurar o título do vídeo no YouTube com `curl`:
   ```bash
   curl -s "https://www.youtube.com/results?search_query=<titulo+url+encoded>" \
     -H "User-Agent: Mozilla/5.0" | grep -oP '"videoId":"[^"]*"' | head -5
   ```
3. Verificar qual videoId corresponde ao vídeo correto (fazer fetch do watch page para ver o título)
4. Usar o formato de embed: `<div class="video-container"><iframe src="https://www.youtube.com/embed/<VIDEO_ID>" ...></iframe></div>`

### 4. Escolher o slug

Baseado no título, em português, lowercase, sem acentos, separado por hífens, ex:
`mulher-da-a-luz-escombros-venezuela`

### 5. Criar a estrutura

```bash
node scripts/criar-noticia.mjs <slug>
```

Isto cria:
- `src/content/noticias/<slug>/index.md` (com data atual e image placeholder)
- `public/imagens/noticias/<slug>/` (pasta vazia para a capa)

### 6. Editar o index.md

Preencher o frontmatter e o corpo. Campos obrigatórios:

```yaml
---
title: 'Título da Notícia'
description: 'Breve descrição (1-2 frases) para SEO e cards.'
date: 2026-06-26T15:02:00      # Data da notícia original
category: 'Mundo'               # Mundo | Sociedade | Desporto | Política
image: '/imagens/noticias/<slug>/<slug>.jpg'
tags: ['tag1', 'tag2', 'tag3']
author: "Notícias d'Astro"
source: 'Correio da Manhã'
sourceImage: '<URL_DA_IMAGEM_DO_CM>'   # Usar sempre a imagem real do artigo do CM!
---
```

**IMPORTANTE:** O campo `sourceImage` deve conter a URL da imagem real do artigo do CM (normalmente `cdn.cmjornal.pt/images/...`). Isto é usado pelo `gerar-capa.mjs` para criar a capa com blur + overlay.

Corpo da notícia:
- Parágrafo de lead (responde a quem, o quê, quando, onde, porquê)
- Subtítulos com `## Título`
- Citações com `>` (blockquote)
- Tabelas com `| col1 | col2 |`
- Vídeo embed no final (se aplicável)
- `**Fonte:** Correio da Manhã` no final

### 7. Gerar a capa

```bash
node scripts/gerar-capa.mjs <slug>
```

Este script:
1. Lê o `index.md` para obter `title` e `sourceImage`
2. Faz download da imagem do `sourceImage`
3. Aplica blur e escurecimento
4. Adiciona overlay SVG com o título (fonte Arial Black, stroke preto)
5. Guarda em `public/imagens/noticias/<slug>/<slug>.jpg`
6. Atualiza o campo `image` no frontmatter

Tamanho da capa: 1200x630px (formato Open Graph).

### 8. Build e Deploy

**⚠️ CRÍTICO: Usar SEMPRE Pages deploy, NUNCA Workers deploy!**

O domínio `noticiasdastro.site` está ligado ao projeto **Cloudflare Pages** `noticias-astro`, NÃO ao Worker `noticias-astro`. O Worker (`wrangler deploy`) só atualiza o domínio workers.dev.

```bash
npm run deploy
# que executa: astro build && wrangler pages deploy dist/ --project-name=noticias-astro
```

Ou manualmente:
```bash
npm run build
npx wrangler pages deploy dist/ --project-name=noticias-astro
```

### 9. Commit e Push

```bash
git add src/content/noticias/<slug>/ public/imagens/noticias/<slug>/
git commit -m "Xa noticia: <título-curto>"
git push
```

---

## Schemas e Configurações

### Frontmatter Schema (`src/content/config.ts`)
```typescript
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
})
```

### Site Config (`src/site.config.ts`)
- URL: `https://noticiasdastro.site`
- Locale: `pt_PT`
- AdSense: `ca-pub-1241107508480595`

### Cloudflare Pages
- **Project name:** `noticias-astro`
- **Domains:** `noticias-astro.pages.dev`, `noticiasdastro.site`
- **Build output dir:** `dist/`
- **Deploy command:** `npx wrangler pages deploy dist/ --project-name=noticias-astro`

### Cloudflare Workers (apenas para workers.dev)
- **Worker name:** `noticias-astro`
- **URL:** `noticias-astro.ricardoffcs.workers.dev`
- **Deploy command:** `npx wrangler deploy` (não usar para produção!)

---

## Lista de Notícias Existentes

| # | Slug | Categoria | Data |
|---|------|-----------|------|
| 1 | `eleicoes-autarquicas-abstencao-atinge-novo-recorde-historico` | Política | 24/06/2026 |
| 2 | `portugal-goleia-usbequistao-mundial-2026` | Desporto | 24/06/2026 |
| 3 | `franca-primeiro-caso-ebola` | Mundo | 24/06/2026 |
| 4 | `colisao-comboios-inglaterra-sinal-vermelho` | Mundo | 25/06/2026 |
| 5 | `autocarro-carris-incendeia-odivelas` | Sociedade | 25/06/2026 |
| 6 | `franca-tempestades-alerta-calor-extremo` | Mundo | 25/06/2026 |
| 7 | `venezuela-sismos-32-mortos-700-feridos` | Mundo | 25/06/2026 |
| 8 | `video-destruicao-vtv-venezuela-sismos` | Mundo | 25/06/2026 |
| 9 | `teto-aeroporto-caracas-desaba-sismos-venezuela` | Mundo | 25/06/2026 |
| 10 | `homem-atropelado-mortalmente-a1-mealhada-ambulancia` | Sociedade | 25/06/2026 |
| 11 | `mulher-da-a-luz-escombros-venezuela` | Mundo | 26/06/2026 |

---

## Erros Comuns e Soluções

1. **Fonte do vídeo:** O CM usa Brightcove como player interno. É preciso encontrar o equivalente no YouTube (via pesquisa curl). Não usar iframes do CMTV (não funcionam fora do site deles).

2. **Deploy errado:** Usar `wrangler pages deploy dist/ --project-name=noticias-astro` (NÃO `wrangler deploy`).

3. **Data no futuro:** A data da notícia deve ser a data de publicação do artigo original no CM, não a data atual. Ajustar o campo `date` no frontmatter após o `criar-noticia.mjs`.

4. **sourceImage:** Usar sempre a URL da imagem original do artigo do CM (formato `cdn.cmjornal.pt/images/...`). Só usar Unsplash se a notícia não tiver imagem.

5. **Capa não aparece:** Verificar se o `gerar-capa.mjs` correu com sucesso e se o campo `image` no frontmatter foi atualizado.

6. **Build falha com conteúdo duplicado:** Pode haver slugs iguais ou conflitos de ID. Verificar com `git status`.
