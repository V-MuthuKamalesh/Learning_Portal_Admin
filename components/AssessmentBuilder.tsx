"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { PageHeader } from "./PageHeader";
import { Modal } from "./Modal";
import {
  Assessment,
  assignAssessment,
  attachAssessmentQuestions,
  createAssessment,
  listAssessments,
  listQuestions,
  publishAssessment
} from "../lib/api";
import { getSession } from "../lib/auth";

export function AssessmentBuilder() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const token = getSession()?.access_token;

  const loadAssessments = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setAssessments(await listAssessments(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load assessments");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadAssessments();
  }, [loadAssessments]);

  async function handlePublish(id: string) {
    if (!token) return;
    setError("");
    try {
      const questions = await listQuestions(token);
      if (questions.length) {
        await attachAssessmentQuestions(token, id, questions.map((q) => q.id));
      }
      await assignAssessment(token, id, "college");
      const published = await publishAssessment(token, id);
      setAssessments((current) => current.map((a) => (a.id === id ? published : a)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    }
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const created = await createAssessment(token, {
        title: String(data.get("title")),
        description: String(data.get("description") || ""),
        type: String(data.get("type")),
        duration_minutes: Number(data.get("duration_minutes") || 60),
        total_marks: Number(data.get("total_marks") || 100)
      });
      setAssessments((current) => [created, ...current]);
      event.currentTarget.reset();
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create assessment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Assessments"
        note="Build, assign, schedule and publish tests"
        actionLabel="New assessment"
        onAction={() => setModalOpen(true)}
      />
      {error && <p className="error">{error}</p>}

      <section className="panel tablePanel">
        <h2>Assessments {loading ? "(loading…)" : `(${assessments.length})`}</h2>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Type</th>
              <th>Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((assessment) => (
              <tr key={assessment.id}>
                <td>
                  <strong>{assessment.title}</strong>
                </td>
                <td>{assessment.type}</td>
                <td>{assessment.duration_minutes ?? 60} min</td>
                <td>
                  <span className="statusBadge">{assessment.status}</span>
                  {assessment.status === "draft" && (
                    <button className="secondary compact" type="button" onClick={() => handlePublish(assessment.id)}>
                      Publish
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && assessments.length === 0 && (
              <tr>
                <td colSpan={4} className="emptyState">
                  No assessments yet. Click &quot;New assessment&quot; to create a draft.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <section className="panel builder">
        <div className="steps">
          <span>Details</span>
          <span>Questions</span>
          <span>Assign</span>
          <span>Schedule</span>
          <span>Publish</span>
        </div>
        <p className="emptyState">Create a draft assessment above, then configure questions, assignment and scheduling in upcoming releases.</p>
      </section>

      <Modal open={modalOpen} title="New assessment" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate}>
          <input name="title" placeholder="Assessment title" required />
          <textarea name="description" placeholder="Description" />
          <select name="type" defaultValue="mixed">
            <option value="mcq">MCQ</option>
            <option value="programming">Programming</option>
            <option value="mixed">Mixed</option>
          </select>
          <div className="inline">
            <input name="duration_minutes" type="number" min={1} defaultValue={60} placeholder="Duration (minutes)" />
            <input name="total_marks" type="number" min={1} defaultValue={100} placeholder="Total marks" />
          </div>
          <div className="modalActions">
            <button className="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Create draft"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
