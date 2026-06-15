import { normalizeUsersSearch } from "@/lib/search-params";
import { UsersView } from "./users-view";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  normalizeUsersSearch(await searchParams);
  return <UsersView />;
}
