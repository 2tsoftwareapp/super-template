import { Card, CardContent } from "@repo/web-core/components/card";

export function ArchDiagram() {
  return (
    <Card className="overflow-hidden shadow-sm">
      <CardContent className="p-4 md:p-6">
        <div className="space-y-4 md:hidden">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Clients
            </p>
            <div className="grid gap-3">
              <Card size="sm">
                <CardContent className="px-3 py-3">
                  <p className="text-sm font-semibold text-foreground">Web Browser</p>
                  <p className="text-xs text-muted-foreground">Next.js · SEO landing</p>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardContent className="px-3 py-3">
                  <p className="text-sm font-semibold text-foreground">Admin Browser</p>
                  <p className="text-xs text-muted-foreground">Next.js Admin</p>
                </CardContent>
              </Card>
              <Card size="sm">
                <CardContent className="px-3 py-3">
                  <p className="text-sm font-semibold text-foreground">Flutter App</p>
                  <p className="text-xs text-muted-foreground">iOS · Android</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-center text-lg text-primary">↓</div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              BFF
            </p>
            <div className="grid gap-3">
              <Card size="sm" className="ring-primary/50">
                <CardContent className="px-3 py-3">
                  <p className="text-sm font-semibold text-foreground">Next.js 16 Web BFF</p>
                  <p className="text-xs text-muted-foreground">HttpOnly cookies · CSRF</p>
                </CardContent>
              </Card>
              <Card size="sm" className="ring-primary/50">
                <CardContent className="px-3 py-3">
                  <p className="text-sm font-semibold text-foreground">Next.js 16 Admin BFF</p>
                  <p className="text-xs text-muted-foreground">HttpOnly cookies · CSRF</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="flex justify-center text-lg text-primary">↓</div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              API
            </p>
            <Card className="ring-primary/50">
              <CardContent className="px-4 py-4">
                <p className="text-base font-semibold text-foreground">NestJS 11 API</p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  auth · users · access-control · audit · notifications · projects
                </p>
                <p className="text-xs leading-5 text-muted-foreground">
                  storage · mail · jobs · invitations · imports/exports · comments
                </p>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                  Drizzle ORM · Argon2 · JWT access + refresh rotation · OpenAPI
                  schema auto-generated
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center text-lg text-primary">↓</div>

          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
              Infra
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                ["PostgreSQL", "Primary datastore"],
                ["Mailpit / SMTP", "Email delivery"],
                ["AWS S3", "Object storage"],
                ["Firebase FCM", "Mobile push"],
              ].map(([title, subtitle]) => (
                <Card key={title} size="sm">
                  <CardContent className="px-3 py-3">
                    <p className="text-sm font-semibold text-foreground">{title}</p>
                    <p className="text-xs text-muted-foreground">{subtitle}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        <svg
          viewBox="0 0 880 500"
          className="hidden h-auto w-full md:block"
          role="img"
          aria-label="System architecture diagram"
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
              <polygon points="0 0, 7 2.5, 0 5" fill="var(--primary)" />
            </marker>
          </defs>

          <line x1="114" y1="84" x2="114" y2="148" stroke="var(--primary)" strokeOpacity="0.9" strokeWidth="1.8" markerEnd="url(#arr)" />
          <line x1="114" y1="212" x2="114" y2="268" stroke="var(--primary)" strokeOpacity="0.9" strokeWidth="1.8" markerEnd="url(#arr)" />
          <line x1="440" y1="84" x2="440" y2="148" stroke="var(--primary)" strokeOpacity="0.9" strokeWidth="1.8" markerEnd="url(#arr)" />
          <line x1="440" y1="212" x2="440" y2="268" stroke="var(--primary)" strokeOpacity="0.9" strokeWidth="1.8" markerEnd="url(#arr)" />
          <line x1="766" y1="84" x2="766" y2="268" stroke="var(--primary)" strokeOpacity="0.75" strokeWidth="1.8" strokeDasharray="5 4" markerEnd="url(#arr)" />
          <line x1="116" y1="364" x2="116" y2="412" stroke="var(--primary)" strokeOpacity="0.9" strokeWidth="1.8" markerEnd="url(#arr)" />
          <line x1="332" y1="364" x2="332" y2="412" stroke="var(--primary)" strokeOpacity="0.9" strokeWidth="1.8" markerEnd="url(#arr)" />
          <line x1="548" y1="364" x2="548" y2="412" stroke="var(--primary)" strokeOpacity="0.9" strokeWidth="1.8" markerEnd="url(#arr)" />
          <line x1="764" y1="364" x2="764" y2="412" stroke="var(--primary)" strokeOpacity="0.9" strokeWidth="1.8" markerEnd="url(#arr)" />

          <text x="16" y="11" fill="var(--foreground)" fillOpacity="0.72" fontSize="9.5" fontWeight="700" letterSpacing="1.4">CLIENTS</text>
          <text x="16" y="140" fill="var(--foreground)" fillOpacity="0.72" fontSize="9.5" fontWeight="700" letterSpacing="1.4">BFF</text>
          <text x="16" y="260" fill="var(--foreground)" fillOpacity="0.72" fontSize="9.5" fontWeight="700" letterSpacing="1.4">API</text>
          <text x="16" y="404" fill="var(--foreground)" fillOpacity="0.72" fontSize="9.5" fontWeight="700" letterSpacing="1.4">INFRA</text>

          <rect x="16" y="20" width="196" height="64" rx="10" fill="var(--card)" stroke="var(--border)" strokeWidth="1.25" />
          <text x="114" y="46" textAnchor="middle" fill="var(--foreground)" fontSize="13" fontWeight="600">Web Browser</text>
          <text x="114" y="64" textAnchor="middle" fill="var(--foreground)" fillOpacity="0.72" fontSize="11">Next.js · SEO landing</text>

          <rect x="342" y="20" width="196" height="64" rx="10" fill="var(--card)" stroke="var(--border)" strokeWidth="1.25" />
          <text x="440" y="46" textAnchor="middle" fill="var(--foreground)" fontSize="13" fontWeight="600">Admin Browser</text>
          <text x="440" y="64" textAnchor="middle" fill="var(--foreground)" fillOpacity="0.72" fontSize="11">Next.js Admin</text>

          <rect x="668" y="20" width="196" height="64" rx="10" fill="var(--card)" stroke="var(--border)" strokeWidth="1.25" />
          <text x="766" y="46" textAnchor="middle" fill="var(--foreground)" fontSize="13" fontWeight="600">Flutter App</text>
          <text x="766" y="64" textAnchor="middle" fill="var(--foreground)" fillOpacity="0.72" fontSize="11">iOS · Android</text>

          <rect x="16" y="148" width="196" height="64" rx="10" fill="var(--card)" stroke="var(--primary)" strokeWidth="1.8" />
          <text x="114" y="174" textAnchor="middle" fill="var(--foreground)" fontSize="13" fontWeight="600">Next.js 16 Web BFF</text>
          <text x="114" y="193" textAnchor="middle" fill="var(--foreground)" fillOpacity="0.72" fontSize="11">HttpOnly cookies · CSRF</text>

          <rect x="342" y="148" width="196" height="64" rx="10" fill="var(--card)" stroke="var(--primary)" strokeWidth="1.8" />
          <text x="440" y="174" textAnchor="middle" fill="var(--foreground)" fontSize="13" fontWeight="600">Next.js 16 Admin BFF</text>
          <text x="440" y="193" textAnchor="middle" fill="var(--foreground)" fillOpacity="0.72" fontSize="11">HttpOnly cookies · CSRF</text>

          <rect x="16" y="268" width="848" height="96" rx="10" fill="var(--card)" stroke="var(--primary)" strokeWidth="1.8" />
          <text x="440" y="282" textAnchor="middle" fill="var(--foreground)" fontSize="13" fontWeight="600">NestJS 11 API</text>
          <text x="440" y="302" textAnchor="middle" fill="var(--foreground)" fillOpacity="0.74" fontSize="11">auth · users · access-control · audit · notifications · projects</text>
          <text x="440" y="321" textAnchor="middle" fill="var(--foreground)" fillOpacity="0.74" fontSize="11">storage · mail · jobs · invitations · imports/exports · comments</text>
          <text x="440" y="344" textAnchor="middle" fill="var(--foreground)" fillOpacity="0.68" fontSize="10.5">Drizzle ORM · Argon2 · JWT access + refresh rotation · OpenAPI schema auto-generated</text>

          <rect x="16" y="412" width="200" height="52" rx="10" fill="var(--card)" stroke="var(--border)" strokeWidth="1.25" />
          <text x="116" y="426" textAnchor="middle" fill="var(--foreground)" fontSize="12" fontWeight="600">PostgreSQL</text>
          <text x="116" y="444" textAnchor="middle" fill="var(--foreground)" fillOpacity="0.72" fontSize="10.5">Primary datastore</text>

          <rect x="232" y="412" width="200" height="52" rx="10" fill="var(--card)" stroke="var(--border)" strokeWidth="1.25" />
          <text x="332" y="426" textAnchor="middle" fill="var(--foreground)" fontSize="12" fontWeight="600">Mailpit / SMTP</text>
          <text x="332" y="444" textAnchor="middle" fill="var(--foreground)" fillOpacity="0.72" fontSize="10.5">Email delivery</text>

          <rect x="448" y="412" width="200" height="52" rx="10" fill="var(--card)" stroke="var(--border)" strokeWidth="1.25" />
          <text x="548" y="426" textAnchor="middle" fill="var(--foreground)" fontSize="12" fontWeight="600">AWS S3</text>
          <text x="548" y="444" textAnchor="middle" fill="var(--foreground)" fillOpacity="0.72" fontSize="10.5">Object storage</text>

          <rect x="664" y="412" width="200" height="52" rx="10" fill="var(--card)" stroke="var(--border)" strokeWidth="1.25" />
          <text x="764" y="426" textAnchor="middle" fill="var(--foreground)" fontSize="12" fontWeight="600">Firebase FCM</text>
          <text x="764" y="444" textAnchor="middle" fill="var(--foreground)" fillOpacity="0.72" fontSize="10.5">Mobile push</text>
        </svg>
      </CardContent>
    </Card>
  );
}
