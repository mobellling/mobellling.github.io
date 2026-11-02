import { getPermalink, getBlogPermalink, getAsset } from './utils/permalinks';

export const headerData = {

  links: [
    
    {
      text: '主页',
      href: '/', // 指向你的首页
    },    
       {
      text: '博客',
      links: [
        {
          text: '博客列表',
          href: getBlogPermalink(),
        },
        // {
        //   text: '文章',
        //   href: getPermalink('get-started-website-with-astro-tailwind-css', 'post'),
        // },
        // {
        //   text: '投稿',
        //   href: /page/friend,
        // },
        // {
        //   text: 'Category Page',
        //   href: getPermalink('tutorials', 'category'),
        // },
        {
          text: '搜索',
          href: '/search/',
        },
      ],
    },

    {
      text: '其他',
      links: [
        // {
        //   text: 'SaaS',
        //   href: getPermalink('/homes/saas'),
        // },
        // {
        //   text: 'Startup',
        //   href: getPermalink('/homes/startup'),
        // },
        {
          text: '友链',
          href: getPermalink('/other/friends'),
        },
        // {
        //   text: 'Personal',
        //   href: getPermalink('/homes/personal'),
        // },
      ],
    },
    // {
    //   text: 'Pages',
    //   links: [
    //     {
    //       text: 'Features (Anchor Link)',
    //       href: getPermalink('/#features'),
    //     },
    //     {
    //       text: 'Services',
    //       href: getPermalink('/services'),
    //     },
    //     {
    //       text: 'Pricing',
    //       href: getPermalink('/pricing'),
    //     },
    //     {
    //       text: 'About us',
    //       href: getPermalink('/about'),
    //     },
    //     {
    //       text: 'Contact',
    //       href: getPermalink('/contact'),
    //     },
    //     {
    //       text: 'Terms',
    //       href: getPermalink('/terms'),
    //     },
    //     {
    //       text: 'Privacy policy',
    //       href: getPermalink('/privacy'),
    //     },
    //   ],
    // },
    // {
    //   text: 'Landing',
    //   links: [
    //     {
    //       text: 'Lead Generation',
    //       href: getPermalink('/landing/lead-generation'),
    //     },
    //     {
    //       text: 'Long-form Sales',
    //       href: getPermalink('/landing/sales'),
    //     },
    //     {
    //       text: 'Click-Through',
    //       href: getPermalink('/landing/click-through'),
    //     },
    //     {
    //       text: 'Product Details (or Services)',
    //       href: getPermalink('/landing/product'),
    //     },
    //     {
    //       text: 'Coming Soon or Pre-Launch',
    //       href: getPermalink('/landing/pre-launch'),
    //     },
    //     {
    //       text: 'Subscription',
    //       href: getPermalink('/landing/subscription'),
    //     },
    //   ],
    // },
 
  ],
  // actions: [{ text: 'Download', href: 'https://github.com/arthelokyo/astrowind', target: '_blank' }],
};

export const footerData = {
  links: [
    {
      title: '友情链接',
      target: '_blank',
      links: [
        { text: '哔哩哔哩', href: 'https://www.bilibili.com' },
        { text: 'Majone-soul', href: getPermalink('https://www.maj-soul.com') },
        { text: 'Github', href: getPermalink('https://github.com') },
        { text: 'Calculus Made Easy', href: getPermalink('https://master-g.github.io/calculus-made-easy-zh/') },
      ],
    },
    // {
    //   title: 'Demos',
    //   links: [
    //     { text: 'SaaS', href: getPermalink('/homes/saas') },
    //     { text: 'Startup', href: getPermalink('/homes/startup') },
    //     { text: 'Mobile App', href: getPermalink('/homes/mobile-app') },
    //     { text: 'Personal', href: getPermalink('/homes/personal') },
    //     { text: 'Landing pages', href: getPermalink('/landing/lead-generation') },
    //   ],
    // },
    {
      title: '资源',
      
      links: [
        { text: 'Astro相关文档', href: 'https://docs.astro.build/en/getting-started/' },
        { text: '源文件', href: 'https://github.com/mobellling/blog' },
        { text: '联系', href: getPermalink('/contact') },
        { text: 'Blog', href: getBlogPermalink() },
        { text: '图片转webp', href: 'https://wefreestar.com/zh/toolbox/image-to-webp' },
        { text: 'webp裁切', href: 'https://imageresizer.com/zh/%E8%A3%81%E5%89%AA-webp' },
        { text: '文本加空行', href: 'https://uutool.cn/list-new-line' },
        { text: 'DeepSeek API文档', herf:'https://api-docs.deepseek.com/zh-cn/' },
      ],
    },
    {
      title: '特别鸣谢',
      target: '_blank',
      links: [
        { text: 'neonmz', href: 'https://neonmz.github.io/',
          
        },
       
        // { text: 'Report an issue', href: 'https://github.com/arthelokyo/astrowind/issues' },
        // { text: 'License', href: 'https://github.com/arthelokyo/astrowind/blob/main/LICENSE.md' },
      ],
    },
  ],
  secondaryLinks: [
    { text: '个人版权所有', href: '' },
    { text: 'Privacy Policy', href: getPermalink('/privacy') },
  ],
  socialLinks: [
    { ariaLabel: 'RSS', icon: 'tabler:rss', href: getAsset('/rss.xml') },
    { ariaLabel: 'Github', icon: 'tabler:brand-github', href: 'https://github.com/arthelokyo/astrowind' },
  ],
  footNote: `
    Made by <a class="text-blue-600 underline dark:text-muted" > Mobell</a> · All rights reserved.
  `,
};
