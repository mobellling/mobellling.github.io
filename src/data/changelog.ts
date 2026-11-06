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
    version: '现在',
    title: '全站视觉与内容体验升级',
    items: [
      '统一清爽科技感视觉、背景装饰和卡片交互。',
      '新增更新日志与文章归档页面。',
      '全局搜索现在支持博客和动态，并按内容类型筛选。',
      '优化移动端导航、响应式间距和减少动态偏好。',
    ],
  },
  {
    date: '2026-11-05',
    version: 'v1.0',
    title: '网站基础内容整理',
    items: ['上线博客、动态、友链和个人页面。', '接入文章评论、站点统计和离线缓存能力。'],
  },
];
