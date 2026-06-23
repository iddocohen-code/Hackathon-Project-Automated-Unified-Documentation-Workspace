/**
 * /docs/[slug] — Server component: loads a single doc and renders DocView.
 * Returns 404 (notFound()) when the slug is not in the manifest.
 * generateStaticParams() pre-renders all known doc slugs at build time.
 */

import { notFound } from "next/navigation";
import { getDoc, getManifest } from "@/lib/content";
import DocView from "@/components/docs/DocView";
import { isAdmin } from "@/lib/adminSession";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const manifest = await getManifest();
  return manifest.docs.map((doc) => ({ slug: doc.id }));
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const [doc, admin] = await Promise.all([getDoc(slug), isAdmin()]);

  if (!doc) {
    notFound();
  }

  return (
    <div style={{ padding: "28px 28px 60px" }}>
      <DocView doc={doc} isAdmin={admin} />
    </div>
  );
}
