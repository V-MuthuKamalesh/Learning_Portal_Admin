"use client";

import { FormEvent, useEffect, useState } from "react";
import { Users, ClipboardList, Layers, HelpCircle, Key, UserPlus } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { Modal } from "./Modal";
import { Metric } from "./Metric";
import { getDashboardStats } from "../lib/api";
import { getSession } from "../lib/auth";

export function Dashboard() {
  const [stats, setStats] = useState({ students: 0, groups: 0, assessments: 0, questions: 0 });
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const token = getSession()?.access_token;

  useEffect(() => {
    if (!token) return;
    getDashboardStats(token)
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [token]);

  function handleQuickAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setModalOpen(false);
    window.location.href = "/students";
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        actionLabel="Add student"
        onAction={() => setModalOpen(true)}
      />

      <section className="metrics">
        <Metric label="Students" value={loading ? "…" : String(stats.students)} icon={Users} color="#3b82f6" />
        <Metric label="Assessments" value={loading ? "…" : String(stats.assessments)} icon={ClipboardList} color="#8b5cf6" />
        <Metric label="Groups" value={loading ? "…" : String(stats.groups)} icon={Layers} color="#f59e0b" />
        <Metric label="Questions" value={loading ? "…" : String(stats.questions)} icon={HelpCircle} color="#10b981" />
      </section>

      <section className="gridTwo">
        <div className="panel">
          <h2>Quick actions</h2>
          <p className="activity" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <UserPlus size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
            Go to <strong>Students</strong> to enroll new students and manage existing accounts.
          </p>
          <p className="activity" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <ClipboardList size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
            Go to <strong>Assessments</strong> to create and publish tests for student groups.
          </p>
          <p className="activity" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <HelpCircle size={15} style={{ color: "var(--accent)", flexShrink: 0 }} />
            Go to <strong>Questions</strong> to build your question bank (MCQ &amp; coding).
          </p>
        </div>
        <div className="panel">
          <h2>Demo credentials</h2>
          <p className="activity" style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Key size={15} style={{ color: "var(--muted)", flexShrink: 0, marginTop: 3 }} />
            <span>
              <strong>Student</strong> — College: SMV2026 · Reg: CSE22001<br />
              <span style={{ color: "var(--muted)", fontSize: 12.5 }}>student@demo.edu / CSE22001</span>
            </span>
          </p>
          <p className="activity" style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <Key size={15} style={{ color: "var(--muted)", flexShrink: 0, marginTop: 3 }} />
            <span>
              <strong>Admin</strong> — superadmin@smv.edu<br />
              <span style={{ color: "var(--muted)", fontSize: 12.5 }}>Admin@123</span>
            </span>
          </p>
        </div>
      </section>

      <Modal open={modalOpen} title="Quick add student" onClose={() => setModalOpen(false)}>
        <p className="emptyState">You will be taken to the Students page to add a new student account.</p>
        <form onSubmit={handleQuickAdd}>
          <div className="modalActions">
            <button className="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="primary" type="submit">
              Go to Students
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
