#!/usr/bin/env node
/**
 * AGENT 1 (GEMINI HYDROGEN) — Collecteur de nouvelles mondiales & Images Wikimedia Commons
 * Usage :
 *   node 1-amont-gemini-hydrogen/collect-news.mjs
 *   node 1-amont-gemini-hydrogen/collect-news.mjs --wikimedia "Hydro-Quebec dam"
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

const RSS_SOURCES = [
  { id: 'bbc-world', name: 'BBC News World', region: 'Global (UK)', url: 'https://feeds.bbci.co.uk/news/world/rss.xml' },
  { id: 'france24-monde', name: 'France 24 Monde', region: 'Global (FR)', url: 'https://www.france24.com/fr/rss' },
  { id: 'rc-monde', name: 'Radio-Canada International', region: 'Canada / Monde', url: 'https://ici.radio-canada.ca/rss/4159' },
  { id: 'un-news', name: 'ONU Info', region: 'International', url: 'https://news.un.org/feed/subscribe/fr/news/all/rss.xml' },
  { id: 'aljazeera', name: 'Al Jazeera English', region: 'Global (ME)', url: 'https://www.aljazeera.com/xml/rss/all.xml' }
];

function extractTag(xmlChunk, tag) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = xmlChunk.match(regex);
  if (!match) return '';
  return match[1]
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'")
    .trim();
}

function parseRssItems(xml, sourceMeta, limit = 10) {
  const items = [];
  const itemRegex = /<item[\s\S]*?<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const chunk = match[0];
    const title = extractTag(chunk, 'title');
    const description = extractTag(chunk, 'description');
    const link = extractTag(chunk, 'link');
    const pubDate = extractTag(chunk, 'pubDate');
    if (title) {
      items.push({
        sourceId: sourceMeta.id,
        sourceName: sourceMeta.name,
        region: sourceMeta.region,
        title,
        summary: description.slice(0, 320),
        link,
        pubDate
      });
    }
  }
  return items;
}

/**
 * Recherche d'images 100 % libres de droits sur Wikimedia Commons
 * (Domaine public, CC0, CC-BY, CC-BY-SA uniquement — aucun générateur IA)
 */
export async function searchWikimediaCommons(query, limit = 5) {
  const endpoint = new URL('https://commons.wikimedia.org/w/api.php');
  endpoint.searchParams.set('action', 'query');
  endpoint.searchParams.set('generator', 'search');
  endpoint.searchParams.set('gsrsearch', `filetype:bitmap ${query}`);
  endpoint.searchParams.set('gsrnamespace', '6'); // File:
  endpoint.searchParams.set('gsrlimit', String(limit));
  endpoint.searchParams.set('prop', 'imageinfo');
  endpoint.searchParams.set('iiprop', 'url|extmetadata|dimensions');
  endpoint.searchParams.set('iiurlwidth', '1280');
  endpoint.searchParams.set('format', 'json');
  endpoint.searchParams.set('origin', '*');

  const res = await fetch(endpoint, {
    headers: { 'User-Agent': 'BulletinQCStudio/1.0 (Educational News Explainer)' }
  });
  if (!res.ok) {
    throw new Error(`Wikimedia API HTTP ${res.status}`);
  }
  const data = await res.json();
  const pages = data?.query?.pages ? Object.values(data.query.pages) : [];

  return pages
    .map((p) => {
      const info = p.imageinfo?.[0];
      if (!info) return null;
      const meta = info.extmetadata || {};
      const clean = (val) => (val?.value ? String(val.value).replace(/<[^>]+>/g, '').trim() : '');
      const licenseShort = clean(meta.LicenseShortName) || 'Wikimedia Commons';
      const artist = clean(meta.Artist) || 'Wikimedia Commons';
      return {
        title: p.title.replace(/^File:/, ''),
        thumbUrl: info.thumburl || info.url,
        fullUrl: info.url,
        width: info.width,
        height: info.height,
        license: licenseShort,
        author: artist,
        attributionText: `Photo : ${artist} (${licenseShort} • Wikimedia Commons)`
      };
    })
    .filter(Boolean);
}

async function main() {
  const args = process.argv.slice(2);
  const wikiIdx = args.indexOf('--wikimedia');

  if (wikiIdx !== -1 && args[wikiIdx + 1]) {
    const query = args[wikiIdx + 1];
    console.log(`🔎 Recherche d'images libres de droits sur Wikimedia Commons pour : "${query}"...`);
    const results = await searchWikimediaCommons(query, 5);
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  const today = new Date().toISOString().slice(0, 10);
  const episodeDir = path.join(ROOT_DIR, 'episodes', today);
  fs.mkdirSync(episodeDir, { recursive: true });

  console.log(`🌍 Collecte des grands titres mondiaux pour le bulletin du ${today}...`);
  const allHeadlines = [];

  for (const src of RSS_SOURCES) {
    try {
      const res = await fetch(src.url, {
        headers: { 'User-Agent': 'BulletinQCStudio/1.0' },
        signal: AbortSignal.timeout(8000)
      });
      if (res.ok) {
        const xml = await res.text();
        const items = parseRssItems(xml, src, 8);
        allHeadlines.push(...items);
        console.log(`  ✓ ${src.name} : ${items.length} articles récupérés`);
      } else {
        console.warn(`  ⚠ ${src.name} : HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn(`  ⚠ Impossible de joindre ${src.name} (${err.message})`);
    }
  }

  const outputPath = path.join(episodeDir, 'raw-news-digest.json');
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        date: today,
        collectedAt: new Date().toISOString(),
        totalArticles: allHeadlines.length,
        articles: allHeadlines
      },
      null,
      2
    ),
    'utf8'
  );

  console.log(`\n✅ Digest enregistré dans : ${outputPath}`);
  console.log(`👉 Prochaine étape : Demandez à Gemini Hydrogen de générer storyboard.json et teleprompteur.md à partir de ce fichier.`);
}

main().catch((err) => {
  console.error('Erreur:', err.message);
  process.exit(1);
});
