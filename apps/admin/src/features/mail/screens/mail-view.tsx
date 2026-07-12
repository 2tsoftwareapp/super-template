"use client";

import { useMailController } from "../controllers/use-mail-controller";
import { MailListView } from "../ui/mail-list-view";

export function MailView() {
  const controller = useMailController();
  return <MailListView {...controller} />;
}
