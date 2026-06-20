"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { Calendar, ChevronRight, ClipboardList, Settings, Users } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { Modal } from "./Modal";
import {
  Assessment,
  assignAssessment,
  attachAssessmentQuestions,
  createAssessment,
  listAssessments,
  listQuestions,
  publishAssessment,
  Question,
} from "../lib/api";
import { getSession } from "../lib/auth";
import { apiFetch } from "../lib/api";

type Step = "questions" | "assign" | "schedule" | "publish";

const STEPS: { key: Step; label: string; icon: typeof Settings }[] = [
  { key: "questions", label: "Questions", icon: ClipboardList },
  { key: "assign", label: "Assign", icon: Users },
  { key: "schedule", label: "Schedule", icon: Calendar },
  { key: "publish", label: "Publish", icon: ChevronRight },
];

export function AssessmentBuilder() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selected, setSelected] = useState<Assessment | null>(null);
  const [step, setStep] = useState<Step>("questions");
  const [selectedQIDs, setSelectedQIDs] = useState<Set<string>>(new Set());
  const [stepBusy, setStepBusy] = useState(false);
  const [stepMsg, setStepMsg] = useState("");
  const token = getSession()?.access_token;

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const [aList, qList] = await Promise.all([listAssessments(token), listQuestions(token)]);
      setAssessments(aList);
      setQuestions(qList);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load data");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  function openBuilder(a: Assessment) {
    setSelected(a);
    setStep("questions");
    setSelectedQIDs(new Set());
    setStepMsg("");
    setError("");
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
        total_marks: Number(data.get("total_marks") || 100),
        passing_marks: Number(data.get("passing_marks") || 40),
        negative_marking: data.get("negative_marking") === "on",
        negative_marks: Number(data.get("negative_marks") || 0.25),
        shuffle_questions: data.get("shuffle_questions") === "on",
        coding_scoring_mode: String(data.get("coding_scoring_mode") || "weighted"),
      });
      setAssessments((prev) => [created, ...prev]);
      event.currentTarget.reset();
      setModalOpen(false);
      openBuilder(created);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create assessment");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAttachQuestions() {
    if (!token || !selected) return;
    if (selectedQIDs.size === 0) { setStepMsg("Select at least one question."); return; }
    setStepBusy(true);
    setStepMsg("");
    try {
      await attachAssessmentQuestions(token, selected.id, [...selectedQIDs]);
      setStepMsg(`${selectedQIDs.size} question(s) attached.`);
      setStep("assign");
    } catch (err) {
      setStepMsg(err instanceof Error ? err.message : "Failed to attach questions");
    } finally {
      setStepBusy(false);
    }
  }

  async function handleAssign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selected) return;
    setStepBusy(true);
    setStepMsg("");
    const data = new FormData(event.currentTarget);
    const targetType = String(data.get("target_type"));
    const targetId = String(data.get("target_id") || "");
    try {
      await assignAssessment(token, selected.id, targetType, targetId || undefined);
      setStepMsg("Assignment saved.");
      setStep("schedule");
    } catch (err) {
      setStepMsg(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setStepBusy(false);
    }
  }

  async function handleSchedule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || !selected) return;
    setStepBusy(true);
    setStepMsg("");
    const data = new FormData(event.currentTarget);
    try {
      await apiFetch<Assessment>(`/assessments/${selected.id}`, token, {
        method: "PUT",
        body: JSON.stringify({
          start_time: data.get("start_time") ? new Date(String(data.get("start_time"))).toISOString() : undefined,
          end_time: data.get("end_time") ? new Date(String(data.get("end_time"))).toISOString() : undefined,
        }),
      });
      setStepMsg("Schedule saved.");
      setStep("publish");
    } catch (err) {
      setStepMsg(err instanceof Error ? err.message : "Schedule failed");
    } finally {
      setStepBusy(false);
    }
  }

  async function handlePublish() {
    if (!token || !selected) return;
    setStepBusy(true);
    setStepMsg("");
    try {
      const published = await publishAssessment(token, selected.id);
      setAssessments((prev) => prev.map((a) => (a.id === selected.id ? published : a)));
      setSelected(published);
      setStepMsg("Assessment published successfully!");
    } catch (err) {
      setStepMsg(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setStepBusy(false);
    }
  }

  function toggleQ(id: string) {
    setSelectedQIDs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
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
              <th>Marks</th>
              <th>Scoring</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {assessments.map((a) => (
              <tr key={a.id} className={selected?.id === a.id ? "rowSelected" : ""}>
                <td><strong>{a.title}</strong></td>
                <td><span className="statusBadge">{a.type}</span></td>
                <td>{a.duration_minutes ?? 60} min</td>
                <td>{a.total_marks ?? "—"}</td>
                <td>
                  <span className={`statusBadge ${a.coding_scoring_mode === "attempt_penalty" ? "badgeAmber" : ""}`}>
                    {a.coding_scoring_mode === "attempt_penalty" ? "Attempt penalty" : "Weighted"}
                  </span>
                </td>
                <td><span className="statusBadge">{a.status}</span></td>
                <td>
                  {a.status === "draft" && (
                    <button className="secondary compact" type="button" onClick={() => openBuilder(a)}>
                      Configure
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {!loading && assessments.length === 0 && (
              <tr>
                <td colSpan={7} className="emptyState">
                  No assessments yet. Click &quot;New assessment&quot; to create a draft.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {selected && selected.status === "draft" && (
        <section className="panel builder">
          <div className="builderHeader">
            <h2>{selected.title}</h2>
            <div className="stepNav">
              {STEPS.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  className={`stepBtn${step === s.key ? " stepActive" : ""}${i < STEPS.findIndex((x) => x.key === step) ? " stepDone" : ""}`}
                  onClick={() => setStep(s.key)}
                >
                  <s.icon size={15} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {stepMsg && (
            <p className={stepMsg.includes("fail") || stepMsg.includes("Select") ? "error" : "successMsg"}>
              {stepMsg}
            </p>
          )}

          {step === "questions" && (
            <div className="builderStep">
              <p className="pageSubtitle">
                Select questions from your bank to include in this assessment.
                {selectedQIDs.size > 0 && <strong> {selectedQIDs.size} selected.</strong>}
              </p>
              <div className="qPickList">
                {questions.length === 0 && (
                  <p className="emptyState">No questions in bank. Go to Questions to add some.</p>
                )}
                {questions.map((q) => {
                  const label = q.type === "programming" ? q.programming?.title || "Programming" : q.mcq?.body || "Question";
                  return (
                    <label key={q.id} className={`qPickRow${selectedQIDs.has(q.id) ? " qPickSelected" : ""}`}>
                      <input
                        type="checkbox"
                        checked={selectedQIDs.has(q.id)}
                        onChange={() => toggleQ(q.id)}
                      />
                      <span className={`statusBadge ${q.type === "programming" ? "badgePurple" : ""}`}>{q.type}</span>
                      <span className="qPickLabel">{label}</span>
                      <span className="qPickTopic">{q.topic || "—"}</span>
                      <span className="qPickMarks">{q.marks} mk</span>
                    </label>
                  );
                })}
              </div>
              <div className="stepActions">
                <button className="primary" type="button" onClick={handleAttachQuestions} disabled={stepBusy || selectedQIDs.size === 0}>
                  {stepBusy ? "Saving…" : "Save & Next →"}
                </button>
              </div>
            </div>
          )}

          {step === "assign" && (
            <div className="builderStep">
              <p className="pageSubtitle">Choose who can take this assessment.</p>
              <form onSubmit={handleAssign}>
                <select name="target_type" defaultValue="college">
                  <option value="college">Entire college</option>
                  <option value="department">Department</option>
                  <option value="batch">Batch</option>
                  <option value="group">Group</option>
                  <option value="student">Individual student</option>
                </select>
                <input name="target_id" placeholder="Target ID (leave blank for college-wide)" />
                <div className="stepActions">
                  <button className="secondary" type="button" onClick={() => setStep("questions")}>← Back</button>
                  <button className="primary" type="submit" disabled={stepBusy}>
                    {stepBusy ? "Saving…" : "Save & Next →"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === "schedule" && (
            <div className="builderStep">
              <p className="pageSubtitle">Set the availability window. Leave blank to start immediately with a 7-day window.</p>
              <form onSubmit={handleSchedule}>
                <label>
                  Start time
                  <input name="start_time" type="datetime-local" />
                </label>
                <label>
                  End time
                  <input name="end_time" type="datetime-local" />
                </label>
                <div className="stepActions">
                  <button className="secondary" type="button" onClick={() => setStep("assign")}>← Back</button>
                  <button className="primary" type="submit" disabled={stepBusy}>
                    {stepBusy ? "Saving…" : "Save & Next →"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {step === "publish" && (
            <div className="builderStep">
              <p className="pageSubtitle">
                Publishing makes this assessment visible and startable by assigned students. This cannot be undone.
              </p>
              <div className="publishCard">
                <div>
                  <strong>{selected.title}</strong>
                  <span>{selected.type} · {selected.duration_minutes ?? 60} min · {selected.total_marks ?? "?"} marks</span>
                </div>
              </div>
              <div className="stepActions">
                <button className="secondary" type="button" onClick={() => setStep("schedule")}>← Back</button>
                <button className="primary" type="button" onClick={handlePublish} disabled={stepBusy}>
                  {stepBusy ? "Publishing…" : "Publish assessment"}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      <Modal open={modalOpen} title="New assessment" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate}>
          <input name="title" placeholder="Assessment title" required />
          <textarea name="description" placeholder="Description (optional)" />
          <select name="type" defaultValue="mixed">
            <option value="mcq">MCQ only</option>
            <option value="programming">Programming only</option>
            <option value="mixed">Mixed (MCQ + Programming)</option>
          </select>
          <div className="inline">
            <input name="duration_minutes" type="number" min={1} defaultValue={60} placeholder="Duration (minutes)" />
            <input name="total_marks" type="number" min={1} defaultValue={100} placeholder="Total marks" />
          </div>
          <input name="passing_marks" type="number" min={0} defaultValue={40} placeholder="Passing marks" />

          <fieldset className="optionFieldset">
            <legend>MCQ settings</legend>
            <label className="checkRow">
              <input type="checkbox" name="negative_marking" />
              Enable negative marking
            </label>
            <input name="negative_marks" type="number" min={0} step={0.25} defaultValue={0.25} placeholder="Marks deducted per wrong MCQ answer" />
            <label className="checkRow">
              <input type="checkbox" name="shuffle_questions" />
              Shuffle question order
            </label>
          </fieldset>

          <fieldset className="optionFieldset">
            <legend>Coding scoring mode</legend>
            <label className="checkRow">
              <input type="radio" name="coding_scoring_mode" value="weighted" defaultChecked />
              <span>
                <strong>Weighted</strong> — marks proportional to test cases passed
              </span>
            </label>
            <label className="checkRow">
              <input type="radio" name="coding_scoring_mode" value="attempt_penalty" />
              <span>
                <strong>Attempt penalty</strong> — 10% mark deduction per failed submission attempt
              </span>
            </label>
          </fieldset>

          <div className="modalActions">
            <button className="secondary" type="button" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? "Creating…" : "Create draft"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
