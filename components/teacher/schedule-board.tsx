"use client";

import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { teacherApi } from "@/lib/api/domain";
import { FilterBar } from "@/components/shared/filter-bar";
import { EmptyState } from "@/components/shared/empty-state";
import { PageMotion } from "@/components/shared/page-motion";
import { ScheduleList } from "@/components/shared/schedule-list";

export function TeacherScheduleBoard({
  mode = "dashboard"
}: {
  mode?: "dashboard" | "schedule";
}) {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const schedulesQuery = useQuery({
    queryKey: ["teacher-schedules", date],
    queryFn: () => teacherApi.schedules(date)
  });

  return (
    <PageMotion>
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">Guru Mapel</p>
          <h1 className="text-3xl font-semibold">
            {mode === "dashboard" ? "Jam mengajar hari ini" : "Jadwal mengajar"}
          </h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Pilih jam pelajaran. Jam pertama memakai base check, jam berikutnya memakai cross-check dan status final
            mengikuti prioritas Dispensasi, Sakit, Izin, Bolos, Masuk, lalu Alfa.
          </p>
        </header>

        <FilterBar
          search=""
          onSearchChange={() => undefined}
          date={date}
          onDateChange={setDate}
          showSearch={false}
        />

        {(schedulesQuery.data ?? []).length === 0 ? (
          <EmptyState
            title="Tidak ada jadwal mengajar"
            description="Belum ada jadwal aktif untuk tanggal yang dipilih."
          />
        ) : (
          <ScheduleList items={schedulesQuery.data ?? []} date={date} />
        )}
      </section>
    </PageMotion>
  );
}
