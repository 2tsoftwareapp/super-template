import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

// Locale-aware drop-in replacements for next/navigation + next/link.
// All internal navigation MUST use these so the locale prefix is preserved.
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
