import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const accessToken = (await cookies()).get("access_token")?.value;

  if (!accessToken) {
    redirect("/login");
  }

  return (
    <main style={{ maxWidth: 720, margin: "10vh auto", fontFamily: "system-ui", padding: 24 }}>
      <h1 style={{ fontSize: 28 }}>Admin</h1>
      <p>Signed in. User management arrives in P2.</p>
    </main>
  );
}
