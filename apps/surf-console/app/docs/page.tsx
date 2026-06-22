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

  return (
    <div style={{ padding: "28px 28px 60px", maxWidth: 1380 }}>
      <DocsHeader />
      <SearchBar />
      <FolderGrid
        categories={categories}
        counts={counts}
        incidentProtocolDocs={incidentProtocolDocs}
      />
    </div>
  );
}
