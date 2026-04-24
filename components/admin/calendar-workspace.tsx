"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { adminApi } from "@/lib/api/domain";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageMotion } from "@/components/shared/page-motion";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { FormField } from "@/components/forms/form-field";
import { formatDisplayDate, formatTime } from "@/lib/utils/format";

const calendarSchema = z.object({
  calendarDate: z.string().min(1, "Tanggal wajib diisi."),
  academicYearId: z.string().min(1, "Tahun ajaran wajib diisi."),
  dayType: z.enum(["SCHOOL_DAY", "HOLIDAY", "EXAM_DAY", "SPECIAL_SCHEDULE"]),
  title: z.string().min(1, "Judul wajib diisi."),
  description: z.string().optional(),
  isSchoolDay: z.boolean()
});

const overrideSchema = z.object({
  calendarDate: z.string().min(1, "Tanggal wajib diisi."),
  lessonPeriodNo: z.coerce.number().min(1),
  classId: z.string().optional(),
  label: z.string().min(1, "Label wajib diisi."),
  startTime: z.string().min(1, "Jam mulai wajib diisi."),
  endTime: z.string().min(1, "Jam selesai wajib diisi."),
  isActive: z.boolean(),
  reason: z.string().optional()
});

type CalendarFormValues = z.infer<typeof calendarSchema>;
type OverrideFormValues = z.infer<typeof overrideSchema>;

function timePayload(value: string) {
  return /^\d{2}:\d{2}$/.test(value) ? `1970-01-01T${value}:00.000Z` : value;
}

export function CalendarWorkspace() {
  const queryClient = useQueryClient();
  const [calendarEditKey, setCalendarEditKey] = useState<string | null>(null);
  const [overrideEditId, setOverrideEditId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ type: "calendar" | "override"; id: string } | null>(null);

  const calendarForm = useForm<CalendarFormValues>({
    resolver: zodResolver(calendarSchema),
    defaultValues: {
      calendarDate: new Date().toISOString().slice(0, 10),
      academicYearId: "",
      dayType: "SCHOOL_DAY",
      title: "",
      description: "",
      isSchoolDay: true
    }
  });
  const overrideForm = useForm<OverrideFormValues>({
    resolver: zodResolver(overrideSchema),
    defaultValues: {
      calendarDate: new Date().toISOString().slice(0, 10),
      lessonPeriodNo: 1,
      classId: "",
      label: "",
      startTime: "07:00",
      endTime: "07:45",
      isActive: true,
      reason: ""
    }
  });

  const calendarDaysQuery = useQuery({
    queryKey: ["calendar-days"],
    queryFn: () => adminApi.list("/calendar-days")
  });
  const overridesQuery = useQuery({
    queryKey: ["daily-period-overrides"],
    queryFn: () => adminApi.list("/daily-period-overrides")
  });
  const academicYearsQuery = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => adminApi.list("/academic-years")
  });
  const classesQuery = useQuery({
    queryKey: ["classes"],
    queryFn: () => adminApi.list("/classes")
  });
  const periodsQuery = useQuery({
    queryKey: ["lesson-periods"],
    queryFn: () => adminApi.list("/lesson-periods")
  });

  const saveCalendarMutation = useMutation({
    mutationFn: async (values: CalendarFormValues) => {
      const payload = {
        ...values,
        description: values.description || undefined
      };

      if (calendarEditKey) {
        return adminApi.update("/calendar-days", calendarEditKey, payload);
      }

      return adminApi.create("/calendar-days", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["calendar-days"] });
      calendarForm.reset();
      setCalendarEditKey(null);
    }
  });

  const saveOverrideMutation = useMutation({
    mutationFn: async (values: OverrideFormValues) => {
      const payload = {
        ...values,
        classId: values.classId || undefined,
        reason: values.reason || undefined,
        startTime: timePayload(values.startTime),
        endTime: timePayload(values.endTime)
      };

      if (overrideEditId) {
        return adminApi.update("/daily-period-overrides", overrideEditId, payload);
      }

      return adminApi.create("/daily-period-overrides", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["daily-period-overrides"] });
      overrideForm.reset();
      setOverrideEditId(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (target: { type: "calendar" | "override"; id: string }) =>
      target.type === "calendar"
        ? adminApi.remove("/calendar-days", target.id)
        : adminApi.remove("/daily-period-overrides", target.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["calendar-days"] });
      await queryClient.invalidateQueries({ queryKey: ["daily-period-overrides"] });
      setDeleteTarget(null);
    }
  });

  const academicYearOptions = (academicYearsQuery.data ?? []).map((item) => ({
    value: item.id,
    label: item.name
  }));
  const classOptions = [
    { value: "", label: "Semua kelas" },
    ...(classesQuery.data ?? []).map((item) => ({ value: item.id, label: item.name }))
  ];
  const periodOptions = (periodsQuery.data ?? []).map((item) => ({
    value: String(item.periodNo),
    label: item.label
  }));

  return (
    <PageMotion>
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">Admin / TU</p>
          <h1 className="text-3xl font-semibold">Kalender & Override Jam</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Kelola hari sekolah aktif dan perubahan jam khusus sebelum absensi harian berjalan.
          </p>
        </header>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Hari Kalender Akademik</h2>
            <DataTable
              columns={[
                { key: "calendarDate", label: "Tanggal", render: (row) => formatDisplayDate(row.calendarDate) },
                { key: "title", label: "Judul", render: (row) => row.title },
                { key: "dayType", label: "Tipe Hari", render: (row) => row.dayType },
                { key: "isSchoolDay", label: "Hari Sekolah", render: (row) => (row.isSchoolDay ? "Ya" : "Tidak") },
                {
                  key: "actions",
                  label: "Aksi",
                  render: (row) => (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setCalendarEditKey(String(row.calendarDate).slice(0, 10));
                          calendarForm.reset({
                            calendarDate: String(row.calendarDate).slice(0, 10),
                            academicYearId: row.academicYearId,
                            dayType: row.dayType,
                            title: row.title,
                            description: row.description ?? "",
                            isSchoolDay: row.isSchoolDay
                          });
                        }}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteTarget({ type: "calendar", id: String(row.calendarDate).slice(0, 10) });
                        }}
                        className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                      >
                        Hapus
                      </button>
                    </div>
                  )
                }
              ]}
              rows={calendarDaysQuery.data ?? []}
              rowKey={(row) => String(row.calendarDate)}
            />
            {calendarDaysQuery.isError ? (
              <EmptyState
                title="Gagal memuat kalender"
                description={`Periksa koneksi API dan role ADMIN_TU. Detail: ${calendarDaysQuery.error.message}`}
              />
            ) : null}
          </div>

          <form
            onSubmit={calendarForm.handleSubmit((values) => saveCalendarMutation.mutate(values))}
            className="rounded-lg border border-line bg-surface p-5"
          >
            <h3 className="text-lg font-semibold">{calendarEditKey ? "Edit hari" : "Tambah hari"}</h3>
            <div className="mt-4 grid gap-4">
              <FormField field={{ name: "calendarDate", label: "Tanggal", type: "date" }} control={calendarForm.control} />
              <FormField
                field={{ name: "academicYearId", label: "Tahun Ajaran", type: "select" }}
                control={calendarForm.control}
                options={academicYearOptions}
              />
              <FormField
                field={{
                  name: "dayType",
                  label: "Tipe Hari",
                  type: "select",
                  options: [
                    { value: "SCHOOL_DAY", label: "Hari Sekolah" },
                    { value: "HOLIDAY", label: "Libur" },
                    { value: "EXAM_DAY", label: "Ujian" },
                    { value: "SPECIAL_SCHEDULE", label: "Jadwal Khusus" }
                  ]
                }}
                control={calendarForm.control}
                options={[
                  { value: "SCHOOL_DAY", label: "Hari Sekolah" },
                  { value: "HOLIDAY", label: "Libur" },
                  { value: "EXAM_DAY", label: "Ujian" },
                  { value: "SPECIAL_SCHEDULE", label: "Jadwal Khusus" }
                ]}
              />
              <FormField field={{ name: "title", label: "Judul", type: "text" }} control={calendarForm.control} />
              <FormField field={{ name: "description", label: "Deskripsi", type: "textarea" }} control={calendarForm.control} />
              <FormField field={{ name: "isSchoolDay", label: "Hari Sekolah Aktif", type: "checkbox" }} control={calendarForm.control} />
              <button className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white">
                {saveCalendarMutation.isPending ? "Menyimpan..." : "Simpan Hari"}
              </button>
              {saveCalendarMutation.isError ? (
                <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  Gagal menyimpan kalender. Detail: {saveCalendarMutation.error.message}
                </p>
              ) : null}
            </div>
          </form>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Override Jam Pelajaran</h2>
            <DataTable
              columns={[
                { key: "calendarDate", label: "Tanggal", render: (row) => formatDisplayDate(row.calendarDate) },
                { key: "lessonPeriodNo", label: "Periode", render: (row) => row.lessonPeriodNo },
                { key: "label", label: "Label", render: (row) => row.label },
                { key: "startTime", label: "Mulai", render: (row) => formatTime(row.startTime) },
                { key: "endTime", label: "Selesai", render: (row) => formatTime(row.endTime) },
                {
                  key: "actions",
                  label: "Aksi",
                  render: (row) => (
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setOverrideEditId(row.id);
                          overrideForm.reset({
                            calendarDate: String(row.calendarDate).slice(0, 10),
                            lessonPeriodNo: row.lessonPeriodNo,
                            classId: row.classId ?? "",
                            label: row.label,
                            startTime: formatTime(row.startTime),
                            endTime: formatTime(row.endTime),
                            isActive: row.isActive,
                            reason: row.reason ?? ""
                          });
                        }}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setDeleteTarget({ type: "override", id: row.id });
                        }}
                        className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                      >
                        Hapus
                      </button>
                    </div>
                  )
                }
              ]}
              rows={overridesQuery.data ?? []}
              rowKey={(row) => row.id}
            />
            {overridesQuery.isError ? (
              <EmptyState
                title="Gagal memuat override"
                description={`Periksa koneksi API dan role ADMIN_TU. Detail: ${overridesQuery.error.message}`}
              />
            ) : null}
          </div>

          <form
            onSubmit={overrideForm.handleSubmit((values) => saveOverrideMutation.mutate(values))}
            className="rounded-lg border border-line bg-surface p-5"
          >
            <h3 className="text-lg font-semibold">{overrideEditId ? "Edit override" : "Tambah override"}</h3>
            <div className="mt-4 grid gap-4">
              <FormField field={{ name: "calendarDate", label: "Tanggal", type: "date" }} control={overrideForm.control} />
              <FormField
                field={{ name: "lessonPeriodNo", label: "Jam Pelajaran", type: "select" }}
                control={overrideForm.control}
                options={periodOptions}
              />
              <FormField
                field={{ name: "classId", label: "Kelas", type: "select" }}
                control={overrideForm.control}
                options={classOptions}
              />
              <FormField field={{ name: "label", label: "Label", type: "text" }} control={overrideForm.control} />
              <FormField field={{ name: "startTime", label: "Jam Mulai", type: "time" }} control={overrideForm.control} />
              <FormField field={{ name: "endTime", label: "Jam Selesai", type: "time" }} control={overrideForm.control} />
              <FormField field={{ name: "isActive", label: "Aktif", type: "checkbox" }} control={overrideForm.control} />
              <FormField field={{ name: "reason", label: "Alasan", type: "textarea" }} control={overrideForm.control} />
              <button className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white">
                {saveOverrideMutation.isPending ? "Menyimpan..." : "Simpan Override"}
              </button>
              {saveOverrideMutation.isError ? (
                <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  Gagal menyimpan override. Detail: {saveOverrideMutation.error.message}
                </p>
              ) : null}
            </div>
          </form>
        </section>
      </section>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus data kalender?"
        description="Data ini dipakai untuk menentukan apakah absensi reguler berjalan pada hari tersebut."
        confirmLabel={deleteMutation.isPending ? "Menghapus..." : "Hapus"}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </PageMotion>
  );
}
