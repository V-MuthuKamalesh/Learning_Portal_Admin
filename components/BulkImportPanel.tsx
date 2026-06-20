"use client";

import { useState } from "react";
import {
  Upload, CheckCircle2, XCircle, AlertCircle, ChevronDown,
  ChevronUp, FileJson, BookOpen, Code2, Trash2
} from "lucide-react";
import { bulkImportMCQ, bulkImportCoding, type BulkImportResult } from "../lib/api";
import { getSession } from "../lib/auth";

// ── JSON template skeletons shown to the user ─────────────────────────────────

const MCQ_TEMPLATE = JSON.stringify({
  questions: [
    {
      topic: "Arrays",
      difficulty: "easy",
      marks: 5,
      body: "Your question text here?",
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct_index: 0,
      explanation: "Why this option is correct (optional)"
    }
  ]
}, null, 2);

const CODING_TEMPLATE = JSON.stringify({
  questions: [
    {
      topic: "Arrays",
      difficulty: "medium",
      marks: 20,
      title: "Problem title",
      description: "Full problem statement here.",
      input_format: "Line 1: n\nLine 2: n integers",
      output_format: "A single integer",
      constraints: "1 <= n <= 10^5",
      sample_input: "5\n1 2 3 4 5",
      sample_output: "15",
      explanation: "Sum of all elements.",
      time_limit_ms: 2000,
      memory_limit_mb: 256,
      test_cases: [
        { input: "5\n1 2 3 4 5", expected_output: "15", is_hidden: false, weight: 1 },
        { input: "3\n-1 0 1",    expected_output: "0",  is_hidden: true,  weight: 2 }
      ]
    }
  ]
}, null, 2);

// ── helpers ───────────────────────────────────────────────────────────────────

type Mode = "mcq" | "coding";

function parseJSON(text: string): { ok: true; data: unknown[] } | { ok: false; error: string } {
  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.questions)) {
      return { ok: false, error: 'JSON must have a top-level "questions" array.' };
    }
    if (parsed.questions.length === 0) {
      return { ok: false, error: '"questions" array is empty.' };
    }
    return { ok: true, data: parsed.questions };
  } catch (e: unknown) {
    return { ok: false, error: `Invalid JSON: ${(e as Error).message}` };
  }
}

// ── Result banner ─────────────────────────────────────────────────────────────

function ResultBanner({ result }: { result: BulkImportResult }) {
  const [showErrors, setShowErrors] = useState(false);
  const hasErrors = result.errors && result.errors.length > 0;

  return (
    <div className={`rounded-xl border p-4 space-y-2 ${
      result.failed === 0 ? "bg-green-50 border-green-200" : "bg-yellow-50 border-yellow-200"
    }`}>
      <div className="flex items-center gap-3">
        {result.failed === 0
          ? <CheckCircle2 size={20} className="text-green-600 shrink-0" />
          : <AlertCircle size={20} className="text-yellow-600 shrink-0" />}
        <div>
          <p className="font-medium text-gray-800">
            {result.created} question{result.created !== 1 ? "s" : ""} imported successfully
            {result.failed > 0 && `, ${result.failed} failed`}.
          </p>
        </div>
      </div>
      {hasErrors && (
        <div>
          <button onClick={() => setShowErrors(s => !s)}
            className="text-sm text-yellow-700 flex items-center gap-1 hover:underline">
            {showErrors ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showErrors ? "Hide" : "Show"} {result.errors!.length} error{result.errors!.length !== 1 ? "s" : ""}
          </button>
          {showErrors && (
            <ul className="mt-2 space-y-1 text-sm text-red-600">
              {result.errors!.map((e, i) => (
                <li key={i} className="flex items-start gap-2">
                  <XCircle size={13} className="mt-0.5 shrink-0" />
                  {e}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// ── Preview table ─────────────────────────────────────────────────────────────

function PreviewMCQ({ items }: { items: unknown[] }) {
  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b text-xs font-medium text-gray-500 uppercase tracking-wide">
        Preview — {items.length} MCQ question{items.length !== 1 ? "s" : ""}
      </div>
      <div className="divide-y max-h-64 overflow-y-auto">
        {(items as Record<string, unknown>[]).map((q, i) => (
          <div key={i} className="px-4 py-3 flex gap-3 items-start text-sm">
            <span className="text-gray-300 text-xs w-5 shrink-0 text-right pt-0.5">{i + 1}</span>
            <div>
              <p className="text-gray-800 font-medium leading-snug">{String(q.body ?? "—")}</p>
              <p className="text-xs text-gray-400 mt-0.5">{String(q.topic ?? "")} · {String(q.difficulty ?? "")} · {String(q.marks ?? "")}m · correct: {String(q.correct_index ?? "")}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PreviewCoding({ items }: { items: unknown[] }) {
  return (
    <div className="border rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-4 py-2 border-b text-xs font-medium text-gray-500 uppercase tracking-wide">
        Preview — {items.length} coding problem{items.length !== 1 ? "s" : ""}
      </div>
      <div className="divide-y max-h-64 overflow-y-auto">
        {(items as Record<string, unknown>[]).map((q, i) => {
          const cases = Array.isArray(q.test_cases) ? q.test_cases : [];
          const hidden = cases.filter((t: Record<string, unknown>) => t.is_hidden).length;
          return (
            <div key={i} className="px-4 py-3 flex gap-3 items-start text-sm">
              <span className="text-gray-300 text-xs w-5 shrink-0 text-right pt-0.5">{i + 1}</span>
              <div>
                <p className="text-gray-800 font-medium">{String(q.title ?? "—")}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {String(q.topic ?? "")} · {String(q.difficulty ?? "")} · {String(q.marks ?? "")}m ·
                  {cases.length} test case{cases.length !== 1 ? "s" : ""} ({hidden} hidden) ·
                  {String(q.time_limit_ms ?? 2000)}ms / {String(q.memory_limit_mb ?? 256)}MB
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function BulkImportPanel() {
  const token = getSession()?.access_token ?? "";

  const [mode, setMode] = useState<Mode>("mcq");
  const [json, setJson] = useState("");
  const [parseError, setParseError] = useState("");
  const [preview, setPreview] = useState<unknown[] | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const handleJsonChange = (v: string) => {
    setJson(v);
    setParseError("");
    setPreview(null);
    setResult(null);
  };

  const handlePreview = () => {
    const parsed = parseJSON(json);
    if (!parsed.ok) { setParseError(parsed.error); return; }
    setParseError("");
    setPreview(parsed.data);
  };

  const handleImport = async () => {
    const parsed = parseJSON(json);
    if (!parsed.ok) { setParseError(parsed.error); return; }
    setImporting(true);
    setResult(null);
    try {
      const res = mode === "mcq"
        ? await bulkImportMCQ(token, parsed.data)
        : await bulkImportCoding(token, parsed.data);
      setResult(res);
      if (res.created > 0) { setJson(""); setPreview(null); }
    } catch (e: unknown) {
      setParseError((e as Error).message);
    } finally {
      setImporting(false);
    }
  };

  const loadTemplate = () => {
    handleJsonChange(mode === "mcq" ? MCQ_TEMPLATE : CODING_TEMPLATE);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bulk Import Questions</h1>
        <p className="text-sm text-gray-500 mt-1">
          Paste a JSON array of questions to add many at once to the question bank.
        </p>
      </div>

      {/* Type toggle */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(["mcq", "coding"] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); handleJsonChange(""); }}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
              ${mode === m ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {m === "mcq" ? <BookOpen size={15} /> : <Code2 size={15} />}
            {m === "mcq" ? "MCQ Questions" : "Coding Problems"}
          </button>
        ))}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800 space-y-1">
        <p className="font-medium">JSON format</p>
        {mode === "mcq" ? (
          <ul className="list-disc list-inside text-blue-700 space-y-0.5">
            <li><b>body</b> — question text (required)</li>
            <li><b>options</b> — exactly 4 strings (required)</li>
            <li><b>correct_index</b> — 0–3 (required)</li>
            <li><b>topic, difficulty, marks, explanation</b> — optional</li>
          </ul>
        ) : (
          <ul className="list-disc list-inside text-blue-700 space-y-0.5">
            <li><b>title, description</b> — required</li>
            <li><b>test_cases</b> — array with <b>expected_output</b> (required, min 1)</li>
            <li><b>is_hidden: true</b> on test cases students shouldn't see</li>
            <li><b>topic, difficulty, marks, time_limit_ms, memory_limit_mb</b> — optional</li>
          </ul>
        )}
        <button onClick={loadTemplate} className="text-blue-600 underline text-xs mt-1">
          Load template
        </button>
      </div>

      {/* JSON editor */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">
            Paste JSON <span className="text-gray-400 font-normal">(wrap questions in {`{ "questions": [...] }`})</span>
          </label>
          {json && (
            <button onClick={() => handleJsonChange("")}
              className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1">
              <Trash2 size={12} /> Clear
            </button>
          )}
        </div>
        <textarea
          value={json}
          onChange={e => handleJsonChange(e.target.value)}
          rows={14}
          spellCheck={false}
          className={`w-full border rounded-xl px-4 py-3 text-xs font-mono leading-relaxed resize-y
            focus:outline-none focus:ring-2 focus:ring-indigo-400
            ${parseError ? "border-red-400 bg-red-50" : "border-gray-200"}`}
          placeholder={mode === "mcq" ? MCQ_TEMPLATE : CODING_TEMPLATE}
        />
        {parseError && (
          <p className="text-sm text-red-600 flex items-center gap-1">
            <XCircle size={14} /> {parseError}
          </p>
        )}
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-3">
        <button onClick={handlePreview} disabled={!json.trim()}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg text-sm text-gray-700
            hover:bg-gray-50 disabled:opacity-40">
          <FileJson size={15} /> Preview
        </button>
        <button onClick={handleImport} disabled={!json.trim() || importing}
          className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg text-sm
            font-medium hover:bg-indigo-700 disabled:opacity-40">
          <Upload size={15} />
          {importing ? "Importing…" : "Import"}
        </button>
      </div>

      {/* Preview */}
      {preview && !result && (
        mode === "mcq"
          ? <PreviewMCQ items={preview} />
          : <PreviewCoding items={preview} />
      )}

      {/* Result */}
      {result && <ResultBanner result={result} />}
    </div>
  );
}
