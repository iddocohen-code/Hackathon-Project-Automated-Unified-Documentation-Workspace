/**
 * /docs — App Grid landing (server component).
 * Loads categories + doc counts from the manifest; renders DocsHeader, SearchBar, FolderGrid.
 * Also pre-loads incident-protocols docs for the FolderModal (passed as a prop to FolderGrid).
 */

import { getCategories, getManifest, getDocsByCategory } from "@/lib/content";
import DocsHeader from "@/components/docs/DocsHeader";
import SearchBar from "@/components/docs/SearchBar";
import FolderGrid from "@/components/docs/FolderGrid";

export default async function DocsPage() {
  const [categories, manifest, incidentProtocolDocs] = await Promise.all([
    getCategories(),
    getManifest(),
    getDocsByCategory("incident-protocols"),
  ]);

  // docCount is the authoritative claimed per-folder count (may exceed fully-defined docs); fall back to counting real docs.
  const counts: Record<string, number> = {};
  for (const cat of categories) {
    counts[cat.id] = cat.docCount ?? manifest.docs.filter((d) => d.category.id === cat.id).length;
  }

  // "Updated"/"What's New" indicators must reflect reality: a doc counts as
  // freshly updated only when its updatedAt is recent. The bot stamps
  // updatedAt = now on publish, while the seeded baseline docs are dated 2025 —
  // so nothing is flagged until the automation actually regenerates a doc.
  const RECENT_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const isRecent = (iso: string): boolean => {
    const t = new Date(iso).getTime();
    return Number.isFinite(t) && now - t < RECENT_MS;
  };
  const updatedDocIds = manifest.docs.filter((d) => isRecent(d.updatedAt)).map((d) => d.id);
  const updatedCategoryIds = categories
    .filter((cat) => manifest.docs.some((d) => d.category.id === cat.id && isRecent(d.updatedAt)))
    .map((cat) => cat.id);
  const whatsNewCount = updatedDocIds.length;

  return (
    <div style={{ padding: "28px 28px 60px", maxWidth: 1380 }}>
      <DocsHeader />
      <SearchBar />
      <FolderGrid
        categories={categories}
        counts={counts}
        incidentProtocolDocs={incidentProtocolDocs}
        updatedDocIds={updatedDocIds}
        updatedCategoryIds={updatedCategoryIds}
        whatsNewCount={whatsNewCount}
      />
    </div>
  );
}
