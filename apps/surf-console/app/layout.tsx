import type { Metadata } from "next";
import "./upwind.css";
import "./globals.css";
import AppShell from "../components/shell/AppShell";
import { NotificationProvider } from "../components/shell/NotificationProvider";

export const metadata: Metadata = {
  title: "Surf-Zone Console",
  description: "Surf-Zone Management Console",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <NotificationProvider>
          <AppShell>{children}</AppShell>
        </NotificationProvider>
      </body>
    </html>
  );
}
