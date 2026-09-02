"use client";

import { FullScreenLoading } from "@repo/web-ui/loading";

interface LoginStatusProps {
  message: string;
}

export function LoginStatus({ message }: LoginStatusProps) {
  return (
    <FullScreenLoading
      title={message}
      description="Verifying credentials and workspace permissions..."
    />
  );
}
