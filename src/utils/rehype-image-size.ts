import { visit } from 'unist-util-visit';

import { fetchRemoteImageSize, type ImageSize } from './image-size';

/** Adds intrinsic width/height to Markdown images so lazy-loaded content does not shift layout. */
export default function rehypeImageSize() {
  return async (tree: any) => {
    const images: any[] = [];
    visit(tree, 'element', (node: any) => {
      if (node.tagName !== 'img') return;
      const src = node.properties?.src;
      if (typeof src !== 'string' || !/^https?:\/\//i.test(src)) return;
      if (node.properties.width && node.properties.height) return;
      images.push(node);
    });

    if (images.length === 0) return;

    const unique = [...new Set(images.map((node) => String(node.properties.src)))];
    const sizes = new Map<string, ImageSize>();
    await Promise.all(
      unique.map(async (src) => {
        const size = await fetchRemoteImageSize(src);
        if (size) sizes.set(src, size);
      })
    );

    for (const node of images) {
      const size = sizes.get(String(node.properties.src));
      if (!size) continue;
      node.properties.width = size.width;
      node.properties.height = size.height;
    }
  };
}
