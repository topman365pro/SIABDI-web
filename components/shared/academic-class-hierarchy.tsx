"use client";

import { useEffect, useMemo } from "react";
import {
  filterBatchesForAcademicYear,
  filterClassesForHierarchy,
  selectDefaultAcademicYearId,
  selectDefaultBatchId,
  selectDefaultClassId,
  type AcademicYearNode,
  type BatchNode,
  type ClassNode
} from "@/lib/utils/hierarchy";
import { formatDisplayDate } from "@/lib/utils/format";
import { HierarchyPanel } from "./hierarchy-panel";

interface AcademicClassHierarchyProps {
  academicYears: AcademicYearNode[];
  batches: BatchNode[];
  classes: ClassNode[];
  academicYearId: string;
  batchId: string;
  classId: string;
  onAcademicYearChange: (id: string) => void;
  onBatchChange: (id: string) => void;
  onClassChange: (id: string) => void;
  columnsClassName?: string;
}

export function AcademicClassHierarchy({
  academicYears,
  batches,
  classes,
  academicYearId,
  batchId,
  classId,
  onAcademicYearChange,
  onBatchChange,
  onClassChange,
  columnsClassName = "grid gap-4 xl:grid-cols-3"
}: AcademicClassHierarchyProps) {
  const activeAcademicYearId = selectDefaultAcademicYearId(academicYears, academicYearId);
  const filteredBatches = useMemo(
    () => filterBatchesForAcademicYear(batches, classes, activeAcademicYearId),
    [activeAcademicYearId, batches, classes]
  );
  const activeBatchId = selectDefaultBatchId(filteredBatches, batchId);
  const filteredClasses = useMemo(
    () => filterClassesForHierarchy(classes, activeAcademicYearId, activeBatchId),
    [activeAcademicYearId, activeBatchId, classes]
  );
  const activeClassId = selectDefaultClassId(filteredClasses, classId);

  useEffect(() => {
    if (academicYearId !== activeAcademicYearId) {
      onAcademicYearChange(activeAcademicYearId);
    }
  }, [academicYearId, activeAcademicYearId, onAcademicYearChange]);

  useEffect(() => {
    if (batchId !== activeBatchId) {
      onBatchChange(activeBatchId);
    }
  }, [batchId, activeBatchId, onBatchChange]);

  useEffect(() => {
    if (classId !== activeClassId) {
      onClassChange(activeClassId);
    }
  }, [classId, activeClassId, onClassChange]);

  return (
    <div className={columnsClassName}>
      <HierarchyPanel
        title="Tahun Ajaran"
        items={academicYears}
        activeId={activeAcademicYearId}
        emptyMessage="Belum ada tahun ajaran."
        getTitle={(item) => item.name ?? "Tanpa nama"}
        getSubtitle={(item) =>
          `${item.startDate ? formatDisplayDate(item.startDate) : "-"} - ${
            item.endDate ? formatDisplayDate(item.endDate) : "-"
          }${item.isActive ? " · Aktif" : ""}`
        }
        onSelect={onAcademicYearChange}
      />
      <HierarchyPanel
        title="Angkatan"
        items={filteredBatches}
        activeId={activeBatchId}
        emptyMessage="Belum ada angkatan dengan kelas pada tahun ajaran ini."
        getTitle={(item) => item.name ?? "Tanpa nama"}
        getSubtitle={(item) => `Tahun masuk ${item.entryYear ?? "-"}`}
        onSelect={onBatchChange}
      />
      <HierarchyPanel
        title="Kelas"
        items={filteredClasses}
        activeId={activeClassId}
        emptyMessage="Belum ada kelas untuk angkatan ini."
        getTitle={(item) => item.name ?? "Tanpa nama"}
        getSubtitle={(item) =>
          `Tingkat ${item.gradeLevel ?? "-"}${
            item.homeroomStaff?.fullName ? ` · ${item.homeroomStaff.fullName}` : ""
          }`
        }
        onSelect={onClassChange}
      />
    </div>
  );
}
