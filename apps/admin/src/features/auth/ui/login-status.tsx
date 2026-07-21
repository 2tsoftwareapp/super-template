"use client";

interface LoginStatusProps {
  message: string;
}

export function LoginStatus({ message }: LoginStatusProps) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
