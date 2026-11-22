import DefaultTheme from "vitepress/theme";
import type { Theme } from "vitepress";
import { installDiagramZoom } from "./diagram-zoom";
import "./custom.css";

export default {
  extends: DefaultTheme,
  enhanceApp() {
    if (typeof window !== "undefined") installDiagramZoom();
  },
} satisfies Theme;
