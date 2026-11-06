export interface ChangelogEntry {
  date: string;
  version: string;
  title: string;
  items: string[];
}

/** Add the newest site update at the top of this list. */
export const changelog: ChangelogEntry[] = [
  {
    date: '2026-11-06',
    version: 'v1.7',
    title: '全站视觉与内容体验升级',
    items: [
      '统一清爽科技感视觉、背景装饰和卡片交互。',
      '新增更新日志与文章归档页面。',
      '全局搜索现在支持博客和动态，并按内容类型筛选。',
      '优化移动端导航、响应式间距和减少动态偏好。',
      '优化评论区显示。',
    ],
  },
  {
    date: '2026-11-05',
    version: 'v1.6',
    title: '网站升级',
    items: ['新增动态页。', '持续更新相关软件。'],
  },
  {
    date: '2026-11-03',
    version: 'v1.5',
    title: '网站布局调整',
    items: ['新增浏览数统计。', '持续更新相关软件。'],
  },
  {
    date: '2026-11-02',
    version: 'v1.4',
    title: '网站拓展',
    items: ['实现网站APP化，支持Windows和Android双端。', '新增网站监控软件。'],
  },
  {
    date: '2026-11-01',
    version: 'v1.3',
    title: '网站进阶内容更新',
    items: ['新增友链。优化网页加载速度。实现全网站缓存', '完善投稿功能。'],
  },
  {
    date: '2026-10-30',
    version: 'v1.2',
    title: '网站进阶内容更新',
    items: ['上线多篇博客。', '完善投稿功能。'],
  },
  {
    date: '2026-10-28',
    version: 'v1.1',
    title: '网站基础内容增加',
    items: ['上线搜索功能。新增一系列要素。', '上线投稿功能。'],
  },
  {
    date: '2026-10-26',
    version: 'v1.0',
    title: '网站基础内容整理',
    items: ['上线博客和个人页面。', '接入文章评论。'],
  },
];
