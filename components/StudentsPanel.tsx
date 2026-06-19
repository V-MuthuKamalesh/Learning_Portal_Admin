"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Search, Upload } from "lucide-react";
import { PageHeader } from "./PageHeader";
import { Modal } from "./Modal";
import { bulkImportStudents, createStudent, downloadImportTemplate, listStudents, Student } from "../lib/api";
import { getSession } from "../lib/auth";

export function StudentsPanel() {
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const token = getSession()?.access_token;

  const loadStudents = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const { data } = await listStudents(token, search || undefined);
      setStudents(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load students");
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  async function addStudent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const created = await createStudent(token, {
        name: String(data.get("name")),
        register_number: String(data.get("register_number")),
        email: String(data.get("email")),
        year: String(data.get("year") || ""),
        section: String(data.get("section") || "")
      });
      setStudents((current) => [created, ...current]);
      event.currentTarget.reset();
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add student");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBulkImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !token) return;
    setSubmitting(true);
    setError("");
    try {
      const result = await bulkImportStudents(token, file);
      await loadStudents();
      if (result.failed > 0) {
        setError(`Imported ${result.created}, failed ${result.failed}. ${result.errors?.slice(0, 2).join(" ") || ""}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bulk import failed");
    } finally {
      setSubmitting(false);
      event.target.value = "";
    }
  }

  async function handleDownloadTemplate() {
    if (!token) return;
    try {
      const blob = await downloadImportTemplate(token);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "students-import-template.csv";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not download template");
    }
  }

  const filteredStudents = useMemo(() => {
    const needle = search.toLowerCase();
    return students.filter((student) =>
      [student.name, student.register_number, student.email].some((value) => value.toLowerCase().includes(needle))
    );
  }, [students, search]);

  return (
    <>
      <PageHeader
        title="Students"
        note="Create, import, activate and manage student accounts"
        actionLabel="Add student"
        onAction={() => setModalOpen(true)}
      />

      <label className="pageSearch">
        <Search size={16} />
        <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, register or email…" />
      </label>

      {error && <p className="error">{error}</p>}

      <section className="gridTwo">
        <div className="panel formPanel">
          <h2>Quick actions</h2>
          <p className="emptyState">Use the header button to add a student, or import many at once from CSV.</p>
          <button className="primary" type="button" onClick={() => setModalOpen(true)}>
            <Plus size={17} /> Add student
          </button>
          <button className="secondary" type="button" onClick={() => fileInputRef.current?.click()} disabled={submitting}>
            <Upload size={17} /> Bulk import
          </button>
          <button className="secondary" type="button" onClick={handleDownloadTemplate}>
            Download CSV template
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" hidden onChange={handleBulkImport} />
        </div>

        <div className="panel tablePanel">
          <h2>Student Directory {loading ? "(loading…)" : `(${filteredStudents.length})`}</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Register</th>
                <th>Year</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>
                    <strong>{student.name}</strong>
                    <small>{student.email}</small>
                  </td>
                  <td>{student.register_number}</td>
                  <td>
                    {student.year || "-"} {student.section || ""}
                  </td>
                  <td>
                    <span className={student.is_active ? "ok" : "muted"}>{student.is_active ? "Active" : "Inactive"}</span>
                  </td>
                </tr>
              ))}
              {!loading && filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={4} className="emptyState">
                    No students yet. Click &quot;Add student&quot; to create one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <Modal open={modalOpen} title="Add student" onClose={() => setModalOpen(false)}>
        <form onSubmit={addStudent}>
          <input name="name" placeholder="Name" required />
          <input name="register_number" placeholder="Register number" required />
          <input name="email" type="email" placeholder="Email" required />
          <div className="inline">
            <input name="year" placeholder="Year" />
            <input name="section" placeholder="Section" />
          </div>
          <p className="emptyState">Initial password defaults to the register number.</p>
          <div className="modalActions">
            <button className="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Add student"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
