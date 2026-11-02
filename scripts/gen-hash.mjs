#!/usr/bin/env node
/**
 * Generate the service-worker manifest `dist/_hash`.
 *
 * Format (one file per line, sorted, deterministic):
 *
 *   /index.html 3f2a...
 *   /_astro/Layout.abc123.css 9b7c...
 *
 * The hash is a shortened SHA-256 of the file bytes. The SW only uses it to
 * decide which files changed between deploys; it does not verify contents.
 *
 * Run automatically by `npm run build` (postbuild), after `astro build` and
 * `pagefind` have finished. You can also run it standalone:
 *
 *   node scripts/gen-hash.mjs
 *   node scripts/gen-hash.mjs --root dist --hash-length 16
 */
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readdir, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const args = process.argv.slice(2);

/** @param {string} name */
function getArg(name) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  return args[index + 1];
}

const root = path.resolve(getArg('--root') ?? 'dist');
const outFile = path.resolve(getArg('--out') ?? path.join(root, '_hash'));
const hashLength = Number.parseInt(getArg('--hash-length') ?? '16', 10);

if (!Number.isInteger(hashLength) || hashLength < 8 || hashLength > 64) {
  console.error('[sw] --hash-length must be an integer between 8 and 64');
  process.exit(1);
}

const SKIP_FILES = new Set(['_hash', '.DS_Store', 'Thumbs.db']);

try {
  const rootStat = await stat(root);
  if (!rootStat.isDirectory()) throw new Error(`${root} is not a directory`);
} catch (error) {
  console.error(`[sw] build directory not found: ${root}`);
  console.error(`[sw] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

/**
 * @param {string} directory
 * @returns {Promise<string[]>}
 */
async function walk(directory) {
  /** @type {string[]} */
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;

    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await walk(absolute)));
    } else if (entry.isFile() && !SKIP_FILES.has(entry.name)) {
      files.push(absolute);
    }
  }

  return files;
}

/**
 * @param {string} file
 * @returns {Promise<string>}
 */
function hashFile(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha256');
    createReadStream(file)
      .on('error', reject)
      .on('data', (chunk) => hash.update(chunk))
      .on('end', () => resolve(hash.digest('hex').slice(0, hashLength)));
  });
}

const absoluteFiles = await walk(root);

/** @type {{ urlPath: string, hash: string }[]} */
const entries = [];
for (const file of absoluteFiles) {
  const relative = path.relative(root, file).split(path.sep).join('/');
  entries.push({
    // URL path as a browser sees it. Unicode/space file names are kept raw
    // here; the service worker canonicalises each line with `new URL()`.
    urlPath: `/${relative}`,
    hash: await hashFile(file),
  });
}

entries.sort((a, b) => (a.urlPath < b.urlPath ? -1 : a.urlPath > b.urlPath ? 1 : 0));

const lines = entries.map(({ urlPath, hash }) => `${urlPath} ${hash}`);
const output = `${lines.join('\n')}\n`;

await writeFile(outFile, output, 'utf8');

const sizeKb = (Buffer.byteLength(output) / 1024).toFixed(1);
console.log(`[sw] wrote ${path.relative(process.cwd(), outFile)} (${entries.length} files, ${sizeKb} KB)`);
