import { steps } from "../config/landing-config";
import { Reveal } from "./reveal";

export function LandingStart() {
  return (
    <section id="start" className="border-b border-border py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
          <Reveal>
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Running in under five minutes.
            </h2>
            <p className="mt-4 max-w-[40ch] text-base leading-relaxed text-muted-foreground">
              Docker, pnpm, and the Flutter SDK are enough. Bootstrap seeds demo accounts for local
              login.
            </p>
          </Reveal>

          <ol className="space-y-4">
            {steps.map((step, index) => (
              <Reveal key={step.title} delayMs={index * 70}>
                <li className="rounded-2xl border border-border bg-muted/30 p-5 md:p-6">
                  <div className="flex items-baseline gap-3">
                    <span className="font-mono text-sm text-primary">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-lg font-semibold tracking-tight">{step.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {step.description}
                  </p>
                  <pre className="mt-4 overflow-x-auto rounded-xl bg-foreground px-4 py-3 text-background">
                    <code className="font-mono text-xs sm:text-sm">
                      <span className="opacity-50">$ </span>
                      {step.code}
                    </code>
                  </pre>
                </li>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
