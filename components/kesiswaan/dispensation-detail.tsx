"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { adminApi, kesiswaanApi } from "@/lib/api/domain";
import { AcademicClassHierarchy } from "@/components/shared/academic-class-hierarchy";
import { EmptyState } from "@/components/shared/empty-state";
import { PageMotion } from "@/components/shared/page-motion";
import {
  filterBatchesForAcademicYear,
  filterClassesForHierarchy,
  filterStudentsForClass,
  selectDefaultAcademicYearId,
  selectDefaultBatchId,
  selectDefaultClassId
} from "@/lib/utils/hierarchy";

export function DispensationDetail({ dispensationId }: { dispensationId: string }) {
  const queryClient = useQueryClient();
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [academicYearId, setAcademicYearId] = useState("");
  const [batchId, setBatchId] = useState("");
  const [classId, setClassId] = useState("");
  const detailQuery = useQuery({
    queryKey: ["dispensation-detail", dispensationId],
    queryFn: () => kesiswaanApi.dispensation(dispensationId)
  });
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
  const currentClassId = selectDefaultClassId(filteredClasses, classId);
  const visibleStudents = useMemo(
    () => filterStudentsForClass(studentsQuery.data ?? [], currentClassId),
    [currentClassId, studentsQuery.data]
  );
  const existingStudentKeys = useMemo(
    () =>
      new Set(
        (detailQuery.data?.students ?? []).map(
          (item: any) => `${item.classId}:${item.studentId}`
        )
      ),
    [detailQuery.data]
  );
  const availableStudents = useMemo(
    () =>
      visibleStudents.filter(
        (student) => student.id && !existingStudentKeys.has(`${currentClassId}:${student.id}`)
      ),
    [currentClassId, existingStudentKeys, visibleStudents]
  );
  const studentById = useMemo(
    () => new Map((studentsQuery.data ?? []).map((student) => [student.id, student])),
    [studentsQuery.data]
  );
  const classById = useMemo(
    () => new Map((classesQuery.data ?? []).map((classItem) => [classItem.id, classItem])),
    [classesQuery.data]
  );

  useEffect(() => {
    setSelectedStudentIds([]);
  }, [currentClassId]);

  const addStudentsMutation = useMutation({
    mutationFn: async () =>
      kesiswaanApi.addStudents(dispensationId, {
          classId: currentClassId,
          studentIds: selectedStudentIds
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dispensation-detail", dispensationId] });
      await queryClient.invalidateQueries({ queryKey: ["dispensations"] });
      setSelectedStudentIds([]);
    }
  });

  const publishMutation = useMutation({
    mutationFn: async () => kesiswaanApi.publish(dispensationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dispensation-detail", dispensationId] });
      await queryClient.invalidateQueries({ queryKey: ["dispensations"] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async () => kesiswaanApi.cancel(dispensationId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dispensation-detail", dispensationId] });
      await queryClient.invalidateQueries({ queryKey: ["dispensations"] });
    }
  });

  return (
    <PageMotion>
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">Kesiswaan</p>
          <h1 className="text-3xl font-semibold">{detailQuery.data?.title ?? "Memuat dispensasi..."}</h1>
          <p className="text-sm text-slate-600">{detailQuery.data?.description ?? "Detail kegiatan dispensasi."}</p>
        </header>

        <div className="rounded-lg border border-line bg-surface/85 p-6 shadow-panel">
          <p className="text-sm text-slate-600">
            Status: <span className="font-semibold">{detailQuery.data?.status ?? "-"}</span>
          </p>
          <p className="mt-2 text-sm text-slate-600">
            Periode: Jam {detailQuery.data?.startPeriodNo ?? "-"} - {detailQuery.data?.endPeriodNo ?? "-"}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => publishMutation.mutate()}
              disabled={detailQuery.data?.status !== "DRAFT" || publishMutation.isPending}
              className="rounded-full bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-white"
            >
              {publishMutation.isPending ? "Menerbitkan..." : "Publish"}
            </button>
            <button
              type="button"
              onClick={() => cancelMutation.mutate()}
              disabled={detailQuery.data?.status === "CANCELLED" || cancelMutation.isPending}
              className="rounded-full border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-700"
            >
              {cancelMutation.isPending ? "Membatalkan..." : "Cancel"}
            </button>
          </div>
          {publishMutation.isError || cancelMutation.isError ? (
            <p className="mt-4 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
              Gagal memproses dispensasi. Detail:{" "}
              {publishMutation.error?.message ?? cancelMutation.error?.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-lg border border-line bg-surface/85 p-6 shadow-panel">
            <h2 className="text-xl font-semibold">Tambahkan siswa</h2>
            <div className="mt-4 rounded-lg border border-line bg-canvas/70 p-3">
              <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Kelas
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
            <div className="mt-4 grid gap-2">
              {availableStudents.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line px-4 py-6 text-sm text-slate-500">
                  Belum ada siswa yang bisa ditambahkan dari kelas ini.
                </p>
              ) : null}
              {availableStudents.map((student) => {
                const studentId = String(student.id);
                const checked = selectedStudentIds.includes(studentId);

                return (
                  <label
                    key={studentId}
                    className="flex items-center gap-3 rounded-lg border border-line bg-canvas px-4 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setSelectedStudentIds((current) =>
                          checked ? current.filter((id) => id !== studentId) : [...current, studentId]
                        )
                      }
                    />
                    <span>
                      {student.fullName}{" "}
                      {student.nis ? <span className="text-slate-500">· {student.nis}</span> : null}
                    </span>
                  </label>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => addStudentsMutation.mutate()}
              disabled={selectedStudentIds.length === 0 || !currentClassId || addStudentsMutation.isPending}
              className="mt-4 w-full rounded-full border border-line bg-canvas px-5 py-3 text-sm font-semibold disabled:opacity-60"
            >
              {addStudentsMutation.isPending ? "Menambahkan..." : "Tambahkan ke dispensasi"}
            </button>
            {addStudentsMutation.isError ? (
              <p className="mt-3 rounded-lg bg-rose-50 px-4 py-3 text-sm text-rose-700">
                Gagal menambahkan siswa. Detail: {addStudentsMutation.error.message}
              </p>
            ) : null}
          </section>

          <section className="rounded-lg border border-line bg-surface/85 p-6 shadow-panel">
            <h2 className="text-xl font-semibold">Siswa terpilih</h2>
            {detailQuery.isError ? (
              <EmptyState
                title="Gagal memuat detail"
                description={`Periksa koneksi API dan id dispensasi. Detail: ${detailQuery.error.message}`}
              />
            ) : null}
            <div className="mt-4 grid gap-3">
              {(detailQuery.data?.students ?? []).map((item: any) => {
                const student = studentById.get(item.studentId);
                const classItem = classById.get(item.classId);

                return (
                  <div key={item.studentId} className="rounded-lg border border-line bg-canvas px-4 py-3">
                    <p className="font-semibold">{student?.fullName ?? item.studentId}</p>
                    <p className="text-sm text-slate-500">{classItem?.name ?? item.classId}</p>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </PageMotion>
  );
}
