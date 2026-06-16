"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "./PageHeader";
import { getAnalytics } from "../lib/api";
import { getSession } from "../lib/auth";
import { Metric } from "./Metric";

export function AnalyticsPanel() {
  const token = getSession()?.access_token;
  const [data, setData] = useState<{ stats?: { students: number; assessments: number; questions: number; groups: number }; average_score?: number; results_count?: number }>({});

  useEffect(() => {
    if (!token) return;
    getAnalytics(token).then(setData).catch(() => {});
  }, [token]);

  return (
    <>
      <PageHeader title="Analytics" note="Department and assessment performance insights" hideAction />
      <section className="metrics">
        <Metric label="Students" value={String(data.stats?.students ?? "—")} />
        <Metric label="Assessments" value={String(data.stats?.assessments ?? "—")} />
        <Metric label="Average score" value={data.average_score != null ? `${Math.round(data.average_score)}%` : "—"} />
        <Metric label="Graded attempts" value={String(data.results_count ?? "—")} />
      </section>
      <section className="panel">
        <h2>Insights</h2>
        <p className="activity">Live analytics are loaded from `/analytics/dashboard`.</p>
        <p className="activity">Use Results to drill into individual assessment outcomes.</p>
      </section>
    </>
  );
}
