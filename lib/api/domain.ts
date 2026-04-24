import { apiRequest } from "@/lib/api/client";
import type {
  AttendanceStatus,
  AuthSession,
  BkPermissionFormInput,
  ClassPeriodRosterItem,
  DispensationFormInput,
  ParentStudentSummary,
  StudentHistoryEntry,
  TeacherObservation,
  TeacherScheduleItem
} from "@/lib/types";

export type OverviewCounters = Record<string, number>;

export interface AdminOverviewResponse {
  counters: OverviewCounters;
  attendanceSummary: Record<AttendanceStatus, number>;
}

export interface TeacherClassPeriodResponse {
  schedule: TeacherScheduleItem;
  roster: ClassPeriodRosterItem[];
}

export interface VerifyTeacherPeriodInput {
  classId: string;
  periodNo: number;
  attendanceDate: string;
  scheduleId: string;
  records: Array<{
    studentId: string;
    status?: "HADIR" | "ALFA";
    teacherObservation?: TeacherObservation;
    note?: string;
  }>;
}

export interface BkOverviewResponse {
  counters: OverviewCounters;
  latestPermissions: Array<Record<string, any>>;
}

export interface KesiswaanOverviewResponse {
  counters: OverviewCounters;
  latestDispensations: Array<Record<string, any>>;
}

export function login(username: string, password: string) {
  return apiRequest<AuthSession>("/auth/login", {
    method: "POST",
    auth: false,
    body: JSON.stringify({ username, password })
  });
}

export const adminApi = {
  overview: () => apiRequest<AdminOverviewResponse>("/admin/overview"),
  list: <T = Record<string, any>>(endpoint: string) => apiRequest<T[]>(endpoint),
  create: <T = Record<string, any>>(endpoint: string, payload: Record<string, unknown>) =>
    apiRequest<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  update: <T = Record<string, any>>(
    endpoint: string,
    id: string | number,
    payload: Record<string, unknown>
  ) =>
    apiRequest<T>(`${endpoint}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(payload)
    }),
  remove: (endpoint: string, id: string | number) =>
    apiRequest(`${endpoint}/${id}`, {
      method: "DELETE"
    })
};

export const teacherApi = {
  schedules: (date: string) =>
    apiRequest<TeacherScheduleItem[]>(`/teacher/me/schedules?date=${encodeURIComponent(date)}`),
  classPeriod: (classId: string, periodNo: number, date: string) =>
    apiRequest<TeacherClassPeriodResponse>(
      `/teacher/me/classes/${classId}/periods/${periodNo}?date=${encodeURIComponent(date)}`
    ),
  verifyPeriod: async ({ classId, periodNo, ...payload }: VerifyTeacherPeriodInput) => {
    if (periodNo === 1) {
      return apiRequest("/attendance/base-check", {
        method: "POST",
        body: JSON.stringify({
          classId,
          scheduleId: payload.scheduleId,
          attendanceDate: payload.attendanceDate,
          lessonPeriodNo: 1,
          records: payload.records.map((record) => ({
            studentId: record.studentId,
            status: record.status ?? "ALFA",
            note: record.note
          }))
        })
      });
    }

    return Promise.all(
      payload.records.map((record) =>
        apiRequest("/attendance/cross-check", {
          method: "POST",
          body: JSON.stringify({
            studentId: record.studentId,
            classId,
            scheduleId: payload.scheduleId,
            attendanceDate: payload.attendanceDate,
            lessonPeriodNo: periodNo,
            teacherObservation: record.teacherObservation ?? "ABSENT",
            note: record.note
          })
        })
      )
    );
  }
};

export const bkApi = {
  overview: () => apiRequest<BkOverviewResponse>("/bk/overview"),
  permissions: () => apiRequest<Record<string, any>[]>("/bk-permissions"),
  createPermission: (payload: BkPermissionFormInput) =>
    apiRequest("/bk-dashboard/status-overrides", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  cancelPermission: (id: string) =>
    apiRequest(`/bk-dashboard/status-overrides/${id}/cancel`, {
      method: "PATCH"
    }),
  classRoster: (classId: string, date: string, periodNo: number) =>
    apiRequest<ClassPeriodRosterItem[]>(
      `/bk-dashboard/classes/${classId}/students?date=${encodeURIComponent(date)}&periodNo=${periodNo}`
    )
};

export const kesiswaanApi = {
  overview: () => apiRequest<KesiswaanOverviewResponse>("/kesiswaan/overview"),
  dispensations: () => apiRequest<Record<string, any>[]>("/dispensations"),
  dispensation: (id: string) => apiRequest<Record<string, any>>(`/dispensations/${id}`),
  createDispensation: (payload: DispensationFormInput) =>
    apiRequest("/dispensations", {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  addStudents: (id: string, payload: { classId: string; studentIds: string[] }) =>
    apiRequest(`/dispensations/${id}/students`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),
  publish: (id: string) =>
    apiRequest(`/dispensations/${id}/publish`, {
      method: "PATCH"
    }),
  cancel: (id: string) =>
    apiRequest(`/dispensations/${id}/cancel`, {
      method: "PATCH"
    })
};

export const parentApi = {
  children: () => apiRequest<ParentStudentSummary[]>("/parent/me/students"),
  today: (studentId: string, date: string) =>
    apiRequest<StudentHistoryEntry[]>(
      `/parent/me/students/${studentId}/today?date=${encodeURIComponent(date)}`
    ),
  history: (studentId: string, startDate: string, endDate: string) =>
    apiRequest<StudentHistoryEntry[]>(
      `/parent/me/students/${studentId}/history?startDate=${encodeURIComponent(
        startDate
      )}&endDate=${encodeURIComponent(endDate)}`
    )
};
