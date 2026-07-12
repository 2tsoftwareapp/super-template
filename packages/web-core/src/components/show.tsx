import * as React from "react";

interface ShowProps {
  when: unknown;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

function Show({ when, fallback = null, children }: ShowProps) {
  return when ? <>{children}</> : <>{fallback}</>;
}

export { Show };
