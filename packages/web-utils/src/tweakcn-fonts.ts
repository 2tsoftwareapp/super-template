import { Inter, JetBrains_Mono } from "next/font/google";

/** Fonts paired with the tweakcn Light Green preset. */
export const tweakcnFontSans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const tweakcnFontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const tweakcnFontClassName = [tweakcnFontSans.variable, tweakcnFontMono.variable].join(" ");
