import { describe, expect, it } from "vitest";
import {
  filterBatchesForAcademicYear,
  filterClassesForHierarchy,
  filterStudentsForBatch,
  filterStudentsForClass,
  selectDefaultAcademicYearId,
  selectDefaultBatchId,
  selectDefaultClassId
} from "@/lib/utils/hierarchy";

const years = [
  { id: "year-2023", name: "2023/2024", isActive: false },
  { id: "year-2024", name: "2024/2025", isActive: true }
];

const batches = [
  { id: "batch-2023", name: "Angkatan 2023", entryYear: 2023 },
  { id: "batch-2024", name: "Angkatan 2024", entryYear: 2024 }
];

const classes = [
  { id: "class-a", name: "11 IPA 1", academicYearId: "year-2024", batchId: "batch-2024" },
  { id: "class-b", name: "10 IPA 1", academicYearId: "year-2023", batchId: "batch-2023" }
];

const students = [
  {
    id: "student-1",
    batchId: "batch-2024",
    fullName: "Ari",
    enrollments: [{ classId: "class-a", isActive: true }]
  },
  {
    id: "student-2",
    batchId: "batch-2024",
    fullName: "Bima",
    enrollments: [{ classId: "class-b", isActive: false }]
  },
  {
    id: "student-3",
    batchId: "batch-2023",
    fullName: "Citra",
    enrollments: [{ classId: "class-b", isActive: true }]
  }
];

describe("academic hierarchy helpers", () => {
  it("selects the active academic year by default", () => {
    expect(selectDefaultAcademicYearId(years)).toBe("year-2024");
    expect(selectDefaultAcademicYearId(years, "year-2023")).toBe("year-2023");
  });

  it("filters batches by classes in the selected year", () => {
    expect(filterBatchesForAcademicYear(batches, classes, "year-2024")).toEqual([batches[1]]);
  });

  it("filters classes by academic year and batch", () => {
    expect(filterClassesForHierarchy(classes, "year-2024", "batch-2024")).toEqual([
      classes[0]
    ]);
  });

  it("falls back to the first valid batch and class", () => {
    expect(selectDefaultBatchId([batches[1]], "missing")).toBe("batch-2024");
    expect(selectDefaultClassId([classes[0]], "missing")).toBe("class-a");
  });

  it("filters students by active class enrollment and batch", () => {
    expect(filterStudentsForClass(students, "class-a").map((student) => student.id)).toEqual([
      "student-1"
    ]);
    expect(filterStudentsForBatch(students, "batch-2024").map((student) => student.id)).toEqual([
      "student-1",
      "student-2"
    ]);
  });
});
