/**
 * /admin — the manual-editor workspace (server component, behind the gate).
 *
 * force-dynamic: read the manifest + selected doc fresh from disk on every
 * request, so version labels and bodies reflect the latest committed state
 * (no static caching of admin content).
 */

export const dynamic = "force-dynamic";

import { getManifest, getDoc } from "@/lib/content";
import AdminShell from "@/components/admin/AdminShell";
import DocTree from "@/components/admin/DocTree";
import MarkdownEditor from "@/components/admin/MarkdownEditor";

interface AdminPageProps {
  searchParams: Promise<{ doc?: string }>;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const { doc: slug } = await searchParams;
  const manifest = await getManifest();
  const selected = slug ? await getDoc(slug) : null;

  return (
    <AdminShell>
      <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
        <DocTree categories={manifest.categories} docs={manifest.docs} selectedId={slug ?? null} />
        <div style={{ flex: 1, minWidth: 0, display: "flex" }}>
          {selected ? (
            <MarkdownEditor
              key={selected.id}
              docId={selected.id}
              title={selected.title}
              category={selected.category.name}
              version={selected.version}
              initialBody={selected.bodyMarkdown}
            />
          ) : (
            <div style={{ margin: "auto", color: "var(--text-secondary, #64748B)", fontSize: 14 }}>
              Select a document from the left to edit.
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
