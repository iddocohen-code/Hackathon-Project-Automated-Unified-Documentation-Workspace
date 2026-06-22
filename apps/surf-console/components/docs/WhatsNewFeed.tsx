/**
 * WhatsNewFeed — maps a ChangeEntry[] into a list of ChangeEntryCards.
 * Source: design-mock lines 319–356.
 *
 * Props:
 *   entries — ChangeEntry[] (newest-first, sorted by caller)
 */

import React from "react";
import type { ChangeEntry } from "@surf/types";
import ChangeEntryCard from "./ChangeEntryCard";

interface WhatsNewFeedProps {
  entries: ChangeEntry[];
}

export default function WhatsNewFeed({ entries }: WhatsNewFeedProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {entries.map((entry) => (
        <ChangeEntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
