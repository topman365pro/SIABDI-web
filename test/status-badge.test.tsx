import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StatusBadge } from "@/components/shared/status-badge";

describe("StatusBadge", () => {
  it("renders Masuk for HADIR", () => {
    expect(renderToStaticMarkup(<StatusBadge status="HADIR" />)).toContain("Masuk");
  });

  it("renders every supported attendance label", () => {
    expect(renderToStaticMarkup(<StatusBadge status="ALFA" />)).toContain("Alfa");
    expect(renderToStaticMarkup(<StatusBadge status="IZIN" />)).toContain("Izin");
    expect(renderToStaticMarkup(<StatusBadge status="SAKIT" />)).toContain("Sakit");
    expect(renderToStaticMarkup(<StatusBadge status="DISPENSASI" />)).toContain("Dispensasi");
    expect(renderToStaticMarkup(<StatusBadge status="BOLOS" />)).toContain("Bolos");
  });
});
