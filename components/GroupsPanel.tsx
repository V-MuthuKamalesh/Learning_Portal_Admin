"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { PageHeader } from "./PageHeader";
import { Modal } from "./Modal";
import {
  addGroupMembers,
  createGroup,
  Group,
  listGroupMembers,
  listGroups,
  listStudents,
  removeGroupMember,
  Student
} from "../lib/api";
import { getSession } from "../lib/auth";

export function GroupsPanel() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Student[]>([]);
  const [allStudents, setAllStudents] = useState<Student[]>([]);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const token = getSession()?.access_token;

  const loadGroups = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setGroups(await listGroups(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load groups");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadGroups();
  }, [loadGroups]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const created = await createGroup(token, {
        name: String(data.get("name")),
        description: String(data.get("description") || ""),
        type: String(data.get("type") || "custom")
      });
      setGroups((current) => [created, ...current]);
      event.currentTarget.reset();
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create group");
    } finally {
      setSubmitting(false);
    }
  }

  async function openMembers(group: Group) {
    if (!token) return;
    setActiveGroup(group);
    setMembersOpen(true);
    setError("");
    setSelectedStudents([]);
    try {
      const [memberRows, studentRows] = await Promise.all([
        listGroupMembers(token, group.id),
        listStudents(token).then((r) => r.data)
      ]);
      setMembers(memberRows);
      setAllStudents(studentRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load members");
    }
  }

  async function handleAddMembers() {
    if (!token || !activeGroup || selectedStudents.length === 0) return;
    setSubmitting(true);
    setError("");
    try {
      await addGroupMembers(token, activeGroup.id, selectedStudents);
      const memberRows = await listGroupMembers(token, activeGroup.id);
      setMembers(memberRows);
      setSelectedStudents([]);
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not add members");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemoveMember(studentId: string) {
    if (!token || !activeGroup) return;
    setSubmitting(true);
    setError("");
    try {
      await removeGroupMember(token, activeGroup.id, studentId);
      setMembers((current) => current.filter((s) => s.id !== studentId));
      await loadGroups();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not remove member");
    } finally {
      setSubmitting(false);
    }
  }

  const memberIds = new Set(members.map((m) => m.id));
  const availableStudents = allStudents.filter((s) => !memberIds.has(s.id));

  return (
    <>
      <PageHeader title="Groups" note="Organize students into cohorts" actionLabel="Add group" onAction={() => setModalOpen(true)} />
      {error && <p className="error">{error}</p>}
      <section className="panel tablePanel">
        <h2>Groups {loading ? "(loading…)" : `(${groups.length})`}</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Members</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => (
              <tr key={group.id}>
                <td>
                  <strong>{group.name}</strong>
                  {group.description && <small>{group.description}</small>}
                </td>
                <td>{group.type || "custom"}</td>
                <td>{group.member_count ?? 0}</td>
                <td>
                  <button className="secondary compact" type="button" onClick={() => openMembers(group)}>
                    Manage students
                  </button>
                </td>
              </tr>
            ))}
            {!loading && groups.length === 0 && (
              <tr>
                <td colSpan={4} className="emptyState">
                  No groups yet. Click &quot;Add group&quot; to create one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      <Modal open={modalOpen} title="Add group" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate}>
          <input name="name" placeholder="Group name" required />
          <input name="type" placeholder="Type (e.g. placement, class)" />
          <textarea name="description" placeholder="Description" />
          <div className="modalActions">
            <button className="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="primary" type="submit" disabled={submitting}>
              {submitting ? "Saving…" : "Create group"}
            </button>
          </div>
        </form>
      </Modal>

      <Modal open={membersOpen} title={activeGroup ? `Students in ${activeGroup.name}` : "Group members"} onClose={() => setMembersOpen(false)}>
        <div className="memberPicker">
          <h3>Current members ({members.length})</h3>
          <ul className="memberList">
            {members.map((student) => (
              <li key={student.id}>
                <span>
                  <strong>{student.name}</strong> — {student.register_number}
                </span>
                <button className="secondary compact" type="button" disabled={submitting} onClick={() => handleRemoveMember(student.id)}>
                  Remove
                </button>
              </li>
            ))}
            {members.length === 0 && <li className="emptyState">No students in this group yet.</li>}
          </ul>

          <h3>Add students</h3>
          <div className="checkboxGrid">
            {availableStudents.map((student) => (
              <label key={student.id}>
                <input
                  type="checkbox"
                  checked={selectedStudents.includes(student.id)}
                  onChange={(e) => {
                    setSelectedStudents((current) =>
                      e.target.checked ? [...current, student.id] : current.filter((id) => id !== student.id)
                    );
                  }}
                />
                {student.name} ({student.register_number})
              </label>
            ))}
            {availableStudents.length === 0 && <p className="emptyState">All students are already in this group.</p>}
          </div>
          <div className="modalActions">
            <button className="secondary" type="button" onClick={() => setMembersOpen(false)}>
              Close
            </button>
            <button className="primary" type="button" disabled={submitting || selectedStudents.length === 0} onClick={handleAddMembers}>
              {submitting ? "Adding…" : `Add ${selectedStudents.length} student(s)`}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
