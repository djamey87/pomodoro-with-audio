import https from 'node:https';
import { parse } from 'node-html-parser';
import type { BrowseResult } from './types';

const SITE = 'https://listentoamovie.com';
const BASE = `${SITE}/media/`;

const HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Accept-Encoding': 'identity',
  'Connection': 'keep-alive',
};

function fetchHtml(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: HEADERS }, (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (c: Buffer) => chunks.push(c));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      })
      .on('error', reject);
  });
}

function makeId(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = ((hash << 5) - hash + url.charCodeAt(i)) | 0;
  }
  return (hash >>> 0).toString(36);
}

// Re-encode a file path that may have partially encoded segments
function encodePath(rawPath: string): string {
  return rawPath
    .split('/')
    .map(seg => encodeURIComponent(decodeURIComponent(seg)))
    .join('/');
}

export async function browseSoundtracks(folderBase64: string): Promise<BrowseResult> {
  const url = `${BASE}index.php?folder=${encodeURIComponent(folderBase64)}`;
  const html = await fetchHtml(url);
  const root = parse(html);

  const folders: BrowseResult['folders'] = [];
  const files: BrowseResult['files'] = [];
  const seen = new Set<string>();

  for (const link of root.querySelectorAll('a[href]')) {
    const href = link.getAttribute('href') ?? '';
    const name = link.text.trim().replace(/\s+/g, ' ');

    if (!name || name === '.' || name.startsWith('..')) continue;

    if (href.includes('index.php?folder=')) {
      // Sub-folder link: index.php?folder=<base64>
      const match = href.match(/[?&]folder=([^&\s"]+)/);
      if (match) {
        const b64 = decodeURIComponent(match[1]);
        // Skip the breadcrumb links (current folder and ancestors)
        const currentPath = Buffer.from(folderBase64, 'base64').toString('utf-8');
        const linkPath = Buffer.from(b64, 'base64').toString('utf-8');
        if (!seen.has(b64) && linkPath !== currentPath && linkPath.startsWith(currentPath)) {
          seen.add(b64);
          folders.push({ name, base64: b64 });
        }
      }
    } else if (href.includes('listen.php') && href.includes('file=')) {
      // File link: /listen.php?title=...&file=/media/./path/to/file.mp3
      const fileMatch = href.match(/[?&]file=([^&"]+)/);
      const titleMatch = href.match(/[?&]title=([^&"]+)/);
      if (fileMatch) {
        const rawPath = decodeURIComponent(fileMatch[1]);
        const fullUrl = SITE + encodePath(rawPath);
        if (!seen.has(fullUrl)) {
          seen.add(fullUrl);
          const title = titleMatch
            ? decodeURIComponent(titleMatch[1])
            : name.replace(/\.mp3$/i, '');
          files.push({ name: title, url: fullUrl, id: makeId(fullUrl) });
        }
      }
    }
  }

  const currentPath = Buffer.from(folderBase64, 'base64').toString('utf-8');
  return { folders, files, currentPath };
}
