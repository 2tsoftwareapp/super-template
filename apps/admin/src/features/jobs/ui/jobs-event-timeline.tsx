"use client";

import { Show } from "@repo/web-ui/show";
import { Spinner } from "@repo/web-ui/spinner";

import type { JobEventDto } from "@/lib/api-types";

import { eventTypeProps } from "@/features/jobs/model/constants";
import { timeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface JobsEventTimelineProps {
  events: JobEventDto[];
  isLoading: boolean;
}

export function JobsEventTimeline({ events, isLoading }: JobsEventTimelineProps) {
  return (
    <div className="mt-2 space-y-3">
      <Show when={isLoading}>
        <Spinner className="mx-auto size-4" />
      </Show>
      {!isLoading && events.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          No events recorded.
        </p>
      ) : (
        <div className="relative space-y-0">
          {events.map((event, idx) => {
            const evProps = eventTypeProps(String(event.type));
            return (
              <div
                key={`${String(event.createdAt)}-${String(event.type)}-${idx}`}
                className="flex gap-3 pb-4 pl-4 relative"
              >
                {idx < events.length - 1 && (
                  <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border" />
                )}
                <div className={cn("mt-1 size-3 shrink-0 rounded-full", evProps.dot)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn("text-xs font-medium", evProps.text)}>
                      {evProps.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {timeAgo(String(event.createdAt))}
                    </span>
                  </div>
                  {event.message && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {String(event.message)}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
