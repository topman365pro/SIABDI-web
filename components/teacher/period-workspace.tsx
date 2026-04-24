"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { teacherApi } from "@/lib/api/domain";
import { ATTENDANCE_PRIORITY, getAttendanceSourceLabel } from "@/lib/config/status";
import type { AttendanceStatus, TeacherObservation } from "@/lib/types";
import { EmptyState } from "@/components/shared/empty-state";
import { PageMotion } from "@/components/shared/page-motion";
import { SourceBadge, StatusBadge } from "@/components/shared/status-badge";

type TeacherInput = AttendanceStatus | TeacherObservation;

function defaultInput(status: AttendanceStatus | undefined, periodNo: number) {
  if (periodNo === 1) {
    return status === "HADIR" || status === "ALFA" ? status : "ALFA";
  }

  return "ABSENT";
}

export function TeacherPeriodWorkspace({
  classId,
  periodNo
}: {
  classId: string;
  periodNo: number;
}) {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const date = searchParams.get("date") ?? new Date().toISOString().slice(0, 10);
  const scheduleIdFromUrl = searchParams.get("scheduleId") ?? "";
  const [records, setRecords] = useState<Record<string, TeacherInput>>({});
  const periodQuery = useQuery({
    queryKey: ["teacher-period", classId, periodNo, date],
    queryFn: () => teacherApi.classPeriod(classId, periodNo, date)
  });

  const verifyMutation = useMutation({
    mutationFn: async () => {
      const scheduleId = scheduleIdFromUrl || periodQuery.data?.schedule.id || "";

      return teacherApi.verifyPeriod({
        classId,
        periodNo,
        attendanceDate: date,
        scheduleId,
        records: (periodQuery.data?.roster ?? []).map((row) => ({
          studentId: row.student.id,
          status:
            periodNo === 1
              ? (records[row.student.id] as "HADIR" | "ALFA" | undefined) ??
                (defaultInput(row.status?.status, periodNo) as "HADIR" | "ALFA")
              : undefined,
          teacherObservation:
            periodNo > 1
              ? ((records[row.student.id] as TeacherObservation | undefined) ?? "ABSENT")
              : undefined,
          note: row.status?.note ?? undefined
        }))
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["teacher-period", classId, periodNo, date]
      });
    }
  });

  const roster = periodQuery.data?.roster ?? [];

  return (
    <PageMotion>
      <section className="space-y-6">
        <header className="space-y-3">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">Guru Mapel</p>
          <h1 className="text-3xl font-semibold">
            {periodQuery.data?.schedule.class.name ?? "Memuat kelas"} · Periode {periodNo}
          </h1>
          <p className="max-w-3xl text-sm text-slate-600">
            {periodNo === 1
              ? "Jam pertama membentuk baseline hari itu. Tandai Masuk atau Alfa."
              : "Pergantian jam pelajaran memakai cross-check. Backend menentukan Masuk, Alfa, atau Bolos setelah membaca overlay resmi."}
          </p>
          <div className="flex flex-wrap gap-2">
            {ATTENDANCE_PRIORITY.map((status) => (
              <StatusBadge key={status} status={status} className="bg-white" />
            ))}
          </div>
        </header>

        {periodQuery.isError ? (
          <EmptyState
            title="Gagal memuat kelas"
            description={`Periksa jadwal guru, kelas, periode, tanggal, dan koneksi API. Detail: ${periodQuery.error.message}`}
          />
        ) : null}

        {!periodQuery.isLoading && roster.length === 0 && !periodQuery.isError ? (
          <EmptyState
            title="Roster kosong"
            description="Belum ada siswa aktif untuk kelas dan tanggal ini, atau jadwal guru belum cocok dengan periode yang dibuka."
          />
        ) : null}

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {roster.map((row) => {
            const currentInput = records[row.student.id] ?? defaultInput(row.status?.status, periodNo);

            return (
              <div key={row.student.id} className="rounded-lg border border-line bg-surface p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{row.student.fullName}</p>
                    <p className="text-sm text-slate-500">{row.student.nis}</p>
                  </div>
                  {row.status ? (
                    <StatusBadge status={row.status.status} />
                  ) : (
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-slate-500">
                      Belum ada
                    </span>
                  )}
                </div>

                <div className="mt-3 space-y-2">
                  <SourceBadge source={row.status?.source} />
                  {row.status?.note ? (
                    <p className="text-xs leading-relaxed text-slate-500">{row.status.note}</p>
                  ) : null}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {(periodNo === 1
                    ? [
                        { value: "HADIR", label: "Masuk" },
                        { value: "ALFA", label: "Alfa" }
                      ]
                    : [
                        { value: "PRESENT", label: "Ada di kelas" },
                        { value: "ABSENT", label: "Tidak ada" }
                      ]
                  ).map((option) => {
                    const active = currentInput === option.value;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setRecords((current) => ({
                            ...current,
                            [row.student.id]: option.value as TeacherInput
                          }))
                        }
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                          active
                            ? "bg-[var(--color-accent)] text-white"
                            : "border border-line bg-canvas text-slate-700"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        <div className="sticky bottom-4 z-10 rounded-lg border border-line bg-surface/95 p-4 shadow-panel backdrop-blur lg:static">
          {verifyMutation.isError ? (
            <p className="mb-3 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Gagal menyimpan verifikasi. Detail: {verifyMutation.error.message}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => verifyMutation.mutate()}
            disabled={verifyMutation.isPending || roster.length === 0}
            className="w-full rounded-full bg-[var(--color-accent)] px-5 py-3 font-semibold text-white disabled:opacity-60"
          >
            {verifyMutation.isPending ? "Menyimpan verifikasi..." : "Simpan Verifikasi"}
          </button>
          <p className="mt-3 text-center text-xs text-slate-500">
            Status final mengikuti backend. {getAttendanceSourceLabel("DISPENSATION")} dan Status resmi BK
            tetap menjadi overlay read-only untuk guru.
          </p>
        </div>
      </section>
    </PageMotion>
  );
}
