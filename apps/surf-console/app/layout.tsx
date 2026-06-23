import type { Metadata } from "next";
import "./upwind.css";
import "./globals.css";
import AppShell from "../components/shell/AppShell";
import { NotificationProvider } from "../components/shell/NotificationProvider";
import { getChangelog } from "../lib/content";

export const metadata: Metadata = {
  title: "Surf-Zone Console",
  description: "Surf-Zone Management Console",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Load changelog server-side so we can pass stable entry ids to the
  // NotificationProvider for the unread badge count.
  const changelog = await getChangelog();
  const allEntryIds = changelog.map((e) => e.id);

  // Demo-only: pre-mark the pre-existing (non-demo-doc) changelog history as read
  // so the before-state shows no unread badge. The automation's new shark-mitigation
  // entry is excluded, so it still surfaces a fresh badge after the bot runs.
  // Inert in production (flag unset ⇒ empty list).
  const demoSeedReadIds = process.env.NEXT_PUBLIC_DEMO_SEED_READ
    ? changelog.filter((e) => e.docId !== "shark-mitigation").map((e) => e.id)
    : [];

  return (
    <html lang="en">
      <body>
        <NotificationProvider allEntryIds={allEntryIds} demoSeedReadIds={demoSeedReadIds}>
          <AppShell>{children}</AppShell>
        </NotificationProvider>
      </body>
    </html>
  );
}
