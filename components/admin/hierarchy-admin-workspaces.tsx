"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { adminApi } from "@/lib/api/domain";
import { AcademicClassHierarchy } from "@/components/shared/academic-class-hierarchy";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { PageMotion } from "@/components/shared/page-motion";
import { FormField } from "@/components/forms/form-field";
import {
  filterBatchesForAcademicYear,
  filterClassesForHierarchy,
  filterStudentsForBatch,
  selectDefaultAcademicYearId,
  selectDefaultBatchId,
  selectDefaultClassId
} from "@/lib/utils/hierarchy";
import { formatDisplayDate, formatTime } from "@/lib/utils/format";
import type { AdminFieldConfig } from "@/lib/config/admin-resources";

const weekdayOptions = [
  { value: "MONDAY", label: "Senin" },
  { value: "TUESDAY", label: "Selasa" },
  { value: "WEDNESDAY", label: "Rabu" },
  { value: "THURSDAY", label: "Kamis" },
  { value: "FRIDAY", label: "Jumat" },
  { value: "SATURDAY", label: "Sabtu" }
];

const weekdayLabel = Object.fromEntries(weekdayOptions.map((item) => [item.value, item.label]));

const classSchema = z.object({
  academicYearId: z.string().min(1, "Tahun ajaran wajib dipilih."),
  batchId: z.string().min(1, "Angkatan wajib dipilih."),
  name: z.string().min(1, "Nama kelas wajib diisi."),
  gradeLevel: z.coerce.number().min(1, "Tingkat wajib diisi."),
  major: z.string().optional(),
  parallelCode: z.string().optional(),
  homeroomStaffId: z.string().optional(),
  isActive: z.boolean()
});

const enrollmentSchema = z.object({
  studentId: z.string().min(1, "Siswa wajib dipilih."),
  classId: z.string().min(1, "Kelas wajib dipilih."),
  startDate: z.string().min(1, "Tanggal mulai wajib diisi."),
  endDate: z.string().optional(),
  isActive: z.boolean()
});

const scheduleSchema = z.object({
  academicYearId: z.string().min(1, "Tahun ajaran wajib dipilih."),
  classId: z.string().min(1, "Kelas wajib dipilih."),
  subjectId: z.string().min(1, "Mapel wajib dipilih."),
  teacherStaffId: z.string().min(1, "Guru wajib dipilih."),
  weekday: z.string().min(1, "Hari wajib dipilih."),
  lessonPeriodNo: z.coerce.number().min(1, "Jam pelajaran wajib dipilih."),
  roomName: z.string().optional(),
  isActive: z.boolean()
});

type ClassFormValues = z.infer<typeof classSchema>;
type EnrollmentFormValues = z.infer<typeof enrollmentSchema>;
type ScheduleFormValues = z.infer<typeof scheduleSchema>;

const classFields: AdminFieldConfig[] = [
  { name: "name", label: "Nama Kelas", type: "text", required: true },
  { name: "gradeLevel", label: "Tingkat", type: "number", required: true },
  { name: "major", label: "Jurusan", type: "text" },
  { name: "parallelCode", label: "Paralel", type: "text" },
  { name: "homeroomStaffId", label: "Wali Kelas", type: "select" },
  { name: "isActive", label: "Aktif", type: "checkbox" }
];

const enrollmentFields: AdminFieldConfig[] = [
  { name: "studentId", label: "Siswa", type: "select", required: true },
  { name: "startDate", label: "Tanggal Mulai", type: "date", required: true },
  { name: "endDate", label: "Tanggal Selesai", type: "date" },
  { name: "isActive", label: "Aktif", type: "checkbox" }
];

const scheduleFields: AdminFieldConfig[] = [
  { name: "subjectId", label: "Mapel", type: "select", required: true },
  { name: "teacherStaffId", label: "Guru", type: "select", required: true },
  { name: "weekday", label: "Hari", type: "select", required: true, options: weekdayOptions },
  { name: "lessonPeriodNo", label: "Jam Pelajaran", type: "select", required: true },
  { name: "roomName", label: "Ruang", type: "text" },
  { name: "isActive", label: "Aktif", type: "checkbox" }
];

function normalizeOptional(value?: string | null) {
  return value ? value : undefined;
}

function resolveHierarchy(
  academicYears: Record<string, any>[],
  batches: Record<string, any>[],
  classes: Record<string, any>[],
  academicYearId: string,
  batchId: string,
  classId: string
) {
  const activeAcademicYearId = selectDefaultAcademicYearId(academicYears, academicYearId);
  const filteredBatches = filterBatchesForAcademicYear(
    batches,
    classes,
    activeAcademicYearId
  );
  const activeBatchId = selectDefaultBatchId(filteredBatches, batchId);
  const filteredClasses = filterClassesForHierarchy(
    classes,
    activeAcademicYearId,
    activeBatchId
  );
  const activeClassId = selectDefaultClassId(filteredClasses, classId);

  return {
    activeAcademicYearId,
    activeBatchId,
    activeClassId,
    filteredBatches,
    filteredClasses,
    selectedAcademicYear: academicYears.find((item) => item.id === activeAcademicYearId),
    selectedBatch: batches.find((item) => item.id === activeBatchId),
    selectedClass: classes.find((item) => item.id === activeClassId)
  };
}

function textMatches(row: Record<string, any>, search: string) {
  return JSON.stringify(row).toLowerCase().includes(search.toLowerCase());
}

function ModalFrame({
  eyebrow,
  title,
  subtitle,
  onClose,
  children
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/35 px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-lg bg-surface p-6 shadow-panel md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">
              {eyebrow}
            </p>
            <h3 className="mt-2 text-2xl font-semibold">{title}</h3>
            {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
          </div>
          <button type="button" onClick={onClose} className="text-sm text-slate-500">
            Tutup
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ClassHierarchyWorkspace() {
  const queryClient = useQueryClient();
  const [academicYearId, setAcademicYearId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [classId, setClassId] = useState("");
  const [search, setSearch] = useState("");
  const [activeRow, setActiveRow] = useState<Record<string, any> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, any> | null>(null);
  const [showForm, setShowForm] = useState(false);

  const academicYearsQuery = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => adminApi.list("/academic-years")
  });
  const batchesQuery = useQuery({
    queryKey: ["batches"],
    queryFn: () => adminApi.list("/batches")
  });
  const classesQuery = useQuery({
    queryKey: ["classes"],
    queryFn: () => adminApi.list("/classes")
  });
  const staffsQuery = useQuery({
    queryKey: ["staffs"],
    queryFn: () => adminApi.list("/staffs")
  });

  const hierarchy = resolveHierarchy(
    academicYearsQuery.data ?? [],
    batchesQuery.data ?? [],
    classesQuery.data ?? [],
    academicYearId,
    batchId,
    classId
  );
  const rows = hierarchy.filteredClasses.filter((row) => textMatches(row, search));

  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classSchema),
    defaultValues: {
      academicYearId: hierarchy.activeAcademicYearId,
      batchId: hierarchy.activeBatchId,
      name: "",
      gradeLevel: 10,
      major: "",
      parallelCode: "",
      homeroomStaffId: "",
      isActive: true
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (values: ClassFormValues) => {
      const payload = {
        academicYearId: values.academicYearId,
        batchId: values.batchId,
        name: values.name,
        gradeLevel: Number(values.gradeLevel),
        major: normalizeOptional(values.major),
        parallelCode: normalizeOptional(values.parallelCode),
        homeroomStaffId: normalizeOptional(values.homeroomStaffId),
        isActive: values.isActive
      };

      if (activeRow) {
        return adminApi.update("/classes", activeRow.id, payload);
      }

      return adminApi.create("/classes", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-resource", "classes"] });
      setActiveRow(null);
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (row: Record<string, any>) => adminApi.remove("/classes", row.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["classes"] });
      setDeleteTarget(null);
    }
  });

  const staffOptions = (staffsQuery.data ?? [])
    .filter((staff) => staff.id)
    .map((staff) => ({
      value: String(staff.id),
      label: staff.fullName
    }));

  function openCreate() {
    setActiveRow(null);
    form.reset({
      academicYearId: hierarchy.activeAcademicYearId,
      batchId: hierarchy.activeBatchId,
      name: "",
      gradeLevel: 10,
      major: "",
      parallelCode: "",
      homeroomStaffId: "",
      isActive: true
    });
    setShowForm(true);
  }

  function openEdit(row: Record<string, any>) {
    setActiveRow(row);
    form.reset({
      academicYearId: row.academicYearId ?? hierarchy.activeAcademicYearId,
      batchId: row.batchId ?? hierarchy.activeBatchId,
      name: row.name ?? "",
      gradeLevel: row.gradeLevel ?? 10,
      major: row.major ?? "",
      parallelCode: row.parallelCode ?? "",
      homeroomStaffId: row.homeroomStaffId ?? "",
      isActive: row.isActive ?? true
    });
    setShowForm(true);
  }

  return (
    <PageMotion>
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Admin / TU
          </p>
          <h1 className="text-3xl font-semibold">Kelas</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Kelola kelas dengan hierarki Tahun Ajaran, Angkatan, lalu Kelas.
          </p>
        </header>

        <AcademicClassHierarchy
          academicYears={academicYearsQuery.data ?? []}
          batches={batchesQuery.data ?? []}
          classes={classesQuery.data ?? []}
          academicYearId={academicYearId}
          batchId={batchId}
          classId={classId}
          onAcademicYearChange={setAcademicYearId}
          onBatchChange={setBatchId}
          onClassChange={setClassId}
        />

        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {hierarchy.selectedAcademicYear?.name ?? "Tahun ajaran"} /{" "}
              {hierarchy.selectedBatch?.name ?? "Angkatan"}
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Daftar Kelas</h2>
          </div>

          <FilterBar
            search={search}
            onSearchChange={setSearch}
            trailing={
              <button
                type="button"
                onClick={openCreate}
                disabled={!hierarchy.activeAcademicYearId || !hierarchy.activeBatchId}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Plus className="size-4" />
                Tambah Kelas
              </button>
            }
          />

          {classesQuery.isError || batchesQuery.isError || academicYearsQuery.isError ? (
            <EmptyState
              title="Gagal memuat hierarki kelas"
              description="Periksa koneksi API dan role ADMIN_TU. Detail error tersedia di console browser/server."
            />
          ) : rows.length === 0 ? (
            <EmptyState
              title="Belum ada kelas untuk angkatan ini"
              description="Buat kelas baru. Tahun ajaran dan angkatan akan otomatis mengikuti konteks yang dipilih."
              action={
                <button
                  type="button"
                  onClick={openCreate}
                  disabled={!hierarchy.activeAcademicYearId || !hierarchy.activeBatchId}
                  className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Tambah Kelas
                </button>
              }
            />
          ) : (
            <DataTable
              columns={[
                { key: "name", label: "Nama", render: (row) => row.name },
                { key: "gradeLevel", label: "Tingkat", render: (row) => row.gradeLevel },
                { key: "major", label: "Jurusan", render: (row) => row.major ?? "-" },
                {
                  key: "homeroom",
                  label: "Wali Kelas",
                  render: (row) => row.homeroomStaff?.fullName ?? "-"
                },
                { key: "active", label: "Aktif", render: (row) => (row.isActive ? "Ya" : "Tidak") },
                {
                  key: "actions",
                  label: "Aksi",
                  render: (row) => (
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700"
                      >
                        <Trash2 className="size-3.5" />
                        Hapus
                      </button>
                    </div>
                  )
                }
              ]}
              rows={rows}
              rowKey={(row) => String(row.id)}
            />
          )}
        </section>
      </section>

      {showForm ? (
        <ModalFrame
          eyebrow={activeRow ? "Edit" : "Tambah"}
          title="Kelas"
          subtitle={`${hierarchy.selectedAcademicYear?.name ?? "Tahun ajaran"} / ${
            hierarchy.selectedBatch?.name ?? "Angkatan"
          }`}
          onClose={() => setShowForm(false)}
        >
          <form
            onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
            className="mt-6 grid gap-4 md:grid-cols-2"
          >
            <input type="hidden" {...form.register("academicYearId")} />
            <input type="hidden" {...form.register("batchId")} />
            {classFields.map((field) => (
              <div key={field.name} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                <FormField
                  field={field}
                  control={form.control}
                  options={field.name === "homeroomStaffId" ? staffOptions : field.options ?? []}
                />
              </div>
            ))}
            <FormActions pending={saveMutation.isPending} onCancel={() => setShowForm(false)} />
            {saveMutation.isError ? (
              <p className="md:col-span-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Gagal menyimpan kelas. Detail: {saveMutation.error.message}
              </p>
            ) : null}
          </form>
        </ModalFrame>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus kelas ini?"
        description="Kelas yang sudah dipakai enrollment, jadwal, atau absensi mungkin ditolak oleh backend."
        confirmLabel={deleteMutation.isPending ? "Menghapus..." : "Hapus"}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </PageMotion>
  );
}

export function EnrollmentHierarchyWorkspace() {
  const queryClient = useQueryClient();
  const [academicYearId, setAcademicYearId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [classId, setClassId] = useState("");
  const [search, setSearch] = useState("");
  const [activeRow, setActiveRow] = useState<Record<string, any> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, any> | null>(null);
  const [showForm, setShowForm] = useState(false);

  const academicYearsQuery = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => adminApi.list("/academic-years")
  });
  const batchesQuery = useQuery({ queryKey: ["batches"], queryFn: () => adminApi.list("/batches") });
  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: () => adminApi.list("/classes") });
  const studentsQuery = useQuery({ queryKey: ["students"], queryFn: () => adminApi.list("/students") });
  const enrollmentsQuery = useQuery({
    queryKey: ["enrollments"],
    queryFn: () => adminApi.list("/enrollments")
  });

  const hierarchy = resolveHierarchy(
    academicYearsQuery.data ?? [],
    batchesQuery.data ?? [],
    classesQuery.data ?? [],
    academicYearId,
    batchId,
    classId
  );
  const studentOptions = useMemo(
    () =>
      filterStudentsForBatch(studentsQuery.data ?? [], hierarchy.activeBatchId)
        .filter((student) => student.id)
        .map((student) => ({
          value: String(student.id),
          label: `${student.fullName ?? "Siswa"}${student.nis ? ` · ${student.nis}` : ""}`
        })),
    [hierarchy.activeBatchId, studentsQuery.data]
  );
  const rows = (enrollmentsQuery.data ?? [])
    .filter((row) => row.classId === hierarchy.activeClassId || row.class?.id === hierarchy.activeClassId)
    .filter((row) => textMatches(row, search));

  const form = useForm<EnrollmentFormValues>({
    resolver: zodResolver(enrollmentSchema),
    defaultValues: {
      studentId: "",
      classId: hierarchy.activeClassId,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      isActive: true
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (values: EnrollmentFormValues) => {
      const payload = {
        classId: values.classId,
        startDate: values.startDate,
        endDate: normalizeOptional(values.endDate),
        isActive: values.isActive
      };

      if (activeRow) {
        return adminApi.update("/enrollments", activeRow.id, {
          ...payload,
          studentId: values.studentId
        });
      }

      return adminApi.create(`/students/${values.studentId}/enrollments`, payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      setActiveRow(null);
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (row: Record<string, any>) => adminApi.remove("/enrollments", row.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["enrollments"] });
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      setDeleteTarget(null);
    }
  });

  function openCreate() {
    setActiveRow(null);
    form.reset({
      studentId: studentOptions[0]?.value ?? "",
      classId: hierarchy.activeClassId,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: "",
      isActive: true
    });
    setShowForm(true);
  }

  function openEdit(row: Record<string, any>) {
    setActiveRow(row);
    form.reset({
      studentId: row.studentId ?? row.student?.id ?? "",
      classId: row.classId ?? row.class?.id ?? hierarchy.activeClassId,
      startDate: row.startDate ? String(row.startDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
      endDate: row.endDate ? String(row.endDate).slice(0, 10) : "",
      isActive: row.isActive ?? true
    });
    setShowForm(true);
  }

  return (
    <PageMotion>
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Admin / TU
          </p>
          <h1 className="text-3xl font-semibold">Enrollment</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Kelola penempatan siswa berdasarkan Tahun Ajaran, Angkatan, dan Kelas aktif.
          </p>
        </header>

        <AcademicClassHierarchy
          academicYears={academicYearsQuery.data ?? []}
          batches={batchesQuery.data ?? []}
          classes={classesQuery.data ?? []}
          academicYearId={academicYearId}
          batchId={batchId}
          classId={classId}
          onAcademicYearChange={setAcademicYearId}
          onBatchChange={setBatchId}
          onClassChange={setClassId}
        />

        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {hierarchy.selectedAcademicYear?.name ?? "Tahun ajaran"} /{" "}
              {hierarchy.selectedBatch?.name ?? "Angkatan"} / {hierarchy.selectedClass?.name ?? "Kelas"}
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Enrollment Siswa</h2>
          </div>

          <FilterBar
            search={search}
            onSearchChange={setSearch}
            trailing={
              <button
                type="button"
                onClick={openCreate}
                disabled={!hierarchy.activeClassId}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Plus className="size-4" />
                Tambah Enrollment
              </button>
            }
          />

          {rows.length === 0 ? (
            <EmptyState
              title="Belum ada enrollment di kelas ini"
              description="Tambahkan siswa dari angkatan terpilih ke kelas yang sedang aktif."
              action={
                <button
                  type="button"
                  onClick={openCreate}
                  disabled={!hierarchy.activeClassId}
                  className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Tambah Enrollment
                </button>
              }
            />
          ) : (
            <DataTable
              columns={[
                { key: "student", label: "Siswa", render: (row) => row.student?.fullName ?? row.studentId },
                { key: "nis", label: "NIS", render: (row) => row.student?.nis ?? "-" },
                {
                  key: "startDate",
                  label: "Mulai",
                  render: (row) => (row.startDate ? formatDisplayDate(row.startDate) : "-")
                },
                {
                  key: "endDate",
                  label: "Selesai",
                  render: (row) => (row.endDate ? formatDisplayDate(row.endDate) : "-")
                },
                { key: "active", label: "Aktif", render: (row) => (row.isActive ? "Ya" : "Tidak") },
                {
                  key: "actions",
                  label: "Aksi",
                  render: (row) => (
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700"
                      >
                        <Trash2 className="size-3.5" />
                        Hapus
                      </button>
                    </div>
                  )
                }
              ]}
              rows={rows}
              rowKey={(row) => String(row.id)}
            />
          )}

          {enrollmentsQuery.isError ? (
            <EmptyState
              title="Gagal memuat enrollment"
              description={`Periksa koneksi API dan role ADMIN_TU. Detail: ${enrollmentsQuery.error.message}`}
            />
          ) : null}
        </section>
      </section>

      {showForm ? (
        <ModalFrame
          eyebrow={activeRow ? "Edit" : "Tambah"}
          title="Enrollment"
          subtitle={hierarchy.selectedClass?.name ?? "Kelas belum dipilih"}
          onClose={() => setShowForm(false)}
        >
          <form
            onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
            className="mt-6 grid gap-4 md:grid-cols-2"
          >
            <input type="hidden" {...form.register("classId")} />
            {enrollmentFields.map((field) => (
              <div key={field.name} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                <FormField
                  field={field}
                  control={form.control}
                  options={field.name === "studentId" ? studentOptions : field.options ?? []}
                />
              </div>
            ))}
            <FormActions pending={saveMutation.isPending} onCancel={() => setShowForm(false)} />
            {saveMutation.isError ? (
              <p className="md:col-span-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Gagal menyimpan enrollment. Detail: {saveMutation.error.message}
              </p>
            ) : null}
          </form>
        </ModalFrame>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus enrollment ini?"
        description="Aksi ini menghapus relasi siswa ke kelas pada periode tersebut."
        confirmLabel={deleteMutation.isPending ? "Menghapus..." : "Hapus"}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </PageMotion>
  );
}

export function ScheduleHierarchyWorkspace() {
  const queryClient = useQueryClient();
  const [academicYearId, setAcademicYearId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [classId, setClassId] = useState("");
  const [search, setSearch] = useState("");
  const [activeRow, setActiveRow] = useState<Record<string, any> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Record<string, any> | null>(null);
  const [showForm, setShowForm] = useState(false);

  const academicYearsQuery = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => adminApi.list("/academic-years")
  });
  const batchesQuery = useQuery({ queryKey: ["batches"], queryFn: () => adminApi.list("/batches") });
  const classesQuery = useQuery({ queryKey: ["classes"], queryFn: () => adminApi.list("/classes") });
  const schedulesQuery = useQuery({
    queryKey: ["schedules"],
    queryFn: () => adminApi.list("/schedules")
  });
  const subjectsQuery = useQuery({ queryKey: ["subjects"], queryFn: () => adminApi.list("/subjects") });
  const staffsQuery = useQuery({ queryKey: ["staffs"], queryFn: () => adminApi.list("/staffs") });
  const periodsQuery = useQuery({
    queryKey: ["lesson-periods"],
    queryFn: () => adminApi.list("/lesson-periods")
  });

  const hierarchy = resolveHierarchy(
    academicYearsQuery.data ?? [],
    batchesQuery.data ?? [],
    classesQuery.data ?? [],
    academicYearId,
    batchId,
    classId
  );
  const rows = (schedulesQuery.data ?? [])
    .filter(
      (row) =>
        (row.classId === hierarchy.activeClassId || row.class?.id === hierarchy.activeClassId) &&
        (row.academicYearId === hierarchy.activeAcademicYearId ||
          row.academicYear?.id === hierarchy.activeAcademicYearId)
    )
    .filter((row) => textMatches(row, search));
  const subjectOptions = (subjectsQuery.data ?? [])
    .filter((subject) => subject.id)
    .map((subject) => ({
      value: String(subject.id),
      label: subject.name
    }));
  const teacherOptions = (staffsQuery.data ?? [])
    .filter((staff) => staff.id)
    .map((staff) => ({
      value: String(staff.id),
      label: staff.fullName
    }));
  const periodOptions = (periodsQuery.data ?? []).map((period) => ({
    value: String(period.periodNo),
    label: `${period.label}${period.startTime ? ` · ${formatTime(period.startTime)}` : ""}`
  }));

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      academicYearId: hierarchy.activeAcademicYearId,
      classId: hierarchy.activeClassId,
      subjectId: "",
      teacherStaffId: "",
      weekday: "MONDAY",
      lessonPeriodNo: 1,
      roomName: "",
      isActive: true
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (values: ScheduleFormValues) => {
      const payload = {
        academicYearId: values.academicYearId,
        classId: values.classId,
        subjectId: values.subjectId,
        teacherStaffId: values.teacherStaffId,
        weekday: values.weekday,
        lessonPeriodNo: Number(values.lessonPeriodNo),
        roomName: normalizeOptional(values.roomName),
        isActive: values.isActive
      };

      if (activeRow) {
        return adminApi.update("/schedules", activeRow.id, payload);
      }

      return adminApi.create("/schedules", payload);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["schedules"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-resource", "schedules"] });
      setActiveRow(null);
      setShowForm(false);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (row: Record<string, any>) => adminApi.remove("/schedules", row.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["schedules"] });
      setDeleteTarget(null);
    }
  });

  function openCreate() {
    setActiveRow(null);
    form.reset({
      academicYearId: hierarchy.activeAcademicYearId,
      classId: hierarchy.activeClassId,
      subjectId: subjectOptions[0]?.value ?? "",
      teacherStaffId: teacherOptions[0]?.value ?? "",
      weekday: "MONDAY",
      lessonPeriodNo: Number(periodOptions[0]?.value ?? 1),
      roomName: "",
      isActive: true
    });
    setShowForm(true);
  }

  function openEdit(row: Record<string, any>) {
    setActiveRow(row);
    form.reset({
      academicYearId: row.academicYearId ?? row.academicYear?.id ?? hierarchy.activeAcademicYearId,
      classId: row.classId ?? row.class?.id ?? hierarchy.activeClassId,
      subjectId: row.subjectId ?? row.subject?.id ?? "",
      teacherStaffId: row.teacherStaffId ?? row.teacher?.id ?? "",
      weekday: row.weekday ?? "MONDAY",
      lessonPeriodNo: row.lessonPeriodNo ?? row.lessonPeriod?.periodNo ?? 1,
      roomName: row.roomName ?? "",
      isActive: row.isActive ?? true
    });
    setShowForm(true);
  }

  return (
    <PageMotion>
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--color-accent)]">
            Admin / TU
          </p>
          <h1 className="text-3xl font-semibold">Jadwal</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Susun jadwal pelajaran berdasarkan kelas dalam hierarki akademik.
          </p>
        </header>

        <AcademicClassHierarchy
          academicYears={academicYearsQuery.data ?? []}
          batches={batchesQuery.data ?? []}
          classes={classesQuery.data ?? []}
          academicYearId={academicYearId}
          batchId={batchId}
          classId={classId}
          onAcademicYearChange={setAcademicYearId}
          onBatchChange={setBatchId}
          onClassChange={setClassId}
        />

        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {hierarchy.selectedAcademicYear?.name ?? "Tahun ajaran"} /{" "}
              {hierarchy.selectedBatch?.name ?? "Angkatan"} / {hierarchy.selectedClass?.name ?? "Kelas"}
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Jadwal Kelas</h2>
          </div>

          <FilterBar
            search={search}
            onSearchChange={setSearch}
            trailing={
              <button
                type="button"
                onClick={openCreate}
                disabled={!hierarchy.activeClassId}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Plus className="size-4" />
                Tambah Jadwal
              </button>
            }
          />

          {rows.length === 0 ? (
            <EmptyState
              title="Belum ada jadwal di kelas ini"
              description="Tambahkan mapel, guru, hari, dan jam pelajaran untuk kelas yang sedang dipilih."
              action={
                <button
                  type="button"
                  onClick={openCreate}
                  disabled={!hierarchy.activeClassId}
                  className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  Tambah Jadwal
                </button>
              }
            />
          ) : (
            <DataTable
              columns={[
                { key: "weekday", label: "Hari", render: (row) => weekdayLabel[row.weekday] ?? row.weekday },
                {
                  key: "period",
                  label: "Jam",
                  render: (row) => row.lessonPeriod?.label ?? `Jam ${row.lessonPeriodNo}`
                },
                { key: "subject", label: "Mapel", render: (row) => row.subject?.name ?? row.subjectId },
                { key: "teacher", label: "Guru", render: (row) => row.teacher?.fullName ?? row.teacherStaffId },
                { key: "room", label: "Ruang", render: (row) => row.roomName ?? "-" },
                {
                  key: "actions",
                  label: "Aksi",
                  render: (row) => (
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => openEdit(row)}
                        className="rounded-full border border-line px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(row)}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-rose-700"
                      >
                        <Trash2 className="size-3.5" />
                        Hapus
                      </button>
                    </div>
                  )
                }
              ]}
              rows={rows}
              rowKey={(row) => String(row.id)}
            />
          )}

          {schedulesQuery.isError ? (
            <EmptyState
              title="Gagal memuat jadwal"
              description={`Periksa koneksi API dan role ADMIN_TU. Detail: ${schedulesQuery.error.message}`}
            />
          ) : null}
        </section>
      </section>

      {showForm ? (
        <ModalFrame
          eyebrow={activeRow ? "Edit" : "Tambah"}
          title="Jadwal"
          subtitle={hierarchy.selectedClass?.name ?? "Kelas belum dipilih"}
          onClose={() => setShowForm(false)}
        >
          <form
            onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}
            className="mt-6 grid gap-4 md:grid-cols-2"
          >
            <input type="hidden" {...form.register("academicYearId")} />
            <input type="hidden" {...form.register("classId")} />
            {scheduleFields.map((field) => (
              <div key={field.name} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                <FormField
                  field={field}
                  control={form.control}
                  options={
                    field.name === "subjectId"
                      ? subjectOptions
                      : field.name === "teacherStaffId"
                        ? teacherOptions
                        : field.name === "lessonPeriodNo"
                          ? periodOptions
                          : field.options ?? []
                  }
                />
              </div>
            ))}
            <FormActions pending={saveMutation.isPending} onCancel={() => setShowForm(false)} />
            {saveMutation.isError ? (
              <p className="md:col-span-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Gagal menyimpan jadwal. Detail: {saveMutation.error.message}
              </p>
            ) : null}
          </form>
        </ModalFrame>
      ) : null}

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus jadwal ini?"
        description="Jadwal yang sudah dipakai absensi mungkin ditolak oleh backend."
        confirmLabel={deleteMutation.isPending ? "Menghapus..." : "Hapus"}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget)}
      />
    </PageMotion>
  );
}

function FormActions({ pending, onCancel }: { pending: boolean; onCancel: () => void }) {
  return (
    <div className="md:col-span-2 flex justify-end gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="rounded-full border border-line px-5 py-3 text-sm font-medium"
      >
        Batal
      </button>
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "Menyimpan..." : "Simpan"}
      </button>
    </div>
  );
}
