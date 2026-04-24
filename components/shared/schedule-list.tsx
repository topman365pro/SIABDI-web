"use client";

import Link from "next/link";
import { Clock3, MapPin } from "lucide-react";
import type { TeacherScheduleItem } from "@/lib/types";
import { formatTime } from "@/lib/utils/format";

export function ScheduleList({
  items,
  date
}: {
  items: TeacherScheduleItem[];
  date: string;
}) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/app/guru/kelas/${item.class.id}/periode/${item.lessonPeriodNo}?date=${date}&scheduleId=${item.id}`}
          className="group rounded-lg border border-line bg-surface p-4 transition hover:border-[var(--color-accent)] hover:bg-white"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--color-accent)]">
                {item.lessonPeriod.label}
              </p>
              <h3 className="mt-2 text-xl font-semibold leading-tight">{item.class.name}</h3>
              <p className="mt-1 truncate text-sm text-slate-600">{item.subject.name}</p>
            </div>
            <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-[var(--color-accent)]">
              Buka
            </span>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Clock3 className="size-3.5" />
              {formatTime(item.lessonPeriod.startTime)} - {formatTime(item.lessonPeriod.endTime)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="size-3.5" />
              {item.roomName ?? "Ruang belum diisi"}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
