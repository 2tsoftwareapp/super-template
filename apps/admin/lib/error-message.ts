export async function errorMessage(response: Response, fallback: string): Promise<string> {
  const body = (await response.json().catch(() => ({}))) as { error?: { message?: string } };

  return body.error?.message ?? fallback;
}
