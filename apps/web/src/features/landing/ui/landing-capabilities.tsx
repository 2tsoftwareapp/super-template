import { capabilities } from "../config/landing-config";
import { Reveal } from "./reveal";

export function LandingCapabilities() {
  return (
    <section id="capabilities" className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <Reveal>
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight md:text-4xl">
            Connected end to end. Nothing bolted on later.
          </h2>
        </Reveal>

        <ul className="mt-14 divide-y divide-border border-y border-border">
          {capabilities.map((item, index) => (
            <Reveal key={item.title} delayMs={index * 40}>
              <li className="grid gap-3 py-7 md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.4fr)_minmax(0,1fr)] md:items-baseline md:gap-8">
                <h3 className="text-lg font-semibold tracking-tight text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground md:text-base">
                  {item.description}
                </p>
                <p className="font-mono text-xs leading-relaxed text-muted-foreground/90 md:text-right">
                  {item.detail}
                </p>
              </li>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
