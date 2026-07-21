"use client";

import { ErrorState } from "@repo/web-ui/error-state";
import { Show } from "@repo/web-ui/show";
import { Spinner } from "@repo/web-ui/spinner";

import type { JobEventDto } from "@/lib/api-types";

import { eventTypeProps } from "@/features/jobs/model/jobs.constants";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface JobsEventTimelineProps {
  events: JobEventDto[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function JobsEventTimeline({
  events,
  isLoading,
  isError,
  onRetry,
}: JobsEventTimelineProps) {
  return (
    <div className="mt-2 space-y-3">
      <Show when={isLoading}>
        <Spinner className="mx-auto size-4" />
      </Show>

      <Show when={!isLoading && isError}>
        <ErrorState
          variant="inline"
          className="m-0"
          title="Could not load job events."
          action={{ label: "Retry", onClick: onRetry }}
        />
      </Show>

      {!isLoading && !isError && events.length === 0 ? (
        <p className="text-xs text-muted-foreground">No events recorded.</p>
      ) : null}

      {!isLoading && !isError && events.length > 0 ? (
        <div className="relative space-y-0">
          {events.map((event, idx) => {
            const evProps = eventTypeProps(String(event.type));
            return (
              <div
                key={`${String(event.createdAt)}-${String(event.type)}-${idx}`}
                className="relative flex gap-3 pb-4 pl-4"
              >
                {idx < events.length - 1 ? (
                  <div className="absolute bottom-0 left-[7px] top-4 w-px bg-border" />
                ) : null}
                <div
                  className={cn(
                    "mt-1 size-3 shrink-0 rounded-full",
                    evProps.dot,
                  )}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-medium", evProps.text)}>
                      {evProps.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {timeAgo(String(event.createdAt))}
                    </span>
                  </div>
                  {event.message ? (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {String(event.message)}
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
