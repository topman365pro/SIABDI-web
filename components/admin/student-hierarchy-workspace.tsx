"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, UserRoundPen } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { adminApi } from "@/lib/api/domain";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { HierarchyPanel } from "@/components/shared/hierarchy-panel";
import { PageMotion } from "@/components/shared/page-motion";
import { FormField } from "@/components/forms/form-field";
import { formatDisplayDate } from "@/lib/utils/format";
import { getActiveEnrollmentForClass } from "@/lib/utils/hierarchy";
import type { AdminFieldConfig } from "@/lib/config/admin-resources";

const studentSchema = z.object({
  batchId: z.string().min(1, "Angkatan wajib dipilih."),
  nis: z.string().min(1, "NIS wajib diisi."),
  fullName: z.string().min(1, "Nama siswa wajib diisi."),
  gender: z.enum(["L", "P"]).optional().or(z.literal("")),
  birthDate: z.string().optional(),
  isActive: z.boolean()
});

type StudentFormValues = z.infer<typeof studentSchema>;

const studentFields: AdminFieldConfig[] = [
  { name: "nis", label: "NIS", type: "text", required: true },
  { name: "fullName", label: "Nama Lengkap", type: "text", required: true },
  {
    name: "gender",
    label: "Gender",
    type: "select",
    options: [
      { value: "L", label: "Laki-laki" },
      { value: "P", label: "Perempuan" }
    ]
  },
  { name: "birthDate", label: "Tanggal Lahir", type: "date" },
  { name: "isActive", label: "Aktif", type: "checkbox" }
];

function normalizeStudentPayload(values: StudentFormValues) {
  return {
    batchId: values.batchId,
    nis: values.nis,
    fullName: values.fullName,
    gender: values.gender || undefined,
    birthDate: values.birthDate || undefined,
    isActive: values.isActive
  };
}

export function StudentHierarchyWorkspace() {
  const queryClient = useQueryClient();
  const [academicYearId, setAcademicYearId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [classId, setClassId] = useState("");
  const [search, setSearch] = useState("");
  const [editingStudent, setEditingStudent] = useState<Record<string, any> | null>(null);
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
  const studentsQuery = useQuery({
    queryKey: ["students"],
    queryFn: () => adminApi.list("/students")
  });

  const activeAcademicYearId =
    academicYearId ||
    academicYearsQuery.data?.find((item) => item.isActive)?.id ||
    academicYearsQuery.data?.[0]?.id ||
    "";

  const filteredBatches = useMemo(() => {
    const classBatchIds = new Set(
      (classesQuery.data ?? [])
        .filter((classItem) => classItem.academicYearId === activeAcademicYearId)
        .map((classItem) => classItem.batchId)
    );

    return (batchesQuery.data ?? []).filter((batch) => classBatchIds.has(batch.id));
  }, [activeAcademicYearId, batchesQuery.data, classesQuery.data]);

  const activeBatchId = batchId || filteredBatches[0]?.id || "";
  const filteredClasses = useMemo(
    () =>
      (classesQuery.data ?? []).filter(
        (classItem) =>
          classItem.academicYearId === activeAcademicYearId && classItem.batchId === activeBatchId
      ),
    [activeAcademicYearId, activeBatchId, classesQuery.data]
  );
  const activeClassId = classId || filteredClasses[0]?.id || "";
  const selectedAcademicYear = academicYearsQuery.data?.find((item) => item.id === activeAcademicYearId);
  const selectedBatch = batchesQuery.data?.find((item) => item.id === activeBatchId);
  const selectedClass = classesQuery.data?.find((item) => item.id === activeClassId);

  useEffect(() => {
    if (activeAcademicYearId && academicYearId !== activeAcademicYearId) {
      setAcademicYearId(activeAcademicYearId);
    }
  }, [academicYearId, activeAcademicYearId]);

  useEffect(() => {
    if (activeBatchId && batchId !== activeBatchId) {
      setBatchId(activeBatchId);
    }
  }, [activeBatchId, batchId]);

  useEffect(() => {
    if (activeClassId && classId !== activeClassId) {
      setClassId(activeClassId);
    }
  }, [activeClassId, classId]);

  useEffect(() => {
    setBatchId("");
    setClassId("");
  }, [academicYearId]);

  useEffect(() => {
    setClassId("");
  }, [batchId]);

  const visibleStudents = useMemo(() => {
    const normalizedSearch = search.toLowerCase();

    return (studentsQuery.data ?? [])
      .filter((student) => {
        if (!activeClassId) {
          return student.batchId === activeBatchId;
        }

        return Boolean(getActiveEnrollmentForClass(student, activeClassId));
      })
      .filter((student) =>
        `${student.fullName} ${student.nis}`.toLowerCase().includes(normalizedSearch)
      );
  }, [activeBatchId, activeClassId, search, studentsQuery.data]);

  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      batchId: activeBatchId,
      nis: "",
      fullName: "",
      gender: "",
      birthDate: "",
      isActive: true
    }
  });

  const saveStudentMutation = useMutation({
    mutationFn: async (values: StudentFormValues) => {
      const payload = normalizeStudentPayload(values);

      if (editingStudent) {
        return adminApi.update("/students", editingStudent.id, payload);
      }

      const createdStudent = await adminApi.create<Record<string, any>>("/students", payload);

      if (activeClassId) {
        await adminApi.create(`/students/${createdStudent.id}/enrollments`, {
          classId: activeClassId,
          startDate: new Date().toISOString().slice(0, 10),
          isActive: true
        });
      }

      return createdStudent;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["students"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-resource", "students"] });
      setShowForm(false);
      setEditingStudent(null);
      form.reset({
        batchId: activeBatchId,
        nis: "",
        fullName: "",
        gender: "",
        birthDate: "",
        isActive: true
      });
    }
  });

  function openCreate() {
    setEditingStudent(null);
    form.reset({
      batchId: activeBatchId,
      nis: "",
      fullName: "",
      gender: "",
      birthDate: "",
      isActive: true
    });
    setShowForm(true);
  }

  function openEdit(student: Record<string, any>) {
    setEditingStudent(student);
    form.reset({
      batchId: student.batchId ?? activeBatchId,
      nis: student.nis ?? "",
      fullName: student.fullName ?? "",
      gender: student.gender ?? "",
      birthDate: student.birthDate ? String(student.birthDate).slice(0, 10) : "",
      isActive: student.isActive ?? true
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
          <h1 className="text-3xl font-semibold">Manajemen Siswa</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Kelola siswa dengan urutan operasional Tahun Ajaran, Angkatan, Kelas, lalu Siswa.
          </p>
        </header>

        <div className="grid gap-4 xl:grid-cols-3">
          <HierarchyPanel
            title="Tahun Ajaran"
            items={academicYearsQuery.data ?? []}
            activeId={activeAcademicYearId}
            getTitle={(item) => item.name}
            getSubtitle={(item) =>
              `${formatDisplayDate(item.startDate)} - ${formatDisplayDate(item.endDate)}${
                item.isActive ? " · Aktif" : ""
              }`
            }
            onSelect={(id) => setAcademicYearId(id)}
          />
          <HierarchyPanel
            title="Angkatan"
            items={filteredBatches}
            activeId={activeBatchId}
            getTitle={(item) => item.name}
            getSubtitle={(item) => `Tahun masuk ${item.entryYear}`}
            onSelect={(id) => setBatchId(id)}
          />
          <HierarchyPanel
            title="Kelas"
            items={filteredClasses}
            activeId={activeClassId}
            getTitle={(item) => item.name}
            getSubtitle={(item) =>
              `Tingkat ${item.gradeLevel}${item.homeroomStaff?.fullName ? ` · ${item.homeroomStaff.fullName}` : ""}`
            }
            onSelect={(id) => setClassId(id)}
          />
        </div>

        <section className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              {selectedAcademicYear?.name ?? "Tahun ajaran"} / {selectedBatch?.name ?? "Angkatan"} /{" "}
              {selectedClass?.name ?? "Kelas"}
            </p>
            <h2 className="mt-1 text-2xl font-semibold">Siswa</h2>
          </div>

          <FilterBar
            search={search}
            onSearchChange={setSearch}
            trailing={
              <button
                type="button"
                onClick={openCreate}
                disabled={!activeBatchId || !activeClassId}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
              >
                <Plus className="size-4" />
                Tambah Siswa
              </button>
            }
          />

          {studentsQuery.isError || classesQuery.isError || batchesQuery.isError || academicYearsQuery.isError ? (
            <EmptyState
              title="Gagal memuat hierarki siswa"
              description="Periksa koneksi API dan role ADMIN_TU. Detail error tersedia di console browser/server."
            />
          ) : null}

          {!activeClassId ? (
            <EmptyState
              title="Pilih kelas terlebih dahulu"
              description="Tahun ajaran dan angkatan harus memiliki kelas aktif sebelum daftar siswa bisa dikelola."
            />
          ) : visibleStudents.length === 0 ? (
            <EmptyState
              title="Belum ada siswa di kelas ini"
              description="Tambahkan siswa baru atau kelola enrollment jika siswa sudah ada di master data."
              action={
                <button
                  type="button"
                  onClick={openCreate}
                  className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white"
                >
                  Tambah Siswa
                </button>
              }
            />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleStudents.map((student) => {
                const enrollment = getActiveEnrollmentForClass(student, activeClassId);

                return (
                  <button
                    key={student.id}
                    type="button"
                    onClick={() => openEdit(student)}
                    className="rounded-lg border border-line bg-surface p-4 text-left transition hover:border-[var(--color-accent)]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{student.fullName}</p>
                        <p className="mt-1 text-sm text-slate-500">NIS {student.nis}</p>
                      </div>
                      <UserRoundPen className="size-4 shrink-0 text-slate-400" />
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-500">
                      <span>{student.gender === "L" ? "Laki-laki" : student.gender === "P" ? "Perempuan" : "Gender -"}</span>
                      <span className="text-right">{student.isActive ? "Aktif" : "Nonaktif"}</span>
                      <span className="col-span-2">
                        Masuk kelas: {enrollment?.startDate ? formatDisplayDate(enrollment.startDate) : "-"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </section>

      {showForm ? (
        <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-950/35 px-4 py-8">
          <div className="mx-auto max-w-2xl rounded-lg bg-surface p-6 shadow-panel md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">
                  {editingStudent ? "Edit" : "Tambah"}
                </p>
                <h3 className="mt-2 text-2xl font-semibold">Siswa</h3>
                <p className="mt-1 text-sm text-slate-500">
                  {selectedClass?.name ?? "Kelas belum dipilih"}
                </p>
              </div>
              <button type="button" onClick={() => setShowForm(false)} className="text-sm text-slate-500">
                Tutup
              </button>
            </div>

            <form
              onSubmit={form.handleSubmit((values) => saveStudentMutation.mutate(values))}
              className="mt-6 grid gap-4 md:grid-cols-2"
            >
              <input type="hidden" {...form.register("batchId")} />
              {studentFields.map((field) => (
                <div key={field.name} className={field.type === "textarea" ? "md:col-span-2" : ""}>
                  <FormField field={field} control={form.control} options={field.options ?? []} />
                </div>
              ))}

              <div className="md:col-span-2 flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-full border border-line px-5 py-3 text-sm font-medium"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saveStudentMutation.isPending}
                  className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saveStudentMutation.isPending ? "Menyimpan..." : "Simpan"}
                </button>
              </div>
              {saveStudentMutation.isError ? (
                <p className="md:col-span-2 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  Gagal menyimpan siswa. Detail: {saveStudentMutation.error.message}
                </p>
              ) : null}
            </form>
          </div>
        </div>
      ) : null}
    </PageMotion>
  );
}
