"use client";

import { SourceBadge, StatusBadge } from "@/components/shared/status-badge";
import type { StudentHistoryEntry } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

export function PeriodTimeline({
  items,
  emptyText = "Belum ada status absensi untuk rentang ini."
}: {
  items: StudentHistoryEntry[];
  emptyText?: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-line bg-surface px-4 py-6 text-sm text-slate-500">
        {emptyText}
      </div>
    );
  }

  return (
    <ol className="relative space-y-3 before:absolute before:left-4 before:top-4 before:h-[calc(100%-2rem)] before:w-px before:bg-line">
      {items.map((item, index) => (
        <li key={item.id} className="relative grid grid-cols-[2rem_1fr] gap-3">
          <span
            className={cn(
              "z-10 flex size-8 items-center justify-center rounded-full border border-line bg-surface text-xs font-semibold",
              index === 0 ? "text-[var(--color-accent)]" : "text-slate-500"
            )}
          >
            {item.lessonPeriodNo}
          </span>
          <div className="rounded-lg border border-line bg-surface px-4 py-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Jam ke-{item.lessonPeriodNo}
                </p>
                <p className="mt-1 text-sm font-medium text-slate-700">
                  {item.note ?? "Status final tercatat oleh sistem."}
                </p>
              </div>
              <StatusBadge status={item.status} />
            </div>
            <div className="mt-3">
              <SourceBadge source={item.source} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
