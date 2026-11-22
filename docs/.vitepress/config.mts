import { defineConfig } from "vitepress";

const repo = "https://github.com/2tsoftwareapp/super-template";

export default defineConfig({
  title: "super-template",
  description:
    "Lean four-surface starter: NestJS API, Next.js web and admin, Flutter mobile, Postgres worker.",
  base: "/super-template/",
  cleanUrls: true,
  lastUpdated: true,
  srcExclude: ["**/node_modules/**"],
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "API", link: "/guide/api" },
      { text: "Conventions", link: "/CONVENTIONS" },
    ],
    sidebar: [
      {
        text: "Start here",
        items: [
          { text: "Getting started", link: "/guide/getting-started" },
          { text: "Architecture", link: "/guide/architecture" },
          { text: "Configuration", link: "/guide/configuration" },
        ],
      },
      {
        text: "Backend",
        items: [
          { text: "API reference", link: "/guide/api" },
          { text: "Authentication", link: "/guide/auth" },
          { text: "Jobs and worker", link: "/guide/jobs" },
        ],
      },
      {
        text: "Clients",
        items: [
          { text: "Admin and web", link: "/guide/frontends" },
          { text: "Mobile", link: "/guide/mobile" },
        ],
      },
      {
        text: "Rules",
        items: [
          { text: "Conventions", link: "/CONVENTIONS" },
          { text: "AGENTS.md (contract)", link: `${repo}/blob/main/AGENTS.md` },
        ],
      },
    ],
    socialLinks: [{ icon: "github", link: repo }],
    editLink: { pattern: `${repo}/edit/main/docs/:path` },
    search: { provider: "local" },
  },
});
