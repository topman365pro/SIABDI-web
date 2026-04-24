"use client";

import React from "react";
import { ATTENDANCE_SOURCE_LABELS, ATTENDANCE_STATUS_MAP } from "@/lib/config/status";
import type { AttendanceSource, AttendanceStatus } from "@/lib/types";
import { cn } from "@/lib/utils/cn";

const toneClasses = {
  neutral: "bg-muted text-ink",
  success: "bg-emerald-100 text-emerald-800",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-rose-100 text-rose-800",
  accent: "bg-[var(--color-accent-soft)] text-[var(--color-accent)]",
  info: "bg-sky-100 text-sky-800"
};

export function StatusBadge({ status, className }: { status: AttendanceStatus; className?: string }) {
  const config = ATTENDANCE_STATUS_MAP[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-[0.18em] uppercase",
        toneClasses[config.tone],
        className
      )}
    >
      {config.label}
    </span>
  );
}

export function SourceBadge({ source }: { source?: AttendanceSource | null }) {
  return (
    <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 ring-1 ring-line">
      {source ? ATTENDANCE_SOURCE_LABELS[source] ?? source : "Belum diverifikasi"}
    </span>
  );
}
