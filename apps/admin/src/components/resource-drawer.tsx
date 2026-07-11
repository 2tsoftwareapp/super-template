import { Button } from "@repo/web-core/components/button";
import { X } from "lucide-react";
import { type ReactNode, useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export function ResourceDrawer({
  open,
  title,
  description,
  children,
  footer,
  onClose,
  className,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- mount animation on open
      setVisible(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimate(true));
      });
    } else {
      setAnimate(false);
      const timer = setTimeout(() => setVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [open]);

  if (!visible) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close panel"
        className={cn(
          "fixed inset-0 z-40 transition-opacity duration-200",
          animate ? "bg-foreground/35 backdrop-blur-[2px]" : "bg-foreground/0 backdrop-blur-0",
        )}
        onClick={onClose}
      />
      <section
        aria-modal="true"
        role="dialog"
        aria-labelledby="resource-drawer-title"
        className={cn(
          "fixed right-0 top-0 z-50 flex h-dvh w-full max-w-[440px] flex-col border-l border-border bg-card shadow-2xl transition-transform duration-200",
          animate ? "translate-x-0" : "translate-x-full",
          className,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 id="resource-drawer-title" className="font-semibold">
              {title}
            </h2>
            {description ? (
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {description}
              </p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-border px-5 py-4">
            {footer}
          </div>
        ) : null}
      </section>
    </>
  );
}
