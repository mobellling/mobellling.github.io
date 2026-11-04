#!/usr/bin/env node
/**
 * Generate app branding assets shared by the Windows (Electron) and Android builds.
 *
 * Source mark: `public/images/logo.svg` (Tabler "brand-alpine-js", stroke #014ecb).
 * Outputs into `apps/shared/branding/`:
 *   icon.svg, icon-512.png, icon-256.png, icon-192.png, icon-128.png,
 *   icon-96.png, icon-72.png, icon-64.png, icon-48.png, icon-32.png, icon-16.png
 *   ic-stat-update-96.png ... (white monochrome notification icons)
 *
 * The .ico is produced by `scripts/app/gen-ico.py` (Pillow), see apps/shared/branding/README.md.
 *
 * Usage: node scripts/app/gen-branding.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '../..');
const outDir = path.join(root, 'apps/shared/branding');

const APP_BLUE = '#014ecb';
const MARK = `
  <path d="M3 11.5l4.5 4.5h9l-9 -9l-4.5 4.5" />
  <path d="M16.5 16l4.5 -4.5l-4.5 -4.5l-4.5 4.5" />`;

/** Rounded-square app icon: blue tile + white mark. */
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="112" ry="112" fill="${APP_BLUE}"/>
  <g transform="translate(128 128) scale(10.666667)" fill="none" stroke="#ffffff" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round">${MARK}
  </g>
</svg>
`;

/** Monochrome white mark on transparent background (Android status-bar icon). */
const monoIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <g transform="translate(64 64) scale(16)" fill="none" stroke="#ffffff" stroke-width="2"
     stroke-linecap="round" stroke-linejoin="round">${MARK}
  </g>
</svg>
`;

const iconSizes = [16, 32, 48, 64, 72, 96, 128, 144, 192, 256, 512];
const monoSizes = [24, 36, 48, 72, 96, 192];

await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, 'icon.svg'), iconSvg, 'utf8');

const iconPng = await sharp(Buffer.from(iconSvg), { density: 384 }).png().toBuffer();
for (const size of iconSizes) {
  await sharp(iconPng).resize(size, size, { fit: 'contain' }).png({ compressionLevel: 9 }).toFile(
    path.join(outDir, `icon-${size}.png`)
  );
}

const monoPng = await sharp(Buffer.from(monoIconSvg), { density: 384 }).png().toBuffer();
for (const size of monoSizes) {
  await sharp(monoPng).resize(size, size, { fit: 'contain' }).png({ compressionLevel: 9 }).toFile(
    path.join(outDir, `ic-stat-update-${size}.png`)
  );
}

console.log(`[branding] wrote ${iconSizes.length} icon PNGs + ${monoSizes.length} monochrome PNGs to ${path.relative(root, outDir)}`);
