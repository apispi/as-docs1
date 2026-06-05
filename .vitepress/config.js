import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'ApiSpi Docs',
  description: 'Documentation for the ApiSpi platform — AI agents, Aria, connectors, and more.',

  themeConfig: {
    logo: '/logo.svg',
    siteTitle: 'ApiSpi Docs',

    nav: [
      { text: 'Home', link: '/' },
      { text: 'Platform', link: '/docs/overview' },
      { text: 'Agents', link: '/docs/agents' },
      { text: 'Aria', link: '/docs/aria' },
    ],

    sidebar: [
      {
        text: 'Platform',
        items: [
          { text: 'Overview', link: '/docs/overview' },
          { text: 'Architecture', link: '/docs/architecture' },
          { text: 'Authentication', link: '/docs/auth' },
        ],
      },
      {
        text: 'Agents & AI',
        items: [
          { text: 'Agents Catalogue', link: '/docs/agents' },
          { text: 'Aria AI Assistant', link: '/docs/aria' },
          { text: 'Connectors', link: '/docs/connectors' },
        ],
      },
      {
        text: 'Services',
        items: [
          { text: 'Training Courses', link: '/docs/training' },
          { text: 'Partner Program', link: '/docs/partners' },
        ],
      },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/apispi' },
    ],

    footer: {
      message: 'ApiSpi — AI agents for Australian businesses.',
      copyright: 'sales@apispi.com · Mon–Fri 9 AM–6 PM AEST',
    },

    search: {
      provider: 'local',
    },
  },
})
