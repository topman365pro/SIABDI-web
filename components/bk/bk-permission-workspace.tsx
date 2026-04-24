"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { adminApi, bkApi } from "@/lib/api/domain";
import { AcademicClassHierarchy } from "@/components/shared/academic-class-hierarchy";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { DataTable } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { PageMotion } from "@/components/shared/page-motion";
import { FormField } from "@/components/forms/form-field";
import type { BkPermissionFormInput } from "@/lib/types";
import {
  filterBatchesForAcademicYear,
  filterClassesForHierarchy,
  filterStudentsForClass,
  selectDefaultAcademicYearId,
  selectDefaultBatchId,
  selectDefaultClassId
} from "@/lib/utils/hierarchy";

const optionalNumber = z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  z.coerce.number().min(1).optional()
);

const schema = z.object({
  studentId: z.string().min(1, "Siswa wajib dipilih."),
  classId: z.string().min(1, "Kelas wajib dipilih."),
  attendanceDate: z.string().min(1, "Tanggal wajib diisi."),
  permissionKind: z.enum(["IZIN", "SAKIT"]),
  startPeriodNo: z.coerce.number().min(1),
  endPeriodNo: z.coerce.number().min(1),
  returnRequired: z.boolean(),
  expectedReturnPeriodNo: optionalNumber,
  reason: z.string().min(1),
  letterNumber: z.string().optional()
}).superRefine((values, context) => {
  if (values.endPeriodNo < values.startPeriodNo) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["endPeriodNo"],
      message: "Jam akhir tidak boleh lebih kecil dari jam mulai."
    });
  }

  if (values.returnRequired && !values.expectedReturnPeriodNo) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["expectedReturnPeriodNo"],
      message: "Jam kembali wajib diisi jika siswa wajib kembali."
    });
  }
});

export function BkPermissionWorkspace() {
  const queryClient = useQueryClient();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [academicYearId, setAcademicYearId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [classId, setClassId] = useState("");
  const academicYearsQuery = useQuery({
    queryKey: ["academic-years"],
    queryFn: () => adminApi.list("/academic-years")
  });
  const batchesQuery = useQuery({
    queryKey: ["batches"],
    queryFn: () => adminApi.list("/batches")
  });
  const studentsQuery = useQuery({
    queryKey: ["students"],
    queryFn: () => adminApi.list("/students")
  });
  const classesQuery = useQuery({
    queryKey: ["classes"],
    queryFn: () => adminApi.list("/classes")
  });
  const permissionsQuery = useQuery({
    queryKey: ["bk-permissions"],
    queryFn: () => bkApi.permissions()
  });
  const activeAcademicYearId = selectDefaultAcademicYearId(academicYearsQuery.data ?? [], academicYearId);
  const filteredBatches = useMemo(
    () => filterBatchesForAcademicYear(batchesQuery.data ?? [], classesQuery.data ?? [], activeAcademicYearId),
    [activeAcademicYearId, batchesQuery.data, classesQuery.data]
  );
  const activeBatchId = selectDefaultBatchId(filteredBatches, batchId);
  const filteredClasses = useMemo(
    () => filterClassesForHierarchy(classesQuery.data ?? [], activeAcademicYearId, activeBatchId),
    [activeAcademicYearId, activeBatchId, classesQuery.data]
  );
  const activeClassId = selectDefaultClassId(filteredClasses, classId);
  const visibleStudents = useMemo(
    () => filterStudentsForClass(studentsQuery.data ?? [], activeClassId),
    [activeClassId, studentsQuery.data]
  );
  const form = useForm<BkPermissionFormInput>({
    resolver: zodResolver(schema),
    defaultValues: {
      studentId: "",
      classId: "",
      attendanceDate: new Date().toISOString().slice(0, 10),
      permissionKind: "IZIN",
      startPeriodNo: 1,
      endPeriodNo: 1,
      returnRequired: false,
      reason: ""
    }
  });

  useEffect(() => {
    form.setValue("classId", activeClassId);
  }, [activeClassId, form]);

  useEffect(() => {
    const currentStudentId = form.getValues("studentId");
    const currentStillVisible = visibleStudents.some((student) => student.id === currentStudentId);

    if (!currentStillVisible) {
      form.setValue("studentId", visibleStudents[0]?.id ?? "");
    }
  }, [form, visibleStudents]);

  const createMutation = useMutation({
    mutationFn: async (values: BkPermissionFormInput) => bkApi.createPermission(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bk-permissions"] });
      await queryClient.invalidateQueries({ queryKey: ["bk-overview"] });
      form.reset({
        studentId: visibleStudents[0]?.id ?? "",
        classId: activeClassId,
        attendanceDate: form.getValues("attendanceDate") || new Date().toISOString().slice(0, 10),
        permissionKind: "IZIN",
        startPeriodNo: 1,
        endPeriodNo: 1,
        returnRequired: false,
        reason: ""
      });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async (id: string) => bkApi.cancelPermission(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["bk-permissions"] });
      setDeleteId(null);
    }
  });

  const dateField = { name: "attendanceDate", label: "Tanggal", type: "date" } as const;
  const studentField = {
    name: "studentId",
    label: "Siswa",
    type: "select",
    options: visibleStudents.filter((item) => item.id).map((item) => ({
      value: String(item.id),
      label: `${item.fullName ?? "Siswa"}${item.nis ? ` · ${item.nis}` : ""}`
    }))
  } as const;
  const fields = [
    {
      name: "permissionKind",
      label: "Jenis Status",
      type: "select",
      options: [
        { value: "IZIN", label: "Izin" },
        { value: "SAKIT", label: "Sakit" }
      ]
    },
    { name: "startPeriodNo", label: "Mulai Jam", type: "number" },
    { name: "endPeriodNo", label: "Sampai Jam", type: "number" },
    { name: "returnRequired", label: "Wajib Kembali", type: "checkbox" },
    { name: "expectedReturnPeriodNo", label: "Jam Kembali", type: "number" },
    { name: "reason", label: "Alasan", type: "textarea" },
    { name: "letterNumber", label: "Nomor Surat", type: "text" }
  ] as const;

  return (
    <PageMotion>
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-lg border border-line bg-surface/85 p-6 shadow-panel">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">BK</p>
            <h1 className="mt-2 text-3xl font-semibold">Kelola status izin dan sakit</h1>
          </div>
          <DataTable
            columns={[
              { key: "student", label: "Siswa", render: (row) => row.student?.fullName ?? row.studentId },
              { key: "class", label: "Kelas", render: (row) => row.class?.name ?? row.classId },
              { key: "kind", label: "Status", render: (row) => row.permissionKind },
              {
                key: "period",
                label: "Periode",
                render: (row) => `Jam ${row.startPeriodNo} - ${row.endPeriodNo}`
              },
              {
                key: "action",
                label: "Aksi",
                render: (row) => (
                  <button
                    type="button"
                    onClick={() => setDeleteId(row.id)}
                    className="rounded-full border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700"
                  >
                    Batalkan
                  </button>
                )
              }
            ]}
            rows={permissionsQuery.data ?? []}
            rowKey={(row) => String(row.id)}
          />
          {permissionsQuery.isError ? (
            <EmptyState
              title="Gagal memuat daftar izin/sakit"
              description={`Periksa koneksi API dan role BK. Detail: ${permissionsQuery.error.message}`}
            />
          ) : null}
        </div>

        <div className="rounded-lg border border-line bg-surface/85 p-6 shadow-panel">
          <h2 className="text-xl font-semibold">Buat override baru</h2>
          <form onSubmit={form.handleSubmit((values) => createMutation.mutate(values))} className="mt-4 space-y-4">
            <FormField field={dateField as any} control={form.control} />
            <div className="rounded-lg border border-line bg-canvas/70 p-3">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Pilih Kelas
              </p>
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
                columnsClassName="grid gap-3"
              />
            </div>
            <input type="hidden" {...form.register("classId")} />
            <FormField field={studentField as any} control={form.control} options={studentField.options} />
            {activeClassId && visibleStudents.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line px-4 py-3 text-sm text-slate-500">
                Belum ada siswa aktif pada kelas yang dipilih.
              </p>
            ) : null}
            {fields.map((field) => (
              <FormField
                key={field.name}
                field={field as any}
                control={form.control}
                options={"options" in field ? field.options : undefined}
              />
            ))}
            <button
              disabled={!activeClassId || visibleStudents.length === 0 || createMutation.isPending}
              className="w-full rounded-full bg-[var(--color-accent)] px-5 py-3 font-semibold text-white disabled:opacity-60"
            >
              {createMutation.isPending ? "Menyimpan..." : "Simpan Override"}
            </button>
            {createMutation.isError ? (
              <p className="rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Gagal menyimpan status BK. Detail: {createMutation.error.message}
              </p>
            ) : null}
          </form>
        </div>
      </section>

      <ConfirmDialog
        open={Boolean(deleteId)}
        title="Batalkan status override?"
        description="Sistem akan menghitung ulang status jam terkait setelah override dibatalkan."
        confirmLabel={cancelMutation.isPending ? "Membatalkan..." : "Batalkan Override"}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && cancelMutation.mutate(deleteId)}
      />
    </PageMotion>
  );
}
