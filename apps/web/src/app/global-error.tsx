"use client"; // Error boundaries must be Client Components.

import "./globals.css";

/**
 * Last-resort boundary: replaces the root layout when it is the thing that
 * failed, so it ships its own <html>/<body> and cannot rely on providers,
 * next-intl messages, or the theme script. See CODING_RULES.md §18.2.
 */
export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <title>Something went wrong</title>
        <main
          style={{
            display: "flex",
            minHeight: "100vh",
            alignItems: "center",
            justifyContent: "center",
            padding: "2rem",
            fontFamily: "system-ui, sans-serif",
            textAlign: "center",
          }}
        >
          <div style={{ maxWidth: "28rem" }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 600 }}>This page failed to load</h1>
            <p style={{ marginTop: "0.5rem", color: "#666" }}>
              An unexpected error broke the application shell. Retrying reloads the page.
            </p>
            {error.digest ? (
              <p style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#999" }}>
                Reference: {error.digest}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => unstable_retry()}
              style={{
                marginTop: "1.5rem",
                padding: "0.5rem 1rem",
                borderRadius: "0.375rem",
                border: "1px solid #ccc",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
