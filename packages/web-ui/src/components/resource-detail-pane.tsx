"use client";

import { useAnimatePresence } from "@repo/web-hooks/use-animate-presence";
import { cn } from "@repo/web-utils/utils";
import { Clock, Code, FileText, Info, X } from "lucide-react";
import {
  type ComponentType,
  type KeyboardEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import { Button } from "./button";
import { SectionLoading } from "./loading";
import { CopyableBadge, JsonCodeBlock } from "./resource-property-grid";

export interface ResourceDetailTab {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }> | undefined;
  count?: number | string | undefined;
  badge?: ReactNode | undefined;
  content: ReactNode;
  disabled?: boolean | undefined;
}

export type ResourceDetailPaneSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ResourceDetailPaneProps {
  open: boolean;
  onClose: () => void;
  title: string | ReactNode;
  description?: string | ReactNode | undefined;
  id?: string | undefined;
  idBadge?: ReactNode | undefined;
  tabs?: ResourceDetailTab[] | undefined;
  activeTab?: string | undefined;
  defaultTab?: string | undefined;
  onTabChange?: ((tabId: string) => void) | undefined;
  overview?: ReactNode | undefined;
  details?: ReactNode | undefined;
  history?: ReactNode | undefined;
  json?: unknown;
  rawJson?: unknown;
  children?: ReactNode | undefined;
  footer?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  size?: ResourceDetailPaneSize | undefined;
  isLoading?: boolean | undefined;
  loading?: boolean | undefined;
  error?: ReactNode | undefined;
  className?: string | undefined;
}

const sizeClasses: Record<ResourceDetailPaneSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md sm:max-w-lg",
  lg: "max-w-xl sm:max-w-2xl",
  xl: "max-w-2xl sm:max-w-3xl",
  full: "max-w-4xl sm:max-w-5xl",
};

export function ResourceDetailPane({
  open,
  onClose,
  title,
  description,
  id,
  idBadge,
  tabs: explicitTabs,
  activeTab: controlledActiveTab,
  defaultTab,
  onTabChange,
  overview,
  details,
  history,
  json,
  rawJson,
  children,
  footer,
  actions,
  size = "md",
  isLoading,
  loading,
  error,
  className,
}: ResourceDetailPaneProps) {
  const { visible, animate } = useAnimatePresence(open, 200);

  // Compile combined tabs list (either explicit tabs or shorthand tabs)
  const combinedTabs = useMemo<ResourceDetailTab[]>(() => {
    if (explicitTabs && explicitTabs.length > 0) {
      return explicitTabs;
    }

    const autoTabs: ResourceDetailTab[] = [];

    if (overview) {
      autoTabs.push({
        id: "overview",
        label: "Overview",
        icon: Info,
        content: overview,
      });
    }

    if (details) {
      autoTabs.push({
        id: "details",
        label: "Details",
        icon: FileText,
        content: details,
      });
    }

    if (history) {
      autoTabs.push({
        id: "history",
        label: "History",
        icon: Clock,
        content: history,
      });
    }

    const jsonData = rawJson ?? json;
    if (jsonData !== undefined && jsonData !== null) {
      autoTabs.push({
        id: "json",
        label: "JSON",
        icon: Code,
        content: <JsonCodeBlock data={jsonData} maxHeight="500px" />,
      });
    }

    return autoTabs;
  }, [explicitTabs, overview, details, history, json, rawJson]);

  const initialTabId = defaultTab ?? combinedTabs[0]?.id ?? "";
  const [internalActiveTab, setInternalActiveTab] = useState<string>(initialTabId);

  // Synchronize initial tab when tabs change and internal tab is invalid
  useEffect(() => {
    if (combinedTabs.length > 0) {
      const exists = combinedTabs.some((t) => t.id === internalActiveTab);
      if (!exists && combinedTabs[0]) {
        setInternalActiveTab(combinedTabs[0].id);
      }
    }
  }, [combinedTabs, internalActiveTab]);

  const currentTabId = controlledActiveTab ?? internalActiveTab;
  const currentTab = combinedTabs.find((t) => t.id === currentTabId) ?? combinedTabs[0];

  const handleTabSelect = (tabId: string) => {
    if (onTabChange) {
      onTabChange(tabId);
    } else {
      setInternalActiveTab(tabId);
    }
  };

  // Keyboard navigation for tabs
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      onClose();
      return;
    }

    if (combinedTabs.length <= 1) return;

    const currentIndex = combinedTabs.findIndex((t) => t.id === currentTabId);
    if (currentIndex === -1) return;

    if (e.key === "ArrowRight") {
      e.preventDefault();
      const nextIndex = (currentIndex + 1) % combinedTabs.length;
      const nextTab = combinedTabs[nextIndex];
      if (nextTab && !nextTab.disabled) handleTabSelect(nextTab.id);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prevIndex = (currentIndex - 1 + combinedTabs.length) % combinedTabs.length;
      const prevTab = combinedTabs[prevIndex];
      if (prevTab && !prevTab.disabled) handleTabSelect(prevTab.id);
    }
  };

  if (!visible) return null;

  const isCurrentlyLoading = isLoading ?? loading ?? false;

  return (
    <>
      {/* Backdrop overlay */}
      <button
        type="button"
        aria-label="Close backdrop"
        className={cn(
          "fixed inset-0 z-40 transition-opacity duration-200",
          animate ? "bg-foreground/30 backdrop-blur-[2px]" : "bg-foreground/0 backdrop-blur-0",
        )}
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <section
        aria-modal="true"
        role="dialog"
        aria-labelledby="resource-detail-pane-title"
        onKeyDown={handleKeyDown}
        className={cn(
          "fixed right-0 top-0 z-50 flex h-dvh w-full flex-col border-l border-border bg-card shadow-2xl transition-transform duration-200",
          sizeClasses[size],
          animate ? "translate-x-0" : "translate-x-full",
          className,
        )}
      >
        {/* Header */}
        <div className="flex shrink-0 flex-col gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 flex-col gap-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="resource-detail-pane-title"
                  className="text-lg font-semibold tracking-tight text-foreground"
                >
                  {title}
                </h2>
                {id ? <CopyableBadge value={id} label="ID" /> : idBadge}
              </div>

              {description ? (
                <p className="text-xs leading-relaxed text-muted-foreground">{description}</p>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-1">
              {actions}
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                aria-label="Close detail pane"
                className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </Button>
            </div>
          </div>

          {/* Tab Navigation */}
          {combinedTabs.length > 0 ? (
            <div
              role="tablist"
              aria-label="Detail tabs"
              className="-mb-4 mt-2 flex gap-1 overflow-x-auto border-b border-border/80 scrollbar-none"
            >
              {combinedTabs.map((tab) => {
                const isSelected = tab.id === currentTab?.id;
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    role="tab"
                    id={`detail-tab-${tab.id}`}
                    aria-controls={`detail-tabpanel-${tab.id}`}
                    aria-selected={isSelected}
                    disabled={tab.disabled}
                    onClick={() => handleTabSelect(tab.id)}
                    className={cn(
                      "group/tab inline-flex items-center gap-2 border-b-2 px-3 pb-2.5 pt-1.5 text-xs font-medium transition-all whitespace-nowrap",
                      isSelected
                        ? "border-primary font-semibold text-primary"
                        : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
                      tab.disabled && "pointer-events-none opacity-40",
                    )}
                  >
                    {Icon ? (
                      <Icon
                        className={cn(
                          "size-3.5",
                          isSelected
                            ? "text-primary"
                            : "text-muted-foreground/70 group-hover/tab:text-foreground",
                        )}
                      />
                    ) : null}
                    <span>{tab.label}</span>
                    {tab.count !== undefined ? (
                      <span
                        className={cn(
                          "rounded-full px-1.5 py-0.2 text-[10px] tabular-nums",
                          isSelected
                            ? "bg-primary/15 text-primary"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {tab.count}
                      </span>
                    ) : (
                      tab.badge
                    )}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>

        {/* Content Body */}
        <div
          role="tabpanel"
          id={currentTab ? `detail-tabpanel-${currentTab.id}` : undefined}
          aria-labelledby={currentTab ? `detail-tab-${currentTab.id}` : undefined}
          className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6"
        >
          {isCurrentlyLoading ? (
            <div className="flex h-48 items-center justify-center">
              <SectionLoading title="Loading details..." />
            </div>
          ) : error ? (
            <div className="p-2">{error}</div>
          ) : combinedTabs.length > 0 ? (
            currentTab?.content
          ) : (
            children
          )}
        </div>

        {/* Footer */}
        {footer ? (
          <div className="shrink-0 border-t border-border bg-muted/20 px-5 py-3.5 sm:px-6">
            {footer}
          </div>
        ) : null}
      </section>
    </>
  );
}
