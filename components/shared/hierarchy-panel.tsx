"use client";

import { cn } from "@/lib/utils/cn";

interface HierarchyPanelProps<T extends Record<string, any>> {
  title: string;
  items: T[];
  activeId: string;
  emptyMessage?: string;
  getTitle: (item: T) => string;
  getSubtitle: (item: T) => string;
  onSelect: (id: string) => void;
}

export function HierarchyPanel<T extends Record<string, any>>({
  title,
  items,
  activeId,
  emptyMessage = "Belum ada data.",
  getTitle,
  getSubtitle,
  onSelect
}: HierarchyPanelProps<T>) {
  return (
    <section className="rounded-lg border border-line bg-surface p-4">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
        {title}
      </h2>
      <div className="mt-3 grid max-h-[22rem] gap-2 overflow-y-auto pr-1">
        {items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line px-4 py-6 text-sm text-slate-500">
            {emptyMessage}
          </p>
        ) : (
          items.map((item) => {
            const itemId = String(item.id ?? "");
            const active = itemId === activeId;

            return (
              <button
                key={itemId}
                type="button"
                onClick={() => onSelect(itemId)}
                className={cn(
                  "rounded-lg border px-4 py-3 text-left transition",
                  active
                    ? "border-[var(--color-accent)] bg-accent-soft"
                    : "border-line bg-canvas hover:border-[var(--color-accent)]"
                )}
              >
                <p className="font-semibold">{getTitle(item)}</p>
                <p className="mt-1 text-xs text-slate-500">{getSubtitle(item)}</p>
              </button>
            );
          })
        )}
      </div>
    </section>
  );
}
