"use client";

import { PageHeader } from "./PageHeader";
import { exportResultsCSV } from "../lib/api";
import { getSession } from "../lib/auth";

export function ReportsPanel() {
  const token = getSession()?.access_token;

  async function exportReport() {
    if (!token) return;
    const blob = await exportResultsCSV(token);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "assessment-report.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <PageHeader title="Reports" note="Generate CSV exports" actionLabel="Generate report" onAction={exportReport} />
      <section className="panel">
        <h2>Available reports</h2>
        <p className="emptyState">Assessment results export (CSV) includes student scores, percentages and ranks.</p>
        <button className="primary" type="button" onClick={exportReport}>
          Download results CSV
        </button>
      </section>
    </>
  );
}
