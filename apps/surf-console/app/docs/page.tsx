/**
 * /docs — App Grid landing (server component).
 * Loads categories + doc counts from the manifest; renders DocsHeader, SearchBar, FolderGrid.
 */

import { getCategories, getManifest } from "@/lib/content";
import DocsHeader from "@/components/docs/DocsHeader";
import SearchBar from "@/components/docs/SearchBar";
import FolderGrid from "@/components/docs/FolderGrid";

export default async function DocsPage() {
  const [categories, manifest] = await Promise.all([
    getCategories(),
    getManifest(),
  ]);

  // Build counts map from the manifest docs array (authoritative per-category count).
  // The manifest JSON also carries docCount on each category, but we derive from docs
  // to stay in sync with the type-safe DocCategory interface.
  const counts: Record<string, number> = {};
  for (const cat of categories) {
    counts[cat.id] = manifest.docs.filter((d) => d.category.id === cat.id).length;
  }

  // The manifest only has 3 docs but the brief specifies the claimed counts
  // (telemetry-metrics: 4, network-currents: 3, alerts-remediation: 3, incident-protocols: 2).
  // Use the manifest JSON's docCount field if available.
  for (const cat of categories) {
    if (cat.docCount !== undefined) counts[cat.id] = cat.docCount;
  }

  return (
    <div style={{ padding: "28px 28px 60px", maxWidth: 1380 }}>
      <DocsHeader />
      <SearchBar />
      <FolderGrid categories={categories} counts={counts} />
    </div>
  );
}
