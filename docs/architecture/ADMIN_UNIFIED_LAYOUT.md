# Unified Admin Layout Architecture & Component Specification

Status: **Canonical Architectural Specification**  
Applies to: `apps/admin`, `@repo/web-ui`, `@repo/web-hooks`, and all Admin feature modules.  
Reference Implementation: `apps/admin/src/features/` & `packages/web-ui/src/components/`

---

## 1. Executive Summary & Architectural Principles

The Unified Admin Layout establishes a standardized, high-density, accessible, and composable layout architecture for all administrative surfaces within the Next.js `apps/admin` application. It standardizes navigation, header actions, statistical summaries, filtering toolbars, data tables, bulk manipulation, slide-over detail panes, form drawers, and confirmation modals into a cohesive design language powered by `@repo/web-ui`.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                AdminShell                                   │
│ ┌───────────────┬─────────────────────────────────────────────────────────┐ │
│ │  Sidebar      │ TopHeader (Breadcrumbs, Search, Locale, Theme, User)   │ │
│ │  ┌──────────┐ ├─────────────────────────────────────────────────────────┤ │
│ │  │ Brand    │ │ CommonResourcePage<TData>                               │ │
│ │  ├──────────┤ │  ┌────────────────────────────────────────────────────┐ │ │
│ │  │ NavGroup │ │  │ Header: Title, Description, Refresh, Actions       │ │ │
│ │  │  • People│ │  ├────────────────────────────────────────────────────┤ │ │
│ │  │  • Ops   │ │  │ ResourceStatCards (Summary metrics & KPI trends)   │ │ │
│ │  │  • System│ │  ├────────────────────────────────────────────────────┤ │ │
│ │  ├──────────┤ │  │ Card Wrapper                                       │ │ │
│ │  │ UserMenu │ │  │  ┌───────────────────────────────────────────────┐ │ │ │
│ │  └──────────┘ │  │  │ ResourceFilterBar (Search, Facets, Chips)    │ │ │ │
│ │               │  │  ├───────────────────────────────────────────────┤ │ │ │
│ │               │  │  │ BulkActionBar (Selection count, Batch ops)    │ │ │ │
│ │               │  │  ├───────────────────────────────────────────────┤ │ │ │
│ │               │  │  │ ResourceDataTable (Density, Sort, Visibility) │ │ │ │
│ │               │  │  ├───────────────────────────────────────────────┤ │ │ │
│ │               │  │  │ Pagination (Page sizes, Page jumpers)         │ │ │ │
│ │               │  │  └───────────────────────────────────────────────┘ │ │ │
│ │               │  ├────────────────────────────────────────────────────┤ │ │
│ │               │  │ ResourceDetailPane / ResourceDrawer (Slide-over)   │ │ │
│ │               │  └────────────────────────────────────────────────────┘ │ │
│ └───────────────┴─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Core Architectural Principles

1. **Strict Separation of View Models & Presentational UI**  
   Presentational views (e.g., `UsersListView`, `JobsListView`) accept a purely resolved view model and render declarative UI. They own **zero** server state, query orchestration, URL synchronization, or authorization logic. All mutations, queries, debouncing, and permission checks are encapsulated within dedicated controller hooks (`use<Feature>Controller`).

2. **Composition over Configuration (Slot-Based Architecture)**  
   Components such as `CommonResourcePage`, `ResourceDataTable`, and `ResourceFilterBar` provide first-class prop slots (`headerActions`, `stats`, `filterBar`, `bulkActions`, `content`, `pagination`, `detailPane`) while exposing fallback defaults. This guarantees visual consistency while permitting granular layout customizations without breaking abstractions.

3. **Single Source of Truth for UI Primitives**  
   All design tokens, layout primitives, and interactive controls originate exclusively from `@repo/web-ui`. Admin applications never declare local ad-hoc table wrappers, custom dropdowns, or inconsistent button styles.

4. **URL-Synchronized State Machine**  
   All search terms, faceted filter selections, pagination cursors/offsets, sorting columns, and active entity IDs synchronize transparently with query parameters. This provides browser history traversal, bookmarking, and shareable deep links out of the box.

5. **Universal Accessibility & Predictable Focus Management**  
   All interactive elements comply with WAI-ARIA guidelines:
   - Tables feature `aria-sort` indicators and keyboard-accessible column headers (`Enter` / `Space`).
   - Drawers and dialogs manage focus trapping via portals and handle `Escape` dismissal.
   - Global `TooltipProvider` at the application root guarantees instant, non-flickering tooltips (`delayDuration={0}`).

---

## 2. Layout Hierarchy & Shell Structure

The administrative UI is composed across four distinct hierarchical layers:

### 2.1 System Architecture Diagram

```mermaid
graph TD
    Root[apps/admin/src/app/[locale]/layout.tsx] --> Providers[Providers]
    Providers --> TooltipProvider[TooltipProvider delayDuration=0]
    TooltipProvider --> QueryClient[QueryClientProvider]
    QueryClient --> AdminGuard[AdminGuard / resolveAdminGuard]
    AdminGuard --> AdminShell[AdminShell]

    AdminShell --> SidebarProvider[SidebarProvider defaultOpen=true]
    SidebarProvider --> Sidebar[Sidebar collapsible=icon]
    Sidebar --> Brand[Brand Logo & Workspace]
    Sidebar --> SidebarNav[SidebarNav: Overview, People, Operations, System]
    Sidebar --> UserMenu[UserMenu Profile & SignOut]

    SidebarProvider --> SidebarInset[SidebarInset]
    SidebarInset --> TopHeader[TopHeader: Breadcrumbs, Global Search, Locale, Theme]
    SidebarInset --> MainContent[main: max-w-screen-2xl p-4 md:p-6 lg:p-8]

    MainContent --> CommonResourcePage[CommonResourcePage]
    CommonResourcePage --> ResourcePageShell[ResourcePageShell Header + Meta]
    CommonResourcePage --> ResourceStatCards[ResourceStatCards KPI Grid]
    CommonResourcePage --> UnifiedCard[Card Container border bg-card]

    UnifiedCard --> ResourceFilterBar[ResourceFilterBar Search + Facets + Chips]
    UnifiedCard --> BulkActionBar[BulkActionBar Batch Actions]
    UnifiedCard --> ResourceDataTable[ResourceDataTable TanStack Table v8]
    UnifiedCard --> Pagination[Pagination Controls]

    CommonResourcePage --> ResourceDetailPane[ResourceDetailPane / ResourceDrawer]
    ResourceDetailPane --> ResourcePropertyGrid[ResourcePropertyGrid]
```

### 2.2 Shell Components Breakdown

- **`AdminShell` (`apps/admin/src/components/admin-shell.tsx`)**  
  Wraps the viewport in `SidebarProvider`, mounting the collapsible `Sidebar` on the left and `SidebarInset` on the right. Subscribes to `useAdminSession()` to supply the authenticated operator profile and RBAC permissions.
- **`TopHeader` (`apps/admin/src/components/admin-shell/top-header.tsx`)**  
  Sticky navigation bar housing the `SidebarTrigger`, contextual `Breadcrumb`, keyboard shortcut trigger for `CommandMenu` (`⌘K`), language switcher (`en` / `vi`), theme toggle (`light` / `dark` / `system`), and operator quick menu.
- **`SidebarNav` (`apps/admin/src/components/sidebar-nav.tsx`)**  
  Renders categorized navigation groups defined in `adminResourceGroups` (`Overview`, `People`, `Operations`, `System`). Respects granular permissions via `canAccessResource(resource, permissions)` to hide unauthorized routes dynamically.
- **`CommandMenu` (`apps/admin/src/components/command-menu.tsx`)**  
  Global command palette supporting instant keyboard navigation across all authorized admin resources and sub-actions.

---

## 3. Complete Component API Reference

All layout components are exported from `@repo/web-ui`.

```ts
import {
  CommonResourcePage,
  ResourceDataTable,
  ResourceFilterBar,
  ResourceFacetedFilter,
  ResourceDetailPane,
  ResourcePropertyGrid,
  ResourceStatCards,
  ResourceDrawer,
  ConfirmDialog,
} from "@repo/web-ui";
```

---

### 3.1 `CommonResourcePage<TData>`

`CommonResourcePage` is the foundational page scaffolding component for resource-oriented admin views. It coordinates header titles, action buttons, KPI summary statistics, filter bars, batch selection bars, tabular content, pagination, and slide-over detail drawers.

#### Interface Definitions

```ts
export interface CommonResourcePagePagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages?: number | undefined;
  pageSizeOptions?: readonly number[] | undefined;
  onPageChange: (page: number) => void;
  onPageSizeChange?: ((pageSize: number) => void) | undefined;
  isLoading?: boolean | undefined;
}

export interface CommonResourcePageBulkActions {
  selectedCount: number;
  onClear: () => void;
  actions?: ReactNode | undefined;
}

export interface CommonResourcePageProps {
  /** Resource metadata configuration */
  resource: AdminResourceConfig<ComponentType<{ className?: string }>>;
  title?: string | undefined;
  description: string;
  headerActions?: ReactNode | undefined;
  actions?: ReactNode | undefined;
  backHref?: string | undefined;
  meta?: ReactNode | undefined;
  isRefreshing?: boolean | undefined;
  onRefresh?: (() => void) | undefined;
  linkComponent?: ResourcePageLinkComponent | undefined;

  /** KPI Statistics section */
  stats?: ResourceStatCardItem[] | undefined;
  statsColumns?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  statsLoading?: boolean | undefined;
  statsSlot?: ReactNode | undefined;

  /** Filter / search toolbar slot */
  filterBar?: ReactNode | undefined;
  toolbarSlot?: ReactNode | undefined;

  /** Bulk selection bar */
  bulkActions?: CommonResourcePageBulkActions | undefined;
  bulkActionBarSlot?: ReactNode | undefined;

  /** Main content area (ResourceDataTable, grid, split view, or children) */
  content?: ReactNode | undefined;
  children?: ReactNode | undefined;

  /** Pagination footer */
  pagination?: CommonResourcePagePagination | undefined;
  paginationSlot?: ReactNode | undefined;

  /** Slide-over detail drawer / pane */
  detailPane?: ReactNode | undefined;

  /** Wrap the filter + content + pagination in a unified card container (default: true) */
  cardWrapper?: boolean | undefined;

  /** Error or custom banner */
  error?: ReactNode | undefined;

  /** Custom styling classes */
  className?: string | undefined;
  containerClassName?: string | undefined;
}
```

#### Properties Reference

| Property        | Type                            | Default          | Description                                                       |
| :-------------- | :------------------------------ | :--------------- | :---------------------------------------------------------------- |
| `resource`      | `AdminResourceConfig`           | _Required_       | Resource metadata containing `id`, `label`, `path`, `icon`.       |
| `title`         | `string`                        | `resource.label` | Custom page title override.                                       |
| `description`   | `string`                        | _Required_       | Subtitle or descriptive context for the screen.                   |
| `headerActions` | `ReactNode`                     | `undefined`      | Action buttons rendered on the top-right of the page header.      |
| `backHref`      | `string`                        | `undefined`      | When present, renders a back button linking to this path.         |
| `meta`          | `ReactNode`                     | `undefined`      | Secondary metadata badges placed alongside the header title.      |
| `isRefreshing`  | `boolean`                       | `false`          | Indicates background query refetch state on the refresh button.   |
| `onRefresh`     | `() => void`                    | `undefined`      | Triggered when the header refresh button is clicked.              |
| `stats`         | `ResourceStatCardItem[]`        | `undefined`      | Array of metrics rendered via `ResourceStatCards`.                |
| `statsColumns`  | `1 \| 2 \| 3 \| 4 \| 5 \| 6`    | `4`              | Number of responsive columns for the stat cards grid.             |
| `statsLoading`  | `boolean`                       | `false`          | Displays skeletons inside the stat cards grid.                    |
| `filterBar`     | `ReactNode`                     | `undefined`      | Toolbar container housing search, facets, and filter controls.    |
| `bulkActions`   | `CommonResourcePageBulkActions` | `undefined`      | Configures the floating batch action bar when rows are selected.  |
| `pagination`    | `CommonResourcePagePagination`  | `undefined`      | Configures the table pagination footer.                           |
| `detailPane`    | `ReactNode`                     | `undefined`      | Slide-over drawer rendered alongside the page.                    |
| `cardWrapper`   | `boolean`                       | `true`           | Wraps toolbar, content, and pagination in a single bordered card. |
| `error`         | `ReactNode`                     | `undefined`      | Error banner rendered directly above the content card.            |

---

### 3.2 `ResourceDataTable<TData>`

`ResourceDataTable` is a production-grade data table built on `@tanstack/react-table` v8. It features configurable row density, dynamic column visibility dropdowns, multi-column sorting priority badges, accessibility attributes, skeleton loaders, custom empty states, and inline error handling.

#### Interface Definitions

```ts
export type TableDensity = "compact" | "normal" | "comfortable";

export interface ResourceDataTableProps<TData> {
  table: ReactTable<TData>;
  isLoading?: boolean | undefined;
  loadingRowCount?: number | undefined;
  error?:
    | {
        title: string;
        description?: string | undefined;
        onRetry?: (() => void) | undefined;
      }
    | undefined;
  empty?:
    | {
        title?: string | undefined;
        description?: string | undefined;
        icon?: LucideIcon | React.ComponentType<{ className?: string }> | undefined;
        action?:
          | {
              label: string;
              onClick: () => void;
            }
          | undefined;
      }
    | undefined;
  onRowClick?: ((row: TData) => void) | undefined;
  enableDensityToggle?: boolean | undefined;
  enableColumnVisibility?: boolean | undefined;
  density?: TableDensity | undefined;
  onDensityChange?: ((density: TableDensity) => void) | undefined;
  multiSort?: boolean | undefined;
  className?: string | undefined;
}
```

#### Density Variants & Typography

| Density Variant      | Header Class        | Cell Class            | Typical Use Case                                      |
| :------------------- | :------------------ | :-------------------- | :---------------------------------------------------- |
| `compact`            | `h-8 px-3 text-xs`  | `px-3 py-1.5 text-xs` | High-density audit logs, job event timelines.         |
| `normal` _(Default)_ | `h-10 px-4 text-sm` | `px-4 py-3 text-sm`   | Standard resource lists (Users, Roles, Files).        |
| `comfortable`        | `h-12 px-5 text-sm` | `px-5 py-4.5 text-sm` | Multi-line records, rich previews, settings matrices. |

#### Key Features

1. **Multi-Column Sorting Priority**  
   When `multiSort={true}` is enabled and multiple columns are sorted, each sorted header displays an ordinal badge (`1`, `2`, `3`) denoting its evaluation precedence, alongside ascending (`ArrowUp`) or descending (`ArrowDown`) icons.
2. **Dynamic Column Visibility**  
   When `enableColumnVisibility={true}`, a dropdown menu allows operators to toggle visibility for all hideable columns (`column.getCanHide()`).
3. **Adaptive Skeleton Loading**  
   While `isLoading={true}`, renders `loadingRowCount` rows of animated `<Skeleton />` blocks. Checkbox selector columns render square skeletons, while status badges render narrow pills.

---

### 3.3 `ResourceFilterBar`

`ResourceFilterBar` unifies text search with debounce controls, faceted multi-select popovers, date range pickers, active filter chips, and instant filter reset actions.

#### Interface Definitions

```ts
export interface ResourceFacetOption {
  label: string;
  value: string;
  icon?: (LucideIcon | React.ComponentType<{ className?: string }>) | undefined;
  count?: number | undefined;
}

export interface ResourceFacetFilter {
  key: string;
  label: string;
  options: ResourceFacetOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
}

export interface ResourceDateRange {
  from: string;
  to: string;
  onChange: (range: { from: string; to: string }) => void;
}

export interface ResourceActiveFilter {
  key?: string | undefined;
  label: string;
  onRemove: () => void;
}

export interface ResourceFilterSearch {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string | undefined;
  debounceMs?: number | undefined;
}

export interface ResourceFilterBarProps {
  search?: ResourceFilterSearch | undefined;
  facets?: ResourceFacetFilter[] | undefined;
  dateRange?: ResourceDateRange | undefined;
  activeFilters?: ResourceActiveFilter[] | undefined;
  onClearAll?: (() => void) | undefined;
  actions?: React.ReactNode | undefined;
  children?: React.ReactNode | undefined;
  className?: string | undefined;
}
```

#### Behavior & Interaction

- **Debounced Search:** Internal state handles immediate typing responsiveness. If `debounceMs` is specified (e.g., `300`), updates to `onChange` are debounced automatically. Clicking the `X` button clears search immediately.
- **Faceted Popover:** Utilizes `Command` and `Popover` primitives to provide searchable multi-selection lists with item counts and checkmark indicators.
- **Automatic Active Chips:** When `activeFilters` is omitted, the component automatically derives chip badges from active `facets` and `dateRange` with individual remove buttons and a "Clear all" button (`RotateCcw`).

---

### 3.4 `ResourceDetailPane` & `ResourcePropertyGrid`

Slide-over inspection panes and key-value property matrices designed for inspecting entity metadata without navigating away from the list view.

#### `ResourceDetailPane`

```ts
export type ResourceDetailPaneSize = "sm" | "md" | "lg" | "xl" | "full";

export interface ResourceDetailTab {
  id: string;
  label: string;
  icon?: ComponentType<{ className?: string }> | undefined;
  count?: number | string | undefined;
  badge?: ReactNode | undefined;
  content: ReactNode;
  disabled?: boolean | undefined;
}

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
```

#### `ResourcePropertyGrid`

```ts
export interface ResourcePropertyItem {
  key?: string | undefined;
  label: string;
  value?: unknown;
  type?:
    | "text"
    | "id"
    | "badge"
    | "status"
    | "timestamp"
    | "json"
    | "code"
    | "link"
    | "custom"
    | undefined;
  copyable?: boolean | undefined;
  copyValue?: string | undefined;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" | undefined;
  statusVariant?:
    | "default"
    | "secondary"
    | "destructive"
    | "outline"
    | "success"
    | "warning"
    | "info"
    | undefined;
  href?: string | undefined;
  colSpan?: 1 | 2 | "full" | undefined;
  description?: string | undefined;
  className?: string | undefined;
  placeholder?: string | undefined;
}

export interface ResourcePropertyGridProps {
  properties?: ResourcePropertyItem[] | undefined;
  items?: ResourcePropertyItem[] | undefined;
  columns?: 1 | 2 | 3 | 4 | undefined;
  density?: "compact" | "default" | "relaxed" | undefined;
  className?: string | undefined;
  emptyText?: string | undefined;
}
```

---

### 3.5 `ResourceStatCards`

Summary metric cards for KPI dashboards and resource screen headers.

```ts
export interface ResourceStatCardChange {
  value: string;
  positive: boolean;
}

export interface ResourceStatCardItem {
  label: string;
  value: string | number | ReactNode;
  description?: string | ReactNode | undefined;
  icon?: ComponentType<{ className?: string }> | undefined;
  change?: ResourceStatCardChange | undefined;
  trend?: string | ReactNode | undefined;
  href?: string | undefined;
  iconBg?: string | undefined;
  className?: string | undefined;
}

export interface ResourceStatCardsProps {
  items?: ResourceStatCardItem[] | undefined;
  columns?: 1 | 2 | 3 | 4 | 5 | 6 | undefined;
  isLoading?: boolean | undefined;
  loading?: boolean | undefined;
  skeletonCount?: number | undefined;
  className?: string | undefined;
}
```

---

### 3.6 Modal & Drawer Patterns (`ResourceDrawer`, `ConfirmDialog`)

- **`ResourceDrawer` (`@repo/web-ui/resource-drawer`)**  
  Used for standard resource creation and modification workflows (e.g., `CreateUserDrawer`, `RoleFormDrawer`). Provides fixed header, scrollable body, and sticky footer action buttons.
- **`ConfirmDialog` (`@repo/web-ui/confirm-dialog`)**  
  Accessible portal modal for destructive operations (e.g., blocking users, deleting roles, canceling jobs). Manages `Escape` key listeners, focus locking, and loading spinner states.

---

### 3.7 Global `TooltipProvider` & Shell Integration

To avoid tooltip flickering, nested provider collisions, and hydration mismatches, the root `Providers` component (`apps/admin/src/components/providers.tsx`) mounts a single global `<TooltipProvider delayDuration={0}>`:

```tsx
// apps/admin/src/components/providers.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createAdminQueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider delayDuration={0}>
          <CsrfBootstrap />
          {children}
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
```

This ensures that collapsed sidebar icon tooltips (`Sidebar` in `collapsible="icon"` mode), table action buttons, and truncated text badges render instantly on hover across the entire application.

---

## 4. Feature Screen Implementation Matrix

The Unified Admin Layout standardizes all 12 feature domains in `apps/admin`:

| #      | Feature Domain    | Route(s)                                                    | Nav Group  | Primary Components                                                                                           | Key Capabilities & Patterns                                                                                    |
| :----- | :---------------- | :---------------------------------------------------------- | :--------- | :----------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------- |
| **1**  | **Dashboard**     | `/`                                                         | Overview   | `ResourcePageShell`, `ResourceStatCards`, `DashboardOverview`                                                | System health overview, quick links, recent activity feeds, active operator metrics.                           |
| **2**  | **Organizations** | `/organizations`, `/organizations/[id]`                     | People     | `CommonResourcePage`, `ResourceDataTable`, `EditOrganizationDrawer`, `ConfirmDialog`                         | Workspace directory, tenant member management, role elevation, ownership transfers.                            |
| **3**  | **Users**         | `/users`, `/users/[id]`                                     | People     | `CommonResourcePage`, `ResourceDataTable`, `ResourceFilterBar`, `CreateUserDrawer`, `ConfirmDialog`          | Identity management, status facet filters (`ACTIVE`, `BLOCKED`), batch activation/block, audit timeline.       |
| **4**  | **Roles**         | `/roles`                                                    | People     | `CommonResourcePage`, `RoleFormDrawer`, `PermissionMultiSelect`, `ConfirmDialog`                             | RBAC role definitions, system vs custom role trees, granular permission matrix assignment.                     |
| **5**  | **Audit Logs**    | `/audit-logs`                                               | Operations | `CommonResourcePage`, `ResourceDataTable`, `ResourceFilterBar`, `ResourceDetailPane`, `ResourcePropertyGrid` | Append-only security audit events, JSON actor/payload inspector, date range filters, event search.             |
| **6**  | **Notifications** | `/notifications`                                            | Operations | `CommonResourcePage`, `NotificationsListView`, `ComposeForm`                                                 | Real-time SSE notification stream, broadcast dispatching, delivery queue monitoring.                           |
| **7**  | **Jobs**          | `/jobs`                                                     | Operations | `CommonResourcePage`, `ResourceDataTable`, `ResourceFilterBar`, `JobsDetailPane`, `ResourcePropertyGrid`     | PostgreSQL background job queues, status badges (`QUEUED`, `RUNNING`, `FAILED`), job cancellation, event logs. |
| **8**  | **Mail**          | `/mail`                                                     | Operations | `CommonResourcePage`, `ResourceDataTable`, `ResourceFilterBar`, `MailDetailDrawer`                           | Outbound SMTP email logs, delivery status inspection, raw template preview, retry triggers.                    |
| **9**  | **Files**         | `/files`                                                    | Operations | `CommonResourcePage`, `ResourceDataTable`, `ResourceFilterBar`, `FilesDetailDrawer`, `ConfirmDialog`         | Object storage browser, multipart upload triggers, file version trees, MIME filtering.                         |
| **10** | **Imports**       | `/imports`                                                  | Operations | `CommonResourcePage`, `ImportsListView`, `ConfirmDialog`                                                     | CSV/data import jobs, validation error matrices, dry-run progress, confirmation pipeline.                      |
| **11** | **Settings**      | `/settings`, `/settings/organization`, `/settings/security` | System     | `ResourcePageShell`, `SettingsListView`, `SettingCard`                                                       | Application configuration, organization settings, dynamic draft state per card with RHF.                       |
| **12** | **Security**      | `/security`, `/security/password`                           | System     | `ResourcePageShell`, `SecurityView`, `MfaManagement`, `ChangePasswordForm`                                   | Self-service operator security, TOTP MFA setup flow, recovery code regeneration, password changes.             |

---

## 5. Design Tokens & Visual Hierarchy

All styling relies strictly on CSS variables and Tailwind utility classes mapped from `@repo/web-ui`:

| Design Token               | Light Value / Class   | Dark Value / Class    | Architectural Usage                                   |
| :------------------------- | :-------------------- | :-------------------- | :---------------------------------------------------- |
| `background`               | `hsl(0 0% 100%)`      | `hsl(240 10% 3.9%)`   | Root viewport background.                             |
| `card` / `bg-card`         | `hsl(0 0% 100%)`      | `hsl(240 10% 3.9%)`   | `CommonResourcePage` card wrappers, drawers, dialogs. |
| `border` / `border-border` | `hsl(240 5.9% 90%)`   | `hsl(240 3.7% 15.9%)` | Structural borders for tables, headers, and toolbars. |
| `muted` / `bg-muted`       | `hsl(240 4.8% 95.9%)` | `hsl(240 3.7% 15.9%)` | Table header rows, hover states, filter chips.        |
| `primary` / `bg-primary`   | `hsl(240 5.9% 10%)`   | `hsl(0 0% 98%)`       | Primary call-to-action buttons, active pagination.    |
| `destructive`              | `hsl(0 84.2% 60.2%)`  | `hsl(0 62.8% 30.6%)`  | Danger buttons, error banners, blocked status pills.  |

- **Container Radius:** `rounded-xl` for resource card wrappers and modals; `rounded-md` for buttons and inputs.
- **Elevation:** `shadow-xs` on content cards; `shadow-2xl` on slide-over drawers and dialogs.
- **Transitions:** `transition-all duration-200` with subtle enter animations (`animate-in fade-in slide-in-from-bottom-1`).

---

## 6. Developer Guide: Adding a New Admin Feature

Follow this standardized recipe to add a new admin resource feature (e.g., `webhooks`).

### Step 1: Register Resource in Plugin Slice

Add the resource definition to `apps/admin/src/features/_plugin-resources/platform-admin/resources.ts`:

```ts
import { Webhook, type LucideIcon } from "lucide-react";
import type { AdminResourceConfig } from "@repo/web-utils/admin-resource";

export const webhooksAdminResource: AdminResourceConfig<LucideIcon> = {
  id: "webhooks",
  label: "Webhooks",
  group: "Operations",
  path: "/webhooks",
  icon: Webhook,
  features: ["list", "create", "show"],
  permissions: ["webhooks.read"],
  queryKey: "admin-webhooks",
};
```

### Step 2: Define View Model & Contracts

Create `apps/admin/src/features/webhooks/model/webhooks.types.ts`:

```ts
import type { Table } from "@tanstack/react-table";
import type { WebhookDto } from "@/lib/api-types";

export interface WebhooksViewModel {
  header: {
    total: number;
    isLoading: boolean;
    isFetching: boolean;
    canCreate: boolean;
    onCreateClick: () => void;
    onRefresh: () => void;
  };
  toolbar: {
    search: string;
    onSearchChange: (value: string) => void;
    status: string;
    onStatusChange: (status: string) => void;
    onClearFilters: () => void;
  };
  table: Table<WebhookDto>;
  detail: {
    selectedItem: WebhookDto | null;
    isOpen: boolean;
    onClose: () => void;
  };
}
```

### Step 3: Implement Controller Hook

Create `apps/admin/src/features/webhooks/controllers/use-webhooks-controller.ts`:

```ts
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import type { WebhooksViewModel } from "../model/webhooks.types";
import type { WebhookDto } from "@/lib/api-types";
import { webhookColumns } from "../ui/webhook-columns";

export function useWebhooksController(): WebhooksViewModel {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedItem, setSelectedItem] = useState<WebhookDto | null>(null);

  const query = useQuery({
    queryKey: ["admin-webhooks", { search, status }],
    queryFn: async () => {
      // call API client
      return { data: [] as WebhookDto[], total: 0 };
    },
  });

  const table = useReactTable({
    data: query.data?.data ?? [],
    columns: webhookColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return {
    header: {
      total: query.data?.total ?? 0,
      isLoading: query.isLoading,
      isFetching: query.isFetching,
      canCreate: true,
      onCreateClick: () => {
        /* open create drawer */
      },
      onRefresh: () => query.refetch(),
    },
    toolbar: {
      search,
      onSearchChange: setSearch,
      status,
      onStatusChange: setStatus,
      onClearFilters: () => {
        setSearch("");
        setStatus("all");
      },
    },
    table,
    detail: {
      selectedItem,
      isOpen: Boolean(selectedItem),
      onClose: () => setSelectedItem(null),
    },
  };
}
```

### Step 4: Build Presentational View with `CommonResourcePage`

Create `apps/admin/src/features/webhooks/ui/webhooks-list-view.tsx`:

```tsx
"use client";

import { Button } from "@repo/web-ui/button";
import { CommonResourcePage } from "@repo/web-ui/common-resource-page";
import { ResourceDataTable } from "@repo/web-ui/resource-data-table";
import { ResourceFilterBar } from "@repo/web-ui/resource-filter-bar";
import { Plus } from "lucide-react";
import type { WebhooksViewModel } from "../model/webhooks.types";
import { webhooksAdminResource } from "../../_plugin-resources/platform-admin/resources";
import { WebhookDetailPane } from "./webhook-detail-pane";

export function WebhooksListView({ header, toolbar, table, detail }: WebhooksViewModel) {
  return (
    <CommonResourcePage
      resource={webhooksAdminResource}
      description="Manage webhook subscriptions and delivery events."
      isRefreshing={header.isFetching}
      onRefresh={header.onRefresh}
      headerActions={
        header.canCreate ? (
          <Button size="sm" onClick={header.onCreateClick}>
            <Plus data-icon="inline-start" />
            New Webhook
          </Button>
        ) : null
      }
      filterBar={
        <ResourceFilterBar
          className="border-b border-border p-4"
          search={{
            value: toolbar.search,
            onChange: toolbar.onSearchChange,
            placeholder: "Search endpoint URL or event...",
          }}
          facets={[
            {
              key: "status",
              label: "Status",
              options: [
                { label: "Active", value: "ACTIVE" },
                { label: "Disabled", value: "DISABLED" },
              ],
              selectedValues: toolbar.status !== "all" ? [toolbar.status] : [],
              onChange: (vals) => toolbar.onStatusChange(vals[0] ?? "all"),
            },
          ]}
          onClearAll={toolbar.onClearFilters}
        />
      }
      detailPane={
        <WebhookDetailPane
          open={detail.isOpen}
          webhook={detail.selectedItem}
          onClose={detail.onClose}
        />
      }
    >
      <ResourceDataTable
        table={table}
        isLoading={header.isLoading}
        enableDensityToggle
        enableColumnVisibility
        onRowClick={(item) => {
          // Open detail
        }}
      />
    </CommonResourcePage>
  );
}
```

### Step 5: Mount Next.js Route Page

Create `apps/admin/src/app/[locale]/(app)/webhooks/page.tsx`:

```tsx
import { WebhooksListView } from "@/features/webhooks/ui/webhooks-list-view";
import { useWebhooksController } from "@/features/webhooks/controllers/use-webhooks-controller";

export default function WebhooksPage() {
  const vm = useWebhooksController();
  return <WebhooksListView {...vm} />;
}
```
