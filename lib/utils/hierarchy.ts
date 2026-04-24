export interface AcademicYearNode extends Record<string, any> {
  id?: string;
  name?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

export interface BatchNode extends Record<string, any> {
  id?: string;
  name?: string;
  entryYear?: number;
}

export interface ClassNode extends Record<string, any> {
  id?: string;
  batchId?: string;
  academicYearId?: string;
  name?: string;
  gradeLevel?: number;
  homeroomStaff?: {
    fullName?: string | null;
  } | null;
}

export interface EnrollmentNode {
  id?: string;
  classId?: string;
  startDate?: string;
  endDate?: string | null;
  isActive?: boolean;
  class?: ClassNode | null;
}

export interface StudentNode {
  id?: string;
  batchId?: string;
  nis?: string;
  fullName?: string;
  enrollments?: EnrollmentNode[];
}

function idExists<T extends { id?: string }>(items: T[], id?: string) {
  return Boolean(id && items.some((item) => item.id === id));
}

export function selectDefaultAcademicYearId(
  academicYears: AcademicYearNode[],
  selectedId = ""
) {
  if (idExists(academicYears, selectedId)) {
    return selectedId;
  }

  return academicYears.find((item) => item.isActive)?.id ?? academicYears[0]?.id ?? "";
}

export function filterBatchesForAcademicYear(
  batches: BatchNode[],
  classes: ClassNode[],
  academicYearId: string
) {
  if (!academicYearId) {
    return [];
  }

  const batchIds = new Set(
    classes
      .filter((classItem) => classItem.academicYearId === academicYearId)
      .map((classItem) => classItem.batchId)
      .filter(Boolean)
  );

  return batches.filter((batch) => batchIds.has(batch.id));
}

export function selectDefaultBatchId(batches: BatchNode[], selectedId = "") {
  if (idExists(batches, selectedId)) {
    return selectedId;
  }

  return batches[0]?.id ?? "";
}

export function filterClassesForHierarchy(
  classes: ClassNode[],
  academicYearId: string,
  batchId: string
) {
  if (!academicYearId || !batchId) {
    return [];
  }

  return classes.filter(
    (classItem) =>
      classItem.academicYearId === academicYearId && classItem.batchId === batchId
  );
}

export function selectDefaultClassId(classes: ClassNode[], selectedId = "") {
  if (idExists(classes, selectedId)) {
    return selectedId;
  }

  return classes[0]?.id ?? "";
}

export function getActiveEnrollmentForClass(student: StudentNode, classId?: string) {
  const enrollments = student.enrollments ?? [];

  if (!classId) {
    return enrollments.find((enrollment) => enrollment.isActive !== false) ?? enrollments[0];
  }

  return (
    enrollments.find(
      (enrollment) => enrollment.classId === classId && enrollment.isActive !== false
    ) ?? enrollments.find((enrollment) => enrollment.classId === classId)
  );
}

export function filterStudentsForClass(students: StudentNode[], classId: string) {
  if (!classId) {
    return [];
  }

  return students.filter((student) => Boolean(getActiveEnrollmentForClass(student, classId)));
}

export function filterStudentsForBatch(students: StudentNode[], batchId: string) {
  if (!batchId) {
    return [];
  }

  return students.filter((student) => student.batchId === batchId);
}
