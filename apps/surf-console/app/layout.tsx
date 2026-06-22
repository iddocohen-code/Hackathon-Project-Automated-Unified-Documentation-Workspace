import type { Metadata } from "next";
import "./upwind.css";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
