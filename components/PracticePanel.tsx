"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ChevronDown, ChevronRight, FolderOpen, Folder, Plus, Trash2,
  Pencil, Check, X, GripVertical, Eye, EyeOff, BookOpen, Code2
} from "lucide-react";
import {
  listPracticeModules, createPracticeModule, updatePracticeModule,
  deletePracticeModule, listModuleQuestions, addModuleQuestions,
  updateModuleQuestionSlot, removeModuleQuestion, listQuestions,
  type PracticeModule, type ModuleQuestionSlot, type Question
} from "../lib/api";
import { getSession } from "../lib/auth";

// ── helpers ───────────────────────────────────────────────────────────────────

const CATEGORIES = ["mixed", "mcq", "coding"] as const;
const DIFFICULTIES = ["easy", "medium", "hard"];
const categoryLabel = (c: string) =>
  c === "mcq" ? "MCQ" : c === "coding" ? "Coding" : "Mixed";
const categoryColor = (c: string) =>
  c === "mcq" ? "bg-blue-100 text-blue-700" :
  c === "coding" ? "bg-purple-100 text-purple-700" :
  "bg-green-100 text-green-700";
const diffColor = (d: string) =>
  d === "easy" ? "text-green-600" : d === "medium" ? "text-yellow-600" : "text-red-600";

// ── Modal helper ──────────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto flex-1 p-4">{children}</div>
      </div>
    </div>
  );
}

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
    if (!form.name.trim()) { setError("Name is required"); return; }
    setSaving(true);
    try { await onSave(form); } catch (err: unknown) { setError((err as Error).message); }
    finally { setSaving(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <p className="text-sm text-red-600 bg-red-50 p-2 rounded">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Folder Name *</label>
        <input value={form.name} onChange={e => set("name", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="e.g. Arrays & Hashing" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
        <select value={form.category} onChange={e => set("category", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400">
          {CATEGORIES.map(c => <option key={c} value={c}>{categoryLabel(c)}</option>)}
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={form.description} onChange={e => set("description", e.target.value)} rows={2}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="What will students practise here?" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Topic Tags</label>
        <input value={form.tags} onChange={e => set("tags", e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="Arrays, Sorting, DP (comma-separated)" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
        <input type="number" value={form.ord} onChange={e => set("ord", e.target.value)} min={0}
          className="w-24 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border text-gray-600 hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={saving}
          className="px-4 py-2 text-sm rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}

// ── Question slot row (inside module) ─────────────────────────────────────────

function SlotRow({ slot, onRemove, onUpdate }: {
  slot: ModuleQuestionSlot;
  onRemove: () => void;
  onUpdate: (marks: number, maxAttempts: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [marks, setMarks] = useState(String(slot.marks));
  const [attempts, setAttempts] = useState(String(slot.max_attempts));
  const q = slot.question;

  const save = () => {
    onUpdate(Number(marks), Number(attempts));
    setEditing(false);
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-white border rounded-lg group hover:border-indigo-300 transition-colors">
      <GripVertical size={16} className="text-gray-300 mt-1 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {q?.type === "coding"
            ? <Code2 size={14} className="text-purple-500 shrink-0" />
            : <BookOpen size={14} className="text-blue-500 shrink-0" />}
          <span className="text-sm font-medium text-gray-800 truncate">
            {q?.title || q?.body || slot.question_id}
          </span>
          {q?.difficulty && (
            <span className={`text-xs font-medium ${diffColor(q.difficulty)}`}>{q.difficulty}</span>
          )}
          {q?.topic && <span className="text-xs text-gray-400">{q.topic}</span>}
        </div>
        {editing ? (
          <div className="flex items-center gap-3 mt-2 flex-wrap">
            <label className="text-xs text-gray-500 flex items-center gap-1">
              Marks
              <input type="number" value={marks} onChange={e => setMarks(e.target.value)} min={0}
                className="w-16 ml-1 border rounded px-2 py-0.5 text-xs" />
              <span className="text-gray-400">(0=inherit)</span>
            </label>
            <label className="text-xs text-gray-500 flex items-center gap-1">
              Max Attempts
              <input type="number" value={attempts} onChange={e => setAttempts(e.target.value)} min={0}
                className="w-16 ml-1 border rounded px-2 py-0.5 text-xs" />
              <span className="text-gray-400">(0=unlimited)</span>
            </label>
            <button onClick={save} className="text-green-600 hover:text-green-700"><Check size={14} /></button>
            <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600"><X size={14} /></button>
          </div>
        ) : (
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span>Marks: <b className="text-gray-600">{slot.marks || q?.marks || "—"}</b></span>
            <span>Attempts: <b className="text-gray-600">{slot.max_attempts > 0 ? slot.max_attempts : "∞"}</b></span>
            <button onClick={() => setEditing(true)} className="text-indigo-400 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
              <Pencil size={12} />
            </button>
          </div>
        )}
      </div>
      <button onClick={onRemove} className="text-red-300 hover:text-red-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1">
        <Trash2 size={14} />
      </button>
    </div>
  );
}

// ── Add questions picker ──────────────────────────────────────────────────────

function AddQuestionsModal({ moduleId, token, existingIds, onDone, onClose }: {
  moduleId: string; token: string; existingIds: Set<string>;
  onDone: () => void; onClose: () => void;
}) {
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "mcq" | "coding">("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    listQuestions(token).then(setAllQuestions).catch(() => {});
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

  return (
    <Modal title={`Add Questions (${selected.size} selected)`} onClose={onClose}>
      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}
      <div className="flex gap-2 mb-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by title or topic…"
          className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
        <select value={filter} onChange={e => setFilter(e.target.value as "all" | "mcq" | "coding")}
          className="border rounded-lg px-2 py-2 text-sm">
          <option value="all">All</option>
          <option value="mcq">MCQ</option>
          <option value="coding">Coding</option>
        </select>
      </div>
      <div className="space-y-1 max-h-72 overflow-y-auto">
        {visible.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-8">No questions found</p>
        )}
        {visible.map(q => {
          const label = q.programming?.title ?? q.mcq?.body ?? q.id;
          const isSelected = selected.has(q.id);
          return (
            <button key={q.id} onClick={() => toggle(q.id)}
              className={`w-full text-left flex items-center gap-3 p-2 rounded-lg border transition-colors
                ${isSelected ? "border-indigo-400 bg-indigo-50" : "border-gray-100 hover:border-gray-300"}`}>
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0
                ${isSelected ? "border-indigo-600 bg-indigo-600" : "border-gray-300"}`}>
                {isSelected && <Check size={10} className="text-white" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 truncate">{label}</p>
                <p className="text-xs text-gray-400">{q.type} · {q.topic ?? "—"} · {q.difficulty} · {q.marks}m</p>
              </div>
            </button>
          );
        })}
      </div>
      <div className="flex justify-end gap-2 pt-3 border-t mt-3">
        <button onClick={onClose} className="px-4 py-2 text-sm border rounded-lg text-gray-600 hover:bg-gray-50">Cancel</button>
        <button onClick={confirm} disabled={selected.size === 0 || adding}
          className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
          {adding ? "Adding…" : `Add ${selected.size > 0 ? selected.size : ""} Question${selected.size !== 1 ? "s" : ""}`}
        </button>
      </div>
    </Modal>
  );
}

// ── Module row (expandable) ───────────────────────────────────────────────────

function ModuleRow({ mod, token, onRefresh }: {
  mod: PracticeModule; token: string; onRefresh: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [slots, setSlots] = useState<ModuleQuestionSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

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
    try {
      await updatePracticeModule(token, mod.id, { is_published: !mod.is_published });
      onRefresh();
    } catch { alert("Failed to update"); }
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

  return (
    <div className="border rounded-xl overflow-hidden">
      {/* Header row */}
      <div className="flex items-center gap-3 p-4 bg-white hover:bg-gray-50 cursor-pointer" onClick={toggle}>
        <span className="text-gray-400">{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
        <span className="text-gray-500">{open ? <FolderOpen size={18} /> : <Folder size={18} />}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-gray-900 text-sm">{mod.name}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${categoryColor(mod.category)}`}>
              {categoryLabel(mod.category)}
            </span>
            {mod.tags && mod.tags.split(",").slice(0, 3).map(t => (
              <span key={t} className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t.trim()}</span>
            ))}
            {!mod.is_published && (
              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Draft</span>
            )}
          </div>
          {mod.description && <p className="text-xs text-gray-400 mt-0.5 truncate">{mod.description}</p>}
        </div>
        {/* Actions (stop propagation so they don't toggle) */}
        <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
          <button onClick={handlePublishToggle} title={mod.is_published ? "Unpublish" : "Publish"}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            {mod.is_published ? <Eye size={15} /> : <EyeOff size={15} />}
          </button>
          <button onClick={() => setShowEdit(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600">
            <Pencil size={15} />
          </button>
          <button onClick={handleDelete}
            className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      {open && (
        <div className="border-t bg-gray-50 p-4 space-y-2">
          {loadingSlots && <p className="text-sm text-gray-400 text-center py-4">Loading…</p>}
          {!loadingSlots && slots.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No questions yet. Add some below.</p>
          )}
          {slots.map(slot => (
            <SlotRow key={slot.id} slot={slot}
              onRemove={() => handleSlotRemove(slot)}
              onUpdate={(m, a) => handleSlotUpdate(slot, m, a)} />
          ))}
          <button onClick={() => setShowAdd(true)}
            className="w-full flex items-center justify-center gap-2 p-2 border-2 border-dashed border-indigo-200
              text-indigo-500 hover:border-indigo-400 hover:text-indigo-600 rounded-lg text-sm transition-colors">
            <Plus size={14} /> Add Questions
          </button>
        </div>
      )}

      {showEdit && (
        <Modal title="Edit Folder" onClose={() => setShowEdit(false)}>
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
    setLoading(true);
    try { setModules(await listPracticeModules(token)); }
    catch { setError("Failed to load practice folders"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { if (token) load(); }, [load, token]);

  const handleCreate = async (d: ModuleFormData) => {
    await createPracticeModule(token, { ...d, ord: Number(d.ord) });
    setShowCreate(false);
    load();
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Practice Folders</h1>
          <p className="text-sm text-gray-500 mt-1">
            Organise MCQ and coding questions into topic folders for student practice.
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg
            hover:bg-indigo-700 text-sm font-medium">
          <Plus size={16} /> New Folder
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Folders", value: modules.length },
          { label: "Published", value: modules.filter(m => m.is_published).length },
          { label: "Draft", value: modules.filter(m => !m.is_published).length },
        ].map(s => (
          <div key={s.label} className="bg-white border rounded-xl p-4">
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

      {/* Module list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      ) : modules.length === 0 ? (
        <div className="text-center py-16 bg-white border rounded-xl">
          <FolderOpen size={40} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No practice folders yet</p>
          <p className="text-sm text-gray-400 mt-1">Create a folder to start organising questions for students.</p>
          <button onClick={() => setShowCreate(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700">
            Create First Folder
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map(mod => (
            <ModuleRow key={mod.id} mod={mod} token={token} onRefresh={load} />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <Modal title="New Practice Folder" onClose={() => setShowCreate(false)}>
          <ModuleForm onSave={handleCreate} onCancel={() => setShowCreate(false)} />
        </Modal>
      )}
    </div>
  );
}

