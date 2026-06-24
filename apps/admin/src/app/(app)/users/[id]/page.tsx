import { Suspense } from "react";

import { UserDetailView } from "./user-detail-view";

export default function Page() {
  return (
    <Suspense>
      <UserDetailView />
    </Suspense>
  );
}
