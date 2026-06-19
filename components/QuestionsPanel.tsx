"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { PageHeader } from "./PageHeader";
import { Modal } from "./Modal";
import { createMCQQuestion, createProgrammingQuestion, listQuestions, Question } from "../lib/api";
import { getSession } from "../lib/auth";

type QuestionMode = "mcq" | "programming";

type TestCaseForm = {
  input: string;
  expected_output: string;
  is_hidden: boolean;
  weight: number;
};

const emptyTestCase = (): TestCaseForm => ({
  input: "",
  expected_output: "",
  is_hidden: false,
  weight: 1
});

export function QuestionsPanel() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<QuestionMode>("mcq");
  const [submitting, setSubmitting] = useState(false);
  const [mcqOptions, setMcqOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [testCases, setTestCases] = useState<TestCaseForm[]>([emptyTestCase(), emptyTestCase()]);
  const token = getSession()?.access_token;

  const loadQuestions = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setQuestions(await listQuestions(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load questions");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  function resetForm() {
    setMcqOptions(["", "", "", ""]);
    setCorrectIndex(0);
    setTestCases([emptyTestCase(), emptyTestCase()]);
    setMode("mcq");
  }

  async function handleCreateMCQ(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    if (mcqOptions.some((o) => !o.trim())) {
      setError("All 4 options are required");
      return;
    }
    setSubmitting(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await createMCQQuestion(token, {
        topic: String(data.get("topic") || ""),
        difficulty: String(data.get("difficulty") || "easy"),
        marks: Number(data.get("marks") || 1),
        body: String(data.get("body")),
        options: mcqOptions.map((o) => o.trim()),
        correct_index: correctIndex,
        explanation: String(data.get("explanation") || "")
      });
      await loadQuestions();
      setModalOpen(false);
      resetForm();
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create question");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCreateProgramming(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    if (testCases.length === 0 || testCases.some((tc) => !tc.expected_output.trim())) {
      setError("At least one test case with expected output is required");
      return;
    }
    setSubmitting(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      await createProgrammingQuestion(token, {
        topic: String(data.get("topic") || ""),
        difficulty: String(data.get("difficulty") || "easy"),
        marks: Number(data.get("marks") || 10),
        title: String(data.get("title")),
        description: String(data.get("description")),
        input_format: String(data.get("input_format") || ""),
        output_format: String(data.get("output_format") || ""),
        constraints: String(data.get("constraints") || ""),
        sample_input: String(data.get("sample_input") || ""),
        sample_output: String(data.get("sample_output") || ""),
        time_limit_ms: Number(data.get("time_limit_ms") || 2000),
        memory_limit_mb: Number(data.get("memory_limit_mb") || 256),
        test_cases: testCases.map((tc) => ({
          input: tc.input,
          expected_output: tc.expected_output,
          is_hidden: tc.is_hidden,
          weight: tc.weight || 1
        }))
      });
      await loadQuestions();
      setModalOpen(false);
      resetForm();
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create question");
    } finally {
      setSubmitting(false);
    }
  }

  function questionLabel(q: Question) {
    if (q.type === "programming") return q.programming?.title || "Programming question";
    return q.mcq?.body || "Question";
  }

  return (
    <>
      <PageHeader title="Questions" note="MCQ and programming question bank" actionLabel="Add question" onAction={() => setModalOpen(true)} />
      {error && <p className="error">{error}</p>}
      <section className="panel tablePanel">
        <h2>Question bank {loading ? "(loading…)" : `(${questions.length})`}</h2>
        <table>
          <thead>
            <tr>
              <th>Question</th>
              <th>Topic</th>
              <th>Type</th>
              <th>Marks</th>
            </tr>
          </thead>
          <tbody>
            {questions.map((question) => (
              <tr key={question.id}>
                <td>
                  <strong>{questionLabel(question)}</strong>
                  {question.type === "programming" && question.programming?.test_cases && (
                    <small>
                      {question.programming.test_cases.filter((tc) => !tc.is_hidden).length} public /{" "}
                      {question.programming.test_cases.filter((tc) => tc.is_hidden).length} hidden test cases
                    </small>
                  )}
                </td>
                <td>{question.topic || "-"}</td>
                <td>{question.type}</td>
                <td>{question.marks ?? 1}</td>
              </tr>
            ))}
            {!loading && questions.length === 0 && (
              <tr>
                <td colSpan={4} className="emptyState">
                  No questions yet. Click &quot;Add question&quot; to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <Modal open={modalOpen} title="Add question" onClose={() => { setModalOpen(false); resetForm(); }}>
        <div className="tabRow">
          <button className={mode === "mcq" ? "active" : ""} type="button" onClick={() => setMode("mcq")}>
            MCQ
          </button>
          <button className={mode === "programming" ? "active" : ""} type="button" onClick={() => setMode("programming")}>
            Programming
          </button>
        </div>

        {mode === "mcq" ? (
          <form onSubmit={handleCreateMCQ}>
            <input name="topic" placeholder="Topic" />
            <select name="difficulty" defaultValue="easy">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <input name="marks" type="number" min={1} defaultValue={1} placeholder="Marks for this question" />
            <textarea name="body" placeholder="Question text" required />
            <fieldset className="optionFieldset">
              <legend>4 options — select the correct answer</legend>
              {mcqOptions.map((option, index) => (
                <label key={index} className="optionRow">
                  <input
                    type="radio"
                    name="correct"
                    checked={correctIndex === index}
                    onChange={() => setCorrectIndex(index)}
                  />
                  <input
                    value={option}
                    onChange={(e) => {
                      const next = [...mcqOptions];
                      next[index] = e.target.value;
                      setMcqOptions(next);
                    }}
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                </label>
              ))}
            </fieldset>
            <textarea name="explanation" placeholder="Explanation (optional)" />
            <div className="modalActions">
              <button className="secondary" type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="primary" type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Create MCQ"}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleCreateProgramming}>
            <input name="topic" placeholder="Topic" />
            <select name="difficulty" defaultValue="medium">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <input name="marks" type="number" min={1} defaultValue={10} placeholder="Total marks for this question" />
            <input name="title" placeholder="Problem title" required />
            <textarea name="description" placeholder="Problem description" required />
            <textarea name="input_format" placeholder="Input format" />
            <textarea name="output_format" placeholder="Output format" />
            <textarea name="constraints" placeholder="Constraints" />
            <input name="sample_input" placeholder="Sample input" />
            <input name="sample_output" placeholder="Sample output" />
            <input name="time_limit_ms" type="number" min={500} defaultValue={2000} placeholder="Time limit (ms)" />
            <input name="memory_limit_mb" type="number" min={64} defaultValue={256} placeholder="Memory limit (MB)" />

            <fieldset className="optionFieldset">
              <legend>Test cases</legend>
              {testCases.map((tc, index) => (
                <div className="testCaseBlock" key={index}>
                  <strong>Test case {index + 1}</strong>
                  <textarea
                    value={tc.input}
                    onChange={(e) => {
                      const next = [...testCases];
                      next[index] = { ...next[index], input: e.target.value };
                      setTestCases(next);
                    }}
                    placeholder="Input"
                  />
                  <textarea
                    value={tc.expected_output}
                    onChange={(e) => {
                      const next = [...testCases];
                      next[index] = { ...next[index], expected_output: e.target.value };
                      setTestCases(next);
                    }}
                    placeholder="Expected output"
                    required
                  />
                  <label>
                    <input
                      type="checkbox"
                      checked={tc.is_hidden}
                      onChange={(e) => {
                        const next = [...testCases];
                        next[index] = { ...next[index], is_hidden: e.target.checked };
                        setTestCases(next);
                      }}
                    />
                    Hidden test case
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={tc.weight}
                    onChange={(e) => {
                      const next = [...testCases];
                      next[index] = { ...next[index], weight: Number(e.target.value) || 1 };
                      setTestCases(next);
                    }}
                    placeholder="Marks weight"
                  />
                  {testCases.length > 1 && (
                    <button
                      className="secondary compact"
                      type="button"
                      onClick={() => setTestCases((current) => current.filter((_, i) => i !== index))}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button className="secondary compact" type="button" onClick={() => setTestCases((current) => [...current, emptyTestCase()])}>
                Add test case
              </button>
            </fieldset>

            <div className="modalActions">
              <button className="secondary" type="button" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              <button className="primary" type="submit" disabled={submitting}>
                {submitting ? "Saving…" : "Create programming question"}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
