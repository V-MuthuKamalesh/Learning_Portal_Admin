"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { PageHeader } from "./PageHeader";
import { Modal } from "./Modal";
import { AdminUser, createAdmin, listAdmins, listRoles, Role } from "../lib/api";
import { getSession } from "../lib/auth";

export function AdminsPanel() {
  const token = getSession()?.access_token;
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!token) return;
    try {
      const [a, r] = await Promise.all([listAdmins(token), listRoles(token)]);
      setAdmins(a);
      setRoles(r.filter((role) => role.slug !== "super-admin"));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load admins");
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token) return;
    const data = new FormData(event.currentTarget);
    try {
      const created = await createAdmin(token, {
        name: String(data.get("name")),
        email: String(data.get("email")),
        password: String(data.get("password")),
        role_id: String(data.get("role_id")),
        phone: String(data.get("phone") || "")
      });
      setAdmins((c) => [created, ...c]);
      setModalOpen(false);
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create admin");
    }
  }

  return (
    <>
      <PageHeader title="Admins" note="Manage faculty and department administrators" actionLabel="Add admin" onAction={() => setModalOpen(true)} />
      {error && <p className="error">{error}</p>}
      <section className="panel tablePanel">
        <h2>Administrators ({admins.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {admins.map((admin) => (
              <tr key={admin.id}>
                <td><strong>{admin.name}</strong></td>
                <td><small style={{ color: "var(--muted)" }}>{admin.email}</small></td>
                <td>{admin.role?.name || "—"}</td>
                <td>
                  <span className={admin.is_active ? "ok" : "muted"}>
                    {admin.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <Modal open={modalOpen} title="Add admin" onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate}>
          <input name="name" placeholder="Name" required />
          <input name="email" type="email" placeholder="Email" required />
          <input name="password" type="password" placeholder="Password" required />
          <input name="phone" placeholder="Phone" />
          <select name="role_id" required defaultValue="">
            <option value="" disabled>
              Select role
            </option>
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <div className="modalActions">
            <button className="secondary" type="button" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button className="primary" type="submit">
              Create
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
