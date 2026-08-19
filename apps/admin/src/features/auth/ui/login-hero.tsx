import { Badge } from "@repo/web-ui/badge";

interface LoginHeroProps {
  badgeLabel: string;
  description: string;
  eyebrow: string;
  title: string;
}

export function LoginHero({ badgeLabel, description, eyebrow, title }: LoginHeroProps) {
  return (
    <section className="space-y-6 py-4 lg:py-10">
      <Badge variant="outline" className="w-fit">
        {badgeLabel}
      </Badge>
      <div className="max-w-2xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="text-4xl font-semibold leading-tight md:text-6xl">{title}</h1>
        <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
          {description}
        </p>
      </div>
    </section>
  );
}
