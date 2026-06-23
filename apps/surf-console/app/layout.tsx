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
  // Load changelog server-side. The TopBar gift-icon badge counts only RECENT
  // changelog entries that are still unread — so pre-existing history (dated
  // 2025) never lights up the badge, and the automation's freshly-stamped entry
  // (createdAt = now) does. Same 7-day recency rule as the rest of the app.
  const changelog = await getChangelog();
  const RECENT_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const recentEntryIds = changelog
    .filter((e) => {
      const t = new Date(e.createdAt).getTime();
      return Number.isFinite(t) && now - t < RECENT_MS;
    })
    .map((e) => e.id);

  return (
    <html lang="en">
      <body>
        <NotificationProvider recentEntryIds={recentEntryIds}>
          <AppShell>{children}</AppShell>
        </NotificationProvider>
      </body>
    </html>
  );
}
