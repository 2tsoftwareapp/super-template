const adminUrl = process.env.ADMIN_URL ?? "http://localhost:3002";

export default function LandingPage() {
  return (
    <main
      style={{
        maxWidth: 720,
        margin: "12vh auto",
        fontFamily: "system-ui",
        padding: 24,
        lineHeight: 1.6,
      }}
    >
      <h1 style={{ fontSize: 40, marginBottom: 12 }}>Lean full-stack template</h1>
      <p style={{ fontSize: 18, color: "#444" }}>
        Four surfaces, one API: this landing page, an operations console, a Flutter app and the
        NestJS backend. Postgres for data and the job queue — no Redis, no plugin system.
      </p>

      <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
        <a
          href={`${adminUrl}/login`}
          style={{
            background: "#111",
            color: "#fff",
            padding: "10px 18px",
            borderRadius: 8,
            textDecoration: "none",
          }}
        >
          Sign in to the admin console
        </a>
        <a
          href="https://github.com/2tsoftwareapp/super-template/tree/main"
          style={{
            padding: "10px 18px",
            borderRadius: 8,
            border: "1px solid #ddd",
            color: "#111",
            textDecoration: "none",
          }}
        >
          Source
        </a>
      </div>

      <h2 style={{ fontSize: 20, marginTop: 40 }}>What is inside</h2>
      <ul style={{ color: "#444", paddingLeft: 20 }}>
        <li>API: auth with refresh rotation, users, files, jobs, mail, notifications</li>
        <li>Worker: claims the jobs table with SKIP LOCKED, retries with backoff</li>
        <li>Admin: users, jobs and notifications over a cookie BFF</li>
        <li>Mobile: Flutter login + home against the same API</li>
      </ul>
    </main>
  );
}
