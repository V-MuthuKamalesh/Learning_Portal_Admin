"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "./PageHeader";
import { exportResultsCSV, listResults, ResultRow } from "../lib/api";
import { getSession } from "../lib/auth";

export function ResultsPanel() {
  const token = getSession()?.access_token;
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setRows(await listResults(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load results");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleExport() {
    if (!token) return;
    try {
      const blob = await exportResultsCSV(token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "results.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    }
  }

  return (
    <>
      <PageHeader title="Results" note="View and export assessment outcomes" actionLabel="Export CSV" onAction={handleExport} />
      {error && <p className="error">{error}</p>}
      <section className="panel tablePanel">
        <h2>Results ({rows.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Score</th>
              <th>Percentage</th>
              <th>Rank</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>{row.student?.name || "Student"}</td>
                <td>
                  {row.marks_scored}/{row.total_marks}
                </td>
                <td>{Math.round(row.percentage)}%</td>
                <td>#{row.rank || "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
