"use client";

import type { ComponentProps, ReactNode } from "react";

import { ResourcePageShell as KernelResourcePageShell } from "@repo/web-ui/resource-page-shell";

import { Link } from "@/i18n/navigation";

function LocaleLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children?: ReactNode;
}) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

export function ResourcePageShell(
  props: Omit<ComponentProps<typeof KernelResourcePageShell>, "linkComponent">,
) {
  return <KernelResourcePageShell {...props} linkComponent={LocaleLink} />;
}
