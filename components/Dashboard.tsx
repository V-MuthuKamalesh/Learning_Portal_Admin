"use client";

import { FormEvent, useEffect, useState } from "react";
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
        note="Connected admin workspace"
        actionLabel="Add student"
        onAction={() => setModalOpen(true)}
      />

      <section className="metrics">
        <Metric label="Students" value={loading ? "…" : String(stats.students)} />
        <Metric label="Assessments" value={loading ? "…" : String(stats.assessments)} />
        <Metric label="Groups" value={loading ? "…" : String(stats.groups)} />
        <Metric label="Questions" value={loading ? "…" : String(stats.questions)} />
      </section>

      <section className="gridTwo">
        <div className="panel">
          <h2>Live data</h2>
          <p className="activity">Student, group, assessment and question counts are loaded from the API.</p>
          <p className="activity">Use Students, Groups, Questions and Assessments pages to manage records.</p>
        </div>
        <div className="panel">
          <h2>Getting started</h2>
          <p className="activity">Demo student login: college code SMV2026, register CSE22001, email student@demo.edu, password CSE22001</p>
          <p className="activity">Admin login: superadmin@smv.edu / Admin@123</p>
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
