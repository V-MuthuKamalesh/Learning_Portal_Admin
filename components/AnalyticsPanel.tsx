"use client";

import { useEffect, useState } from "react";
import { BarChart2, Users, ClipboardList, TrendingUp } from "lucide-react";
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
        <Metric label="Students" value={String(data.stats?.students ?? "—")} icon={Users} color="#3b82f6" />
        <Metric label="Assessments" value={String(data.stats?.assessments ?? "—")} icon={ClipboardList} color="#8b5cf6" />
        <Metric label="Average score" value={data.average_score != null ? `${Math.round(data.average_score)}%` : "—"} icon={TrendingUp} color="#10b981" />
        <Metric label="Graded attempts" value={String(data.results_count ?? "—")} icon={BarChart2} color="#f59e0b" />
      </section>
      <section className="panel">
        <h2>Performance insights</h2>
        <p className="activity">Live analytics are pulled from the API in real time. Average score reflects all graded assessment attempts.</p>
        <p className="activity">Navigate to <strong>Results</strong> to drill into individual student outcomes and export data.</p>
      </section>
    </>
  );
}
