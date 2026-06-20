"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronDown, ChevronRight, FolderOpen, Folder, Plus, Trash2,
  Pencil, Check, X, Eye, EyeOff, BookOpen, Code2, Search,
} from "lucide-react";
import {
  listPracticeModules, createPracticeModule, updatePracticeModule,
  deletePracticeModule, listModuleQuestions, addModuleQuestions,
  updateModuleQuestionSlot, removeModuleQuestion, listQuestions,
  type PracticeModule, type ModuleQuestionSlot, type Question,
} from "../lib/api";
import { getSession } from "../lib/auth";
import { Modal } from "./Modal";

// ── helpers ───────────────────────────────────────────────────────────────────

const CAT_COLOR: Record<string, string> = {
  mcq: "var(--accent)",
  coding: "#8b5cf6",
  mixed: "#f59e0b",
};

const DIFF_COLOR: Record<string, string> = {
  easy: "#16a34a",
  medium: "#d97706",
  hard: "#dc2626",
};

// ── Module form ───────────────────────────────────────────────────────────────

type ModuleFormData = { name: string; category: string; description: string; tags: string; ord: string };

function ModuleForm({ initial, onSave, onCancel }: {
  initial?: Partial<ModuleFormData>;
  onSave: (d: ModuleFormData) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<ModuleFormData>({
    name: initial?.name ?? "",
    category: initial?.category ?? "mixed",
    description: initial?.description ?? "",
    tags: initial?.tags ?? "",
    ord: initial?.ord ?? "0",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (k: keyof ModuleFormData, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setError("Folder name is required"); return; }
    setSaving(true);
    setError("");
    try { await onSave(form); } catch (err: unknown) { setError((err as Error).message); }
    finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "9px 12px", border: "1px solid var(--line)",
    borderRadius: 8, background: "var(--bg)", color: "var(--ink)",
    fontSize: 13.5, outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    display: "block", fontSize: 12.5, fontWeight: 600,
    color: "var(--ink-2)", marginBottom: 5,
  };

  return (
    <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {error && (
        <p style={{ fontSize: 13, color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: 6 }}>
          {error}
        </p>
      )}
      <div>
        <label style={labelStyle}>Folder Name *</label>
        <input value={form.name} onChange={e => set("name", e.target.value)}
          style={inputStyle} placeholder="e.g. Arrays & Hashing" />
      </div>
      <div>
        <label style={labelStyle}>Category</label>
        <select value={form.category} onChange={e => set("category", e.target.value)} style={inputStyle}>
          <option value="mixed">Mixed (MCQ + Coding)</option>
          <option value="mcq">MCQ only</option>
          <option value="coding">Coding only</option>
        </select>
      </div>
      <div>
        <label style={labelStyle}>Description</label>
        <textarea value={form.description} onChange={e => set("description", e.target.value)}
          rows={2} style={{ ...inputStyle, resize: "vertical" }}
          placeholder="What will students practise here?" />
      </div>
      <div>
        <label style={labelStyle}>Topic Tags</label>
        <input value={form.tags} onChange={e => set("tags", e.target.value)}
          style={inputStyle} placeholder="Arrays, Sorting, DP (comma-separated)" />
      </div>
      <div>
        <label style={labelStyle}>Order</label>
        <input type="number" value={form.ord} onChange={e => set("ord", e.target.value)}
          min={0} style={{ ...inputStyle, width: 100 }} />
      </div>
      <div className="modalActions">
        <button type="button" className="secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="primary" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

// ── Slot row ──────────────────────────────────────────────────────────────────

function SlotRow({ slot, onRemove, onUpdate }: {
  slot: ModuleQuestionSlot;
  onRemove: () => void;
  onUpdate: (marks: number, maxAttempts: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [marks, setMarks] = useState(String(slot.marks));
  const [attempts, setAttempts] = useState(String(slot.max_attempts));
  const q = slot.question;

  const save = () => { onUpdate(Number(marks), Number(attempts)); setEditing(false); };

  return (
    <div style={{
      display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px",
      background: "var(--panel)", border: "1px solid var(--line)", borderRadius: 8,
    }}>
      <div style={{ paddingTop: 2, flexShrink: 0 }}>
        {q?.type === "coding"
          ? <Code2 size={14} style={{ color: "#8b5cf6" }} />
          : <BookOpen size={14} style={{ color: "var(--accent)" }} />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {q?.title || q?.body || slot.question_id}
          </span>
          {q?.difficulty && (
            <span style={{ fontSize: 11, fontWeight: 700, color: DIFF_COLOR[q.difficulty] ?? "var(--muted)" }}>
              {q.difficulty}
            </span>
          )}
          {q?.topic && <span style={{ fontSize: 11.5, color: "var(--muted)" }}>{q.topic}</span>}
        </div>
        {editing ? (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
            <label style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
              Marks
              <input type="number" value={marks} onChange={e => setMarks(e.target.value)} min={0}
                style={{ width: 60, padding: "2px 6px", border: "1px solid var(--line)", borderRadius: 5, fontSize: 12 }} />
              <span style={{ color: "var(--muted)", fontSize: 11 }}>(0=inherit)</span>
            </label>
            <label style={{ fontSize: 12, color: "var(--muted)", display: "flex", alignItems: "center", gap: 6 }}>
              Max Attempts
              <input type="number" value={attempts} onChange={e => setAttempts(e.target.value)} min={0}
                style={{ width: 60, padding: "2px 6px", border: "1px solid var(--line)", borderRadius: 5, fontSize: 12 }} />
              <span style={{ color: "var(--muted)", fontSize: 11 }}>(0=∞)</span>
            </label>
            <button onClick={save} style={{ background: "none", border: "none", cursor: "pointer", color: "#16a34a", padding: 2 }}>
              <Check size={15} />
            </button>
            <button onClick={() => setEditing(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)", padding: 2 }}>
              <X size={15} />
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4 }}>
            <span style={{ fontSize: 11.5, color: "var(--muted)" }}>
              Marks: <strong style={{ color: "var(--ink-2)" }}>{slot.marks || q?.marks || "—"}</strong>
            </span>
            <span style={{ fontSize: 11.5, color: "var(--muted)" }}>
              Attempts: <strong style={{ color: "var(--ink-2)" }}>{slot.max_attempts > 0 ? slot.max_attempts : "∞"}</strong>
            </span>
            <button onClick={() => setEditing(true)}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", padding: 2, marginLeft: 4 }}>
              <Pencil size={12} />
            </button>
          </div>
        )}
      </div>
      <button onClick={onRemove}
        style={{ background: "none", border: "none", cursor: "pointer", color: "#dc2626", padding: 4, flexShrink: 0, marginTop: 2 }}>
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Add questions modal ───────────────────────────────────────────────────────

function AddQuestionsModal({ moduleId, token, existingIds, onDone, onClose }: {
  moduleId: string; token: string; existingIds: Set<string>;
  onDone: () => void; onClose: () => void;
}) {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [loadingQ, setLoadingQ] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "mcq" | "coding">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listQuestions(token)
      .then(setAllQuestions)
      .catch(() => setError("Could not load questions"))
      .finally(() => setLoadingQ(false));
  }, [token]);

  const visible = allQuestions.filter(q => {
    if (existingIds.has(q.id)) return false;
    if (filter !== "all" && q.type !== filter) return false;
    const s = search.toLowerCase();
    if (!s) return true;
    const title = q.programming?.title ?? q.mcq?.body ?? "";
    return title.toLowerCase().includes(s) || (q.topic ?? "").toLowerCase().includes(s);
  });

  const toggle = (id: string) => setSelected(prev => {
    const n = new Set(prev);
    n.has(id) ? n.delete(id) : n.add(id);
    return n;
  });

  const confirm = async () => {
    if (selected.size === 0) return;
    setAdding(true);
    setError("");
    try {
      const questions = Array.from(selected).map((id, i) => ({ question_id: id, ord: i }));
      await addModuleQuestions(token, moduleId, questions);
      onDone();
      onClose();
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setAdding(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    padding: "8px 12px", border: "1px solid var(--line)", borderRadius: 8,
    background: "var(--bg)", color: "var(--ink)", fontSize: 13.5, outline: "none",
  };

  return (
    <Modal open={true} title={`Add Questions${selected.size > 0 ? ` (${selected.size} selected)` : ""}`} onClose={onClose}>
      {error && (
        <p style={{ fontSize: 13, color: "#dc2626", background: "#fef2f2", padding: "8px 12px", borderRadius: 6, marginBottom: 12 }}>
          {error}
        </p>
      )}

      {/* Search + filter bar */}
      <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
          <Search size={14} style={{ position: "absolute", left: 10, color: "var(--muted)" }} />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by title or topic…"
            style={{ ...inputStyle, width: "100%", paddingLeft: 32 }}
          />
        </div>
        <select value={filter} onChange={e => setFilter(e.target.value as "all" | "mcq" | "coding")}
          style={{ ...inputStyle, width: "auto" }}>
          <option value="all">All types</option>
          <option value="mcq">MCQ only</option>
          <option value="coding">Coding only</option>
        </select>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <span style={{ fontSize: 12, color: "var(--muted)" }}>
          {loadingQ ? "Loading…" : `${visible.length} available`}
        </span>
        {selected.size > 0 && (
          <button onClick={() => setSelected(new Set())}
            style={{ fontSize: 12, color: "var(--accent)", background: "none", border: "none", cursor: "pointer" }}>
            Clear selection
          </button>
        )}
      </div>

      {/* Question list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 320, overflowY: "auto", paddingRight: 2 }}>
        {!loadingQ && visible.length === 0 && (
          <p style={{ textAlign: "center", color: "var(--muted)", padding: "32px 0", fontSize: 13 }}>
            No questions found
          </p>
        )}
        {visible.map(q => {
          const label = q.programming?.title ?? q.mcq?.body ?? q.id;
          const isSelected = selected.has(q.id);
          return (
            <button key={q.id} onClick={() => toggle(q.id)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px",
                border: `1.5px solid ${isSelected ? "var(--accent)" : "var(--line)"}`,
                borderRadius: 8, background: isSelected ? "var(--accent-light)" : "var(--panel)",
                cursor: "pointer", textAlign: "left", transition: "all 0.12s",
              }}>
              {/* Checkbox */}
              <div style={{
                width: 18, height: 18, borderRadius: 4, flexShrink: 0,
                border: `2px solid ${isSelected ? "var(--accent)" : "var(--line)"}`,
                background: isSelected ? "var(--accent)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {isSelected && <Check size={10} style={{ color: "#fff" }} />}
              </div>
              {/* Icon */}
              {q.type === "coding"
                ? <Code2 size={14} style={{ color: "#8b5cf6", flexShrink: 0 }} />
                : <BookOpen size={14} style={{ color: "var(--accent)", flexShrink: 0 }} />}
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13.5, color: "var(--ink)", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                  {label}
                </p>
                <p style={{ fontSize: 11.5, color: "var(--muted)", margin: "2px 0 0" }}>
                  {q.type} · {q.topic ?? "—"} · {q.difficulty ?? "—"} · {q.marks ?? 0} marks
                </p>
              </div>
              {/* Difficulty badge */}
              {q.difficulty && (
                <span style={{ fontSize: 11, fontWeight: 700, color: DIFF_COLOR[q.difficulty] ?? "var(--muted)", flexShrink: 0 }}>
                  {q.difficulty}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--line)" }}>
        <button className="secondary" onClick={onClose}>Cancel</button>
        <button className="primary" onClick={confirm} disabled={selected.size === 0 || adding}>
          {adding ? "Adding…" : `Add ${selected.size > 0 ? selected.size + " " : ""}Question${selected.size !== 1 ? "s" : ""}`}
        </button>
      </div>
    </Modal>
  );
}

// ── Module row ────────────────────────────────────────────────────────────────

function ModuleRow({ mod, token, onRefresh }: {
  mod: PracticeModule; token: string; onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<ModuleQuestionSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [togglingPublish, setTogglingPublish] = useState(false);

  const loadSlots = useCallback(async () => {
    setLoadingSlots(true);
    try { setSlots(await listModuleQuestions(token, mod.id)); }
    catch { /* ignore */ }
    finally { setLoadingSlots(false); }
  }, [token, mod.id]);

  const toggle = () => {
    if (!open) loadSlots();
    setOpen(o => !o);
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${mod.name}"? This cannot be undone.`)) return;
    try { await deletePracticeModule(token, mod.id); onRefresh(); }
    catch { alert("Failed to delete module"); }
  };

  const handlePublishToggle = async () => {
    setTogglingPublish(true);
    try {
      await updatePracticeModule(token, mod.id, { is_published: !mod.is_published });
      onRefresh();
    } catch (err: unknown) {
      alert((err as Error).message || "Failed to update");
    } finally {
      setTogglingPublish(false);
    }
  };

  const handleSlotUpdate = async (slot: ModuleQuestionSlot, marks: number, maxAttempts: number) => {
    try {
      await updateModuleQuestionSlot(token, mod.id, slot.question_id, { marks, max_attempts: maxAttempts });
      loadSlots();
    } catch { alert("Failed to update slot"); }
  };

  const handleSlotRemove = async (slot: ModuleQuestionSlot) => {
    if (!confirm("Remove this question from the module?")) return;
    try { await removeModuleQuestion(token, mod.id, slot.question_id); loadSlots(); }
    catch { alert("Failed to remove question"); }
  };

  const existingIds = new Set(slots.map(s => s.question_id));
  const catColor = CAT_COLOR[mod.category] ?? "var(--muted)";

  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 12, overflow: "hidden", background: "var(--panel)" }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", cursor: "pointer" }}
        onClick={toggle}>
        <span style={{ color: "var(--muted)", flexShrink: 0 }}>
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
        <span style={{ color: catColor, flexShrink: 0 }}>
          {open ? <FolderOpen size={18} /> : <Folder size={18} />}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: 14, color: "var(--ink)" }}>{mod.name}</span>
            <span style={{
              fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 20,
              background: `${catColor}18`, color: catColor,
            }}>
              {mod.category.toUpperCase()}
            </span>
            {!mod.is_published && (
              <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "#fef3c7", color: "#92400e" }}>
                DRAFT
              </span>
            )}
            {mod.tags && mod.tags.split(",").slice(0, 3).map(t => (
              <span key={t} style={{ fontSize: 11, padding: "2px 7px", borderRadius: 20, background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--line)" }}>
                {t.trim()}
              </span>
            ))}
          </div>
          {mod.description && (
            <p style={{ fontSize: 12, color: "var(--muted)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {mod.description}
            </p>
          )}
        </div>
        {/* Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
          onClick={e => e.stopPropagation()}>
          <button
            onClick={handlePublishToggle}
            disabled={togglingPublish}
            title={mod.is_published ? "Unpublish" : "Publish"}
            style={{
              width: 32, height: 32, border: "1px solid var(--line)", borderRadius: 8,
              background: "transparent", cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: mod.is_published ? "var(--accent)" : "var(--muted)",
              opacity: togglingPublish ? 0.5 : 1,
            }}>
            {mod.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
          <button onClick={() => setShowEdit(true)}
            style={{ width: 32, height: 32, border: "1px solid var(--line)", borderRadius: 8, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-2)" }}>
            <Pencil size={14} />
          </button>
          <button onClick={handleDelete}
            style={{ width: 32, height: 32, border: "1px solid var(--line)", borderRadius: 8, background: "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#dc2626" }}>
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Expanded: question slots */}
      {open && (
        <div style={{ borderTop: "1px solid var(--line)", background: "var(--bg)", padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
          {loadingSlots && (
            <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, padding: "16px 0" }}>Loading…</p>
          )}
          {!loadingSlots && slots.length === 0 && (
            <p style={{ textAlign: "center", color: "var(--muted)", fontSize: 13, padding: "16px 0" }}>
              No questions yet. Add some below.
            </p>
          )}
          {slots.map(slot => (
            <SlotRow key={slot.id} slot={slot}
              onRemove={() => handleSlotRemove(slot)}
              onUpdate={(m, a) => handleSlotUpdate(slot, m, a)} />
          ))}
          <button onClick={() => setShowAdd(true)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              padding: "10px 0", border: "1.5px dashed var(--accent)", borderRadius: 8,
              background: "var(--accent-light)", color: "var(--accent)",
              cursor: "pointer", fontSize: 13.5, fontWeight: 600, marginTop: 4,
            }}>
            <Plus size={15} /> Add Questions
          </button>
        </div>
      )}

      {showEdit && (
        <Modal open={true} title="Edit Folder" onClose={() => setShowEdit(false)}>
          <ModuleForm
            initial={{ name: mod.name, category: mod.category, description: mod.description, tags: mod.tags, ord: String(mod.ord) }}
            onSave={async d => {
              await updatePracticeModule(token, mod.id, { ...d, ord: Number(d.ord) });
              setShowEdit(false);
              onRefresh();
            }}
            onCancel={() => setShowEdit(false)}
          />
        </Modal>
      )}

      {showAdd && (
        <AddQuestionsModal
          moduleId={mod.id} token={token} existingIds={existingIds}
          onDone={loadSlots} onClose={() => setShowAdd(false)}
        />
      )}
    </div>
  );
}

// ── Main panel ────────────────────────────────────────────────────────────────

export default function PracticePanel() {
  const token = getSession()?.access_token ?? "";

  const [modules, setModules] = useState<PracticeModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try { setModules(await listPracticeModules(token)); }
    catch { setError("Failed to load practice folders"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (d: ModuleFormData) => {
    await createPracticeModule(token, { ...d, ord: Number(d.ord) });
    setShowCreate(false);
    load();
  };

  const published = modules.filter(m => m.is_published).length;
  const draft = modules.filter(m => !m.is_published).length;

  return (
    <div>
      {/* Header */}
      <div className="titleRow">
        <div>
          <h1>Practice Folders</h1>
          <p className="pageSubtitle">Organise MCQ and coding questions into topic folders for student practice.</p>
        </div>
        <button className="primary" onClick={() => setShowCreate(true)}>
          <Plus size={15} /> New Folder
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        {[
          { label: "Total Folders", value: modules.length, color: "var(--accent)" },
          { label: "Published", value: published, color: "#16a34a" },
          { label: "Draft", value: draft, color: "#d97706" },
        ].map(s => (
          <div key={s.label} className="panel" style={{ padding: "16px 20px" }}>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: "0 0 2px" }}>{s.value}</p>
            <p style={{ fontSize: 12.5, color: "var(--muted)", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {error && <p style={{ color: "#dc2626", background: "#fef2f2", padding: "10px 14px", borderRadius: 8, marginBottom: 16, fontSize: 13 }}>{error}</p>}

      {/* List */}
      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 58, background: "var(--line)", borderRadius: 12, animation: "pulse 1.5s ease infinite" }} />
          ))}
        </div>
      ) : modules.length === 0 ? (
        <div className="panel" style={{ textAlign: "center", padding: "60px 24px" }}>
          <FolderOpen size={44} style={{ color: "var(--line)", margin: "0 auto 12px" }} />
          <p style={{ fontWeight: 600, fontSize: 15, color: "var(--ink)", margin: "0 0 6px" }}>No practice folders yet</p>
          <p style={{ fontSize: 13, color: "var(--muted)", margin: "0 0 20px" }}>Create a folder to start organising questions for students.</p>
          <button className="primary" onClick={() => setShowCreate(true)}>
            <Plus size={15} /> Create First Folder
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {modules.map(mod => (
            <ModuleRow key={mod.id} mod={mod} token={token} onRefresh={load} />
          ))}
        </div>
      )}

      {showCreate && (
        <Modal open={true} title="New Practice Folder" onClose={() => setShowCreate(false)}>
          <ModuleForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}
    </div>
  );
}
