import { getCollection, render } from 'astro:content';
import type { CollectionEntry } from 'astro:content';
import { getCanonical } from '~/utils/permalinks';

export interface Moment {
  id: string;
  date: Date;
  images: string[];
  text: string;
  Content: Awaited<ReturnType<typeof render>>['Content'];
  url: string;
}

const dateFormatter = new Intl.DateTimeFormat('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Shanghai',
});

export const formatMomentDate = (date: Date): string => dateFormatter.format(date);

/** A plain-text summary used for metadata and empty alt text. */
export const momentText = (entry: CollectionEntry<'moments'>): string =>
  String(entry.body || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_>#~]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export async function getPublishedMoments(): Promise<Moment[]> {
  const entries = await getCollection('moments', ({ data }) => !data.draft);
  const moments = await Promise.all(
    entries.map(async (entry) => {
      const { Content } = await render(entry);
      const date = new Date(entry.data.date);
      return {
        id: entry.id,
        date,
        images: entry.data.images || [],
        text: momentText(entry),
        Content,
        url: getCanonical(`/moments/${entry.id}/`).toString(),
      } satisfies Moment;
    })
  );
  return moments.sort((a, b) => b.date.getTime() - a.date.getTime());
}
