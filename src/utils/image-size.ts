import fs from 'node:fs';
import path from 'node:path';

export type ImageSize = { width: number; height: number };

const CACHE_FILE = path.join(process.cwd(), 'node_modules', '.cache', 'mobell-image-size.json');

let cache: Record<string, ImageSize> = {};
try {
  cache = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf8'));
} catch {
  cache = {};
}

function readUInt24LE(buffer: Buffer, offset: number) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

/** Minimal WebP / PNG / JPEG / GIF dimension reader (enough for blog images). */
export function imageSize(buffer: Buffer): ImageSize | undefined {
  if (buffer.length < 24) return undefined;

  if (buffer.readUInt32BE(0) === 0x89504e47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (buffer.toString('ascii', 0, 3) === 'GIF') {
    return { width: buffer.readUInt16LE(6), height: buffer.readUInt16LE(8) };
  }

  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8X') {
      return { width: readUInt24LE(buffer, 24) + 1, height: readUInt24LE(buffer, 27) + 1 };
    }
    if (chunk === 'VP8 ') {
      return { width: buffer.readUInt16LE(26) & 0x3fff, height: buffer.readUInt16LE(28) & 0x3fff };
    }
    if (chunk === 'VP8L') {
      const b0 = buffer[21];
      const b1 = buffer[22];
      const b2 = buffer[23];
      const b3 = buffer[24];
      return {
        width: 1 + (((b1 & 0x3f) << 8) | b0),
        height: 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)),
      };
    }
    return undefined;
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = buffer[offset + 1];
      if (marker === 0xd8 || marker === 0xd9) {
        offset += 2;
        continue;
      }
      const length = buffer.readUInt16BE(offset + 2);
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) };
      }
      offset += 2 + length;
    }
  }

  return undefined;
}

function saveCache() {
  try {
    fs.mkdirSync(path.dirname(CACHE_FILE), { recursive: true });
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache));
  } catch {
    // best effort
  }
}

/** Fetch (and cache) intrinsic dimensions for a remote image. */
export async function fetchRemoteImageSize(src: string): Promise<ImageSize | undefined> {
  if (cache[src]) return cache[src];
  if (!/^https?:\/\//i.test(src)) return undefined;
  try {
    const response = await fetch(src, { headers: { 'user-agent': 'mobell-build' } });
    if (!response.ok) return undefined;
    const buffer = Buffer.from(await response.arrayBuffer());
    const size = imageSize(buffer);
    if (size && size.width > 0 && size.height > 0) {
      cache[src] = size;
      saveCache();
      return size;
    }
  } catch {
    return undefined;
  }
  return undefined;
}
