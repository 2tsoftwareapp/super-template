import { ArchDiagram } from "./arch-diagram";
import { Reveal } from "./reveal";

export function LandingArchitecture() {
  return (
    <section id="architecture" className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal>
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
            Three clients. One backend.
          </h2>
          <p className="mt-4 max-w-[54ch] text-base leading-relaxed text-muted-foreground">
            Admin traffic flows through a Next.js BFF with shared web-server helpers. Flutter talks
            to the API directly. Web stays a static marketing surface.
          </p>
        </Reveal>
        <div className="mt-12">
          <ArchDiagram />
        </div>
      </div>
    </section>
  );
}
