import { Badge } from "@repo/web-core/components/badge";

import { LOGIN_FORM_COPY } from "@/features/auth/auth-constants";

interface LoginHeroProps {
  description: string;
  eyebrow: string;
  title: string;
}

export function LoginHero({ description, eyebrow, title }: LoginHeroProps) {
  return (
    <section className="space-y-6 py-4 lg:py-10">
      <Badge variant="outline" className="w-fit">
        {LOGIN_FORM_COPY.adminWorkspace}
      </Badge>
      <div className="max-w-2xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          {eyebrow}
        </p>
        <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
          {title}
        </h1>
        <p className="max-w-xl text-sm leading-7 text-muted-foreground md:text-base">
          {description}
        </p>
      </div>
    </section>
  );
}
