"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { parentApi } from "@/lib/api/domain";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageMotion } from "@/components/shared/page-motion";
import { PeriodTimeline } from "@/components/shared/period-timeline";

export function StudentTimeline({
  studentId,
  mode
}: {
  studentId: string;
  mode: "today" | "history";
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const historyQuery = useQuery({
    queryKey: ["parent-student-timeline", studentId, mode, date],
    queryFn: () =>
      mode === "today"
        ? parentApi.today(studentId, date)
        : parentApi.history(studentId, `${date.slice(0, 8)}01`, date)
  });

  return (
    <PageMotion>
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">Portal Orang Tua</p>
          <h1 className="text-3xl font-semibold">
            {mode === "today" ? "Status kehadiran hari ini" : "Riwayat kehadiran"}
          </h1>
        </header>

        <FilterBar
          search=""
          onSearchChange={() => undefined}
          date={date}
          onDateChange={setDate}
          showSearch={false}
        />

        {historyQuery.isError ? (
          <EmptyState
            title="Gagal memuat timeline"
            description={`Periksa koneksi API atau tautan siswa ke akun parent. Detail: ${historyQuery.error.message}`}
          />
        ) : null}

        <PeriodTimeline
          items={historyQuery.data ?? []}
          emptyText={
            mode === "today"
              ? "Belum ada status absensi untuk hari ini."
              : "Belum ada riwayat absensi pada rentang bulan ini."
          }
        />
      </section>
    </PageMotion>
  );
}
