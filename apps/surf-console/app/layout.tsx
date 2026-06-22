import type { Metadata } from "next";
import "./upwind.css";
import "./globals.css";
import AppShell from "../components/shell/AppShell";

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
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
