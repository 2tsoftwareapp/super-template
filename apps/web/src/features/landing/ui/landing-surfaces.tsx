import { ExternalLink } from "lucide-react";

import { surfaces } from "../config/landing-config";
import { Reveal } from "./reveal";

const TONE_CLASS: Record<(typeof surfaces)[number]["tone"], string> = {
  muted: "bg-muted/70",
  soft: "bg-primary/8",
  accent: "bg-primary text-primary-foreground",
  ink: "bg-foreground text-background",
};

export function LandingSurfaces() {
  return (
    <section id="surfaces" className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal>
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-foreground md:text-4xl">
            One backend. Four clear surfaces.
          </h2>
          <p className="mt-4 max-w-[52ch] text-base leading-relaxed text-muted-foreground">
            Web stays marketing. Admin owns auth and operations. Mobile ships native. All three talk
            to the same NestJS API.
          </p>
        </Reveal>

        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2 lg:gap-4">
          {surfaces.map((surface, index) => {
            const span =
              index === 0
                ? "lg:col-span-2 lg:row-span-2 min-h-[240px] lg:min-h-full"
                : index === 1
                  ? "lg:col-span-2 min-h-[160px]"
                  : "lg:col-span-1 min-h-[160px]";
            const isAccent = surface.tone === "accent" || surface.tone === "ink";

            return (
              <Reveal key={surface.label} delayMs={index * 60} className={span}>
                <a
                  href={surface.href ?? undefined}
                  target={surface.external ? "_blank" : undefined}
                  rel={surface.external ? "noopener noreferrer" : undefined}
                  className={`group flex h-full flex-col justify-between rounded-2xl p-6 transition duration-300 hover:-translate-y-0.5 ${TONE_CLASS[surface.tone]}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span
                      className={`text-xs font-semibold uppercase tracking-[0.14em] ${
                        isAccent ? "opacity-80" : "text-muted-foreground"
                      }`}
                    >
                      {surface.label}
                    </span>
                    {surface.external ? (
                      <ExternalLink
                        className={`size-3.5 opacity-0 transition group-hover:opacity-70 ${
                          isAccent ? "" : "text-muted-foreground"
                        }`}
                      />
                    ) : null}
                  </div>
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold tracking-tight">{surface.title}</h3>
                    <p
                      className={`mt-2 max-w-[36ch] text-sm leading-relaxed ${
                        isAccent ? "opacity-85" : "text-muted-foreground"
                      }`}
                    >
                      {surface.description}
                    </p>
                  </div>
                </a>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
