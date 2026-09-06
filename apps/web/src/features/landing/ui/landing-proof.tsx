import { proofLogos } from "../config/landing-config";
import { Reveal } from "./reveal";

export function LandingProof() {
  return (
    <section className="border-b border-border py-10 md:py-12" aria-label="Built with">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal>
          <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-5 md:justify-between md:gap-x-6">
            {proofLogos.map((logo) => (
              <li key={logo.slug} className="opacity-70 grayscale transition hover:opacity-100 hover:grayscale-0">
                {/* eslint-disable-next-line @next/next/no-img-element -- Simple Icons CDN marks */}
                <img
                  src={`https://cdn.simpleicons.org/${logo.slug}/6b7280`}
                  alt={logo.name}
                  width={28}
                  height={28}
                  className="h-7 w-7 dark:brightness-125"
                  loading="lazy"
                />
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
