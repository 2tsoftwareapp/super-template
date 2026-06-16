import { redirect } from "next/navigation";

export default function ProtectedLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  redirect("/");
}
