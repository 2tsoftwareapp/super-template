import { stackLayers } from "../config/landing-config";
import { Reveal } from "./reveal";

export function LandingStack() {
  const packageCount = stackLayers.reduce((n, layer) => n + layer.packages.length, 0);

  return (
    <section id="stack" className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal>
          <h2 className="max-w-2xl text-3xl font-semibold tracking-tight md:text-4xl">
            Dependencies chosen for production, not demos.
          </h2>
          <p className="mt-4 text-sm text-muted-foreground">
            {packageCount} packages across {stackLayers.length} layers. Versions pinned.
          </p>
        </Reveal>

        <div className="mt-12 space-y-10">
          {stackLayers.map((layer, layerIndex) => (
            <Reveal key={layer.label} delayMs={layerIndex * 50}>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                  {layer.label}
                </p>
                <ul className="divide-y divide-border rounded-2xl border border-border bg-background">
                  {layer.packages.map((pkg) => (
                    <li
                      key={pkg.name}
                      className="grid gap-1 px-4 py-3.5 sm:grid-cols-[140px_64px_1fr] sm:items-baseline sm:gap-6 md:px-5"
                    >
                      <span className="font-semibold text-foreground">{pkg.name}</span>
                      <span className="font-mono text-xs text-muted-foreground">{pkg.version}</span>
                      <span className="text-sm text-muted-foreground">{pkg.description}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
