import { Suspense } from "react";

import { UsersView } from "./users-view";

export default function Page() {
  return (
    <Suspense>
      <UsersView />
    </Suspense>
  );
}
