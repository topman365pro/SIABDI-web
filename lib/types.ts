export type RoleCode = "ADMIN_TU" | "KESISWAAN" | "BK" | "GURU_MAPEL" | "ORANG_TUA";

export type AttendanceStatus =
  | "HADIR"
  | "ALFA"
  | "IZIN"
  | "SAKIT"
  | "DISPENSASI"
  | "BOLOS";

export type AttendanceSource =
  | "BASE_CHECK"
  | "CROSS_CHECK"
  | "BK_PERMISSION"
  | "DISPENSATION"
  | "SYSTEM_DERIVED"
  | "TAP_IN"
  | "TAP_OUT"
  | "MANUAL_ADMIN";

export type TeacherObservation = "PRESENT" | "ABSENT";

export interface CurrentUser {
  sub: string;
  username: string;
  fullName: string;
  roleCodes: RoleCode[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: CurrentUser;
}

export interface AttendanceStatusViewModel {
  value: AttendanceStatus;
  label: string;
  tone: "neutral" | "success" | "warning" | "danger" | "accent" | "info";
}

export interface TeacherScheduleItem {
  id: string;
  lessonPeriodNo: number;
  weekday: string;
  roomName?: string | null;
  class: {
    id: string;
    name: string;
  };
  subject: {
    id: string;
    name: string;
  };
  lessonPeriod: {
    periodNo: number;
    label: string;
    startTime: string;
    endTime: string;
  };
}

export interface ClassPeriodRosterItem {
  student: {
    id: string;
    nis: string;
    fullName: string;
  };
  status: {
    id: string;
    status: AttendanceStatus;
    note?: string | null;
    source: AttendanceSource;
    lessonPeriodNo?: number;
    bkPermissionId?: string | null;
    dispensationId?: string | null;
    verifiedAt?: string | null;
  } | null;
}

export interface ParentStudentSummary {
  id: string;
  nis: string;
  fullName: string;
  relationship: string;
  currentClass?: {
    id: string;
    name: string;
  } | null;
}

export interface StudentHistoryEntry {
  id: string;
  attendanceDate: string;
  lessonPeriodNo: number;
  status: AttendanceStatus;
  note?: string | null;
  source: AttendanceSource;
}

export interface BkPermissionFormInput {
  studentId: string;
  classId: string;
  attendanceDate: string;
  permissionKind: "IZIN" | "SAKIT";
  startPeriodNo: number;
  endPeriodNo: number;
  returnRequired: boolean;
  expectedReturnPeriodNo?: number;
  reason: string;
  letterNumber?: string;
}

export interface DispensationFormInput {
  title: string;
  description?: string;
  attendanceDate: string;
  startPeriodNo: number;
  endPeriodNo: number;
  returnRequired: boolean;
  expectedReturnPeriodNo?: number;
  letterNumber?: string;
}
