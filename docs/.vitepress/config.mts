import { defineConfig } from "vitepress";

const repo = "https://github.com/2tsoftwareapp/super-template";

export default defineConfig({
  title: "super-template",
  description:
    "Lean four-surface starter: NestJS API, Next.js web and admin, Flutter mobile, Postgres worker.",
  base: "/super-template/",
  cleanUrls: true,
  ignoreDeadLinks: "localhostLinks",
  lastUpdated: true,
  srcExclude: ["**/node_modules/**"],
  themeConfig: {
    nav: [
      { text: "Guide", link: "/guide/getting-started" },
      { text: "Add a feature", link: "/guide/add-a-feature" },
      { text: "API", link: "/guide/api" },
      { text: "Deploy", link: "/guide/deployment" },
      { text: "Conventions", link: "/CONVENTIONS" },
    ],
    sidebar: [
      {
        text: "Start here",
        items: [
          { text: "Getting started", link: "/guide/getting-started" },
          { text: "Architecture", link: "/guide/architecture" },
          { text: "Configuration", link: "/guide/configuration" },
          { text: "Make it yours", link: "/guide/customizing" },
        ],
      },
      {
        text: "Build",
        items: [
          { text: "Add a feature", link: "/guide/add-a-feature" },
          { text: "Testing", link: "/guide/testing" },
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
        text: "Operate",
        items: [
          { text: "Deployment", link: "/guide/deployment" },
          { text: "Troubleshooting", link: "/guide/troubleshooting" },
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
