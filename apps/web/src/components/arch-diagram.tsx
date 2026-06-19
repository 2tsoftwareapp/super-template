export function ArchDiagram() {
  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-border bg-muted/20 p-4 md:p-6">
      <svg
        viewBox="0 0 880 430"
        className="w-full min-w-[560px]"
        role="img"
        aria-label="System architecture diagram"
        style={{ fontFamily: "inherit" }}
      >
        <defs>
          <marker
            id="arr"
            markerWidth="7"
            markerHeight="5"
            refX="6"
            refY="2.5"
            orient="auto"
          >
            <polygon points="0 0, 7 2.5, 0 5" fill="var(--border)" />
          </marker>
        </defs>

        {/* ── Connectors (behind boxes) ── */}

        {/* Browser → BFF */}
        <line
          x1="114"
          y1="84"
          x2="114"
          y2="120"
          stroke="var(--border)"
          strokeWidth="1.5"
          markerEnd="url(#arr)"
        />
        {/* BFF → API */}
        <line
          x1="114"
          y1="184"
          x2="114"
          y2="220"
          stroke="var(--border)"
          strokeWidth="1.5"
          markerEnd="url(#arr)"
        />

        {/* Admin → BFF */}
        <line
          x1="440"
          y1="84"
          x2="440"
          y2="120"
          stroke="var(--border)"
          strokeWidth="1.5"
          markerEnd="url(#arr)"
        />
        {/* Admin BFF → API */}
        <line
          x1="440"
          y1="184"
          x2="440"
          y2="220"
          stroke="var(--border)"
          strokeWidth="1.5"
          markerEnd="url(#arr)"
        />
        {/* Mobile → API (direct, dashed) */}
        <line
          x1="766"
          y1="84"
          x2="766"
          y2="220"
          stroke="var(--border)"
          strokeWidth="1.5"
          strokeDasharray="5 4"
          markerEnd="url(#arr)"
        />

        {/* API → Infra */}
        <line
          x1="116"
          y1="316"
          x2="116"
          y2="348"
          stroke="var(--border)"
          strokeWidth="1.5"
          markerEnd="url(#arr)"
        />
        <line
          x1="332"
          y1="316"
          x2="332"
          y2="348"
          stroke="var(--border)"
          strokeWidth="1.5"
          markerEnd="url(#arr)"
        />
        <line
          x1="548"
          y1="316"
          x2="548"
          y2="348"
          stroke="var(--border)"
          strokeWidth="1.5"
          markerEnd="url(#arr)"
        />
        <line
          x1="764"
          y1="316"
          x2="764"
          y2="348"
          stroke="var(--border)"
          strokeWidth="1.5"
          markerEnd="url(#arr)"
        />

        {/* ── Layer labels ── */}
        <text
          x="16"
          y="11"
          fill="var(--muted-foreground)"
          fontSize="8.5"
          fontWeight="700"
          letterSpacing="1.4"
        >
          CLIENTS
        </text>
        <text
          x="16"
          y="112"
          fill="var(--muted-foreground)"
          fontSize="8.5"
          fontWeight="700"
          letterSpacing="1.4"
        >
          BFF
        </text>
        <text
          x="16"
          y="213"
          fill="var(--muted-foreground)"
          fontSize="8.5"
          fontWeight="700"
          letterSpacing="1.4"
        >
          API
        </text>
        <text
          x="16"
          y="353"
          fill="var(--muted-foreground)"
          fontSize="8.5"
          fontWeight="700"
          letterSpacing="1.4"
        >
          INFRA
        </text>

        {/* ── Client boxes ── */}

        {/* Web Browser */}
        <rect
          x="16"
          y="20"
          width="196"
          height="64"
          rx="10"
          fill="var(--card)"
          stroke="var(--border)"
        />
        <text
          x="114"
          y="46"
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize="13"
          fontWeight="600"
        >
          Web Browser
        </text>
        <text
          x="114"
          y="64"
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize="10.5"
        >
          Next.js App Router
        </text>

        {/* Admin Browser */}
        <rect
          x="342"
          y="20"
          width="196"
          height="64"
          rx="10"
          fill="var(--card)"
          stroke="var(--border)"
        />
        <text
          x="440"
          y="46"
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize="13"
          fontWeight="600"
        >
          Admin Browser
        </text>
        <text
          x="440"
          y="64"
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize="10.5"
        >
          Next.js Admin
        </text>

        {/* Flutter App */}
        <rect
          x="668"
          y="20"
          width="196"
          height="64"
          rx="10"
          fill="var(--card)"
          stroke="var(--border)"
        />
        <text
          x="766"
          y="46"
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize="13"
          fontWeight="600"
        >
          Flutter App
        </text>
        <text
          x="766"
          y="64"
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize="10.5"
        >
          iOS · Android
        </text>

        {/* ── BFF box ── */}
        <rect
          x="16"
          y="120"
          width="196"
          height="64"
          rx="10"
          fill="var(--card)"
          stroke="var(--primary)"
          strokeWidth="1.5"
        />
        <text
          x="114"
          y="146"
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize="13"
          fontWeight="600"
        >
          Next.js 16 Web BFF
        </text>
        <text
          x="114"
          y="165"
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize="10.5"
        >
          HttpOnly cookies · CSRF
        </text>

        {/* ── Admin BFF box ── */}
        <rect
          x="342"
          y="120"
          width="196"
          height="64"
          rx="10"
          fill="var(--card)"
          stroke="var(--primary)"
          strokeWidth="1.5"
        />
        <text
          x="440"
          y="146"
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize="13"
          fontWeight="600"
        >
          Next.js 16 Admin BFF
        </text>
        <text
          x="440"
          y="165"
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize="10.5"
        >
          HttpOnly cookies · CSRF
        </text>

        {/* ── API box ── */}
        <rect
          x="16"
          y="220"
          width="848"
          height="96"
          rx="10"
          fill="var(--card)"
          stroke="var(--primary)"
          strokeWidth="1.5"
        />
        <text
          x="440"
          y="234"
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize="13"
          fontWeight="600"
        >
          NestJS 11 API
        </text>
        <text
          x="440"
          y="254"
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize="10.5"
        >
          auth · users · access-control · audit · notifications · projects
        </text>
        <text
          x="440"
          y="273"
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize="10.5"
        >
          storage · mail · jobs · invitations · imports/exports · comments
        </text>
        <text
          x="440"
          y="296"
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize="10"
        >
          Drizzle ORM · Argon2 · JWT access + refresh rotation · OpenAPI schema
          auto-generated
        </text>

        {/* ── Infra boxes ── */}

        {/* PostgreSQL */}
        <rect
          x="16"
          y="348"
          width="200"
          height="52"
          rx="10"
          fill="var(--card)"
          stroke="var(--border)"
        />
        <text
          x="116"
          y="362"
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize="12"
          fontWeight="600"
        >
          PostgreSQL
        </text>
        <text
          x="116"
          y="380"
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize="10"
        >
          Primary datastore
        </text>

        {/* Mailpit / SMTP */}
        <rect
          x="232"
          y="348"
          width="200"
          height="52"
          rx="10"
          fill="var(--card)"
          stroke="var(--border)"
        />
        <text
          x="332"
          y="362"
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize="12"
          fontWeight="600"
        >
          Mailpit / SMTP
        </text>
        <text
          x="332"
          y="380"
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize="10"
        >
          Email delivery
        </text>

        {/* AWS S3 */}
        <rect
          x="448"
          y="348"
          width="200"
          height="52"
          rx="10"
          fill="var(--card)"
          stroke="var(--border)"
        />
        <text
          x="548"
          y="362"
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize="12"
          fontWeight="600"
        >
          AWS S3
        </text>
        <text
          x="548"
          y="380"
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize="10"
        >
          Object storage
        </text>

        {/* Firebase FCM */}
        <rect
          x="664"
          y="348"
          width="200"
          height="52"
          rx="10"
          fill="var(--card)"
          stroke="var(--border)"
        />
        <text
          x="764"
          y="362"
          textAnchor="middle"
          fill="var(--foreground)"
          fontSize="12"
          fontWeight="600"
        >
          Firebase FCM
        </text>
        <text
          x="764"
          y="380"
          textAnchor="middle"
          fill="var(--muted-foreground)"
          fontSize="10"
        >
          Mobile push
        </text>
      </svg>
    </div>
  );
}
