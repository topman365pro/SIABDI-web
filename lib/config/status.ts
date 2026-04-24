import type { AttendanceSource, AttendanceStatus, AttendanceStatusViewModel } from "@/lib/types";

export const ATTENDANCE_PRIORITY: AttendanceStatus[] = [
  "DISPENSASI",
  "SAKIT",
  "IZIN",
  "BOLOS",
  "HADIR",
  "ALFA"
];

export const ATTENDANCE_STATUS_MAP: Record<AttendanceStatus, AttendanceStatusViewModel> = {
  HADIR: {
    value: "HADIR",
    label: "Masuk",
    tone: "success"
  },
  ALFA: {
    value: "ALFA",
    label: "Alfa",
    tone: "neutral"
  },
  IZIN: {
    value: "IZIN",
    label: "Izin",
    tone: "info"
  },
  SAKIT: {
    value: "SAKIT",
    label: "Sakit",
    tone: "warning"
  },
  DISPENSASI: {
    value: "DISPENSASI",
    label: "Dispensasi",
    tone: "accent"
  },
  BOLOS: {
    value: "BOLOS",
    label: "Bolos",
    tone: "danger"
  }
};

export const ATTENDANCE_SOURCE_LABELS: Record<AttendanceSource, string> = {
  BASE_CHECK: "Base check jam pertama",
  CROSS_CHECK: "Cross-check guru",
  BK_PERMISSION: "Status resmi BK",
  DISPENSATION: "Dispensasi Kesiswaan",
  SYSTEM_DERIVED: "Turunan sistem",
  TAP_IN: "Tap masuk",
  TAP_OUT: "Tap keluar",
  MANUAL_ADMIN: "Koreksi admin"
};

export function getAttendanceStatusLabel(status: AttendanceStatus) {
  return ATTENDANCE_STATUS_MAP[status].label;
}

export function getAttendanceSourceLabel(source?: AttendanceSource | null) {
  return source ? ATTENDANCE_SOURCE_LABELS[source] ?? source : "Belum diverifikasi";
}
