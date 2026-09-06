import { Reveal } from "./reveal";

const CLIENTS = [
  { title: "Web", detail: "Next.js SEO landing" },
  { title: "Admin", detail: "Next.js auth BFF" },
  { title: "Mobile", detail: "Flutter iOS / Android" },
] as const;

const LAYERS = [
  {
    label: "BFFs",
    items: ["Web BFF · cookies + CSRF", "Admin BFF · cookies + CSRF"],
  },
  {
    label: "API",
    items: [
      "NestJS 11 composition root",
      "Feature plugins · OpenAPI · JWT rotation",
    ],
  },
  {
    label: "Data",
    items: ["PostgreSQL 18 · RLS tenants", "Redis optional · Mailpit local"],
  },
] as const;

export function ArchDiagram() {
  return (
    <Reveal>
      <div className="overflow-hidden rounded-2xl border border-border bg-muted/25">
        <div className="border-b border-border px-5 py-4 md:px-7">
          <p className="text-sm font-medium text-foreground">Request path</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Clients hit BFFs or the API. One schema. One contract.
          </p>
        </div>

        <div className="grid gap-0 lg:grid-cols-[1fr_auto_1.2fr]">
          <div className="border-b border-border p-5 md:p-7 lg:border-b-0 lg:border-r">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Clients
            </p>
            <ul className="mt-4 space-y-3">
              {CLIENTS.map((client) => (
                <li
                  key={client.title}
                  className="rounded-xl border border-border bg-background px-4 py-3"
                >
                  <p className="text-sm font-semibold">{client.title}</p>
                  <p className="text-xs text-muted-foreground">{client.detail}</p>
                </li>
              ))}
            </ul>
          </div>

          <div
            aria-hidden
            className="hidden items-center justify-center px-2 text-primary lg:flex"
          >
            <span className="text-2xl">→</span>
          </div>

          <div className="space-y-0 p-5 md:p-7">
            {LAYERS.map((layer, index) => (
              <div
                key={layer.label}
                className={index > 0 ? "mt-5 border-t border-border pt-5" : undefined}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {layer.label}
                </p>
                <ul className="mt-3 space-y-2">
                  {layer.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-xl bg-primary/10 px-4 py-3 text-sm font-medium text-foreground"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Reveal>
  );
}
