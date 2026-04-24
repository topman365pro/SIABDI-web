import { describe, expect, it } from "vitest";
import { ATTENDANCE_PRIORITY, ATTENDANCE_STATUS_MAP, getAttendanceStatusLabel } from "@/lib/config/status";

describe("attendance status map", () => {
  it("normalizes HADIR to Masuk", () => {
    expect(ATTENDANCE_STATUS_MAP.HADIR.label).toBe("Masuk");
    expect(getAttendanceStatusLabel("HADIR")).toBe("Masuk");
  });

  it("marks BOLOS as danger tone", () => {
    expect(ATTENDANCE_STATUS_MAP.BOLOS.tone).toBe("danger");
  });

  it("keeps the flowchart priority order", () => {
    expect(ATTENDANCE_PRIORITY).toEqual([
      "DISPENSASI",
      "SAKIT",
      "IZIN",
      "BOLOS",
      "HADIR",
      "ALFA"
    ]);
  });
});
