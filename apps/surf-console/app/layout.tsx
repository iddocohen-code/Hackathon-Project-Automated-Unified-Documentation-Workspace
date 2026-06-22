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

  return (
    <html lang="en">
      <body>
        <NotificationProvider allEntryIds={allEntryIds}>
          <AppShell>{children}</AppShell>
        </NotificationProvider>
      </body>
    </html>
  );
}
