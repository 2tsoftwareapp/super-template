"use client";

import { useMailController } from "../controllers/use-mail-controller";
import { createMailDeliveriesColumns } from "../ui/mail-deliveries-columns";
import { MailListView } from "../ui/mail-list-view";

export function MailView() {
  const controller = useMailController({ createColumns: createMailDeliveriesColumns });
  return <MailListView {...controller} />;
}
