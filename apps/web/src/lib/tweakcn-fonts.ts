import { JetBrains_Mono, Manrope } from "next/font/google";

/** Landing / marketing type: Manrope display+body, mono for code samples. */
export const tweakcnFontSans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const tweakcnFontMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const tweakcnFontClassName = [tweakcnFontSans.variable, tweakcnFontMono.variable].join(" ");
