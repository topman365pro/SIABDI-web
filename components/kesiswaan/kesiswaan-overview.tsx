"use client";

import { useQuery } from "@tanstack/react-query";
import { kesiswaanApi } from "@/lib/api/domain";
import { MetricStrip } from "@/components/shared/metric-strip";
import { PageMotion } from "@/components/shared/page-motion";
import { EmptyState } from "@/components/shared/empty-state";

export function KesiswaanOverview() {
  const overviewQuery = useQuery({
    queryKey: ["kesiswaan-overview"],
    queryFn: () => kesiswaanApi.overview()
  });

  return (
    <PageMotion>
      <section className="space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--color-accent)]">Kesiswaan</p>
          <h1 className="text-3xl font-semibold">Monitor dispensasi</h1>
        </header>
        <MetricStrip
          items={[
            { label: "Draft", value: overviewQuery.data?.counters.draftDispensations ?? "-" },
            { label: "Published Hari Ini", value: overviewQuery.data?.counters.publishedToday ?? "-" },
            { label: "Cancelled Hari Ini", value: overviewQuery.data?.counters.cancelledToday ?? "-" },
            { label: "Peserta Aktif", value: overviewQuery.data?.counters.participatingStudents ?? "-" }
          ]}
        />
        {overviewQuery.isError ? (
          <EmptyState
            title="Gagal memuat overview Kesiswaan"
            description={`Periksa koneksi API dan role akun. Detail: ${overviewQuery.error.message}`}
          />
        ) : null}
      </section>
    </PageMotion>
  );
}
