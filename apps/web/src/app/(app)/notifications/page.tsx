import { normalizeNotificationsSearch } from "@/lib/search-params";
import { NotificationsView } from "./notifications-view";

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  normalizeNotificationsSearch(await searchParams);
  return <NotificationsView />;
}
