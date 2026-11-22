"use client";

import { useState, type FormEvent } from "react";

/** Pending + error state around a submit; `action` resolves to an error message or null. */
export function useFormAction(action: () => Promise<string | null>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    setPending(true);
    setError(null);
    const failure = await action();
    setPending(false);
    setError(failure);
  }

  return { pending, error, submit };
}
