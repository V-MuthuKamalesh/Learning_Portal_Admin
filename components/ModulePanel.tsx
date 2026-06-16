"use client";

import { FormEvent, useState } from "react";
import { PageHeader } from "./PageHeader";
import { Modal } from "./Modal";

type PlaceholderItem = { id: string; name: string; detail: string };

const storageKey = (module: string) => `admin_${module.toLowerCase()}_items`;

function readItems(module: string): PlaceholderItem[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(storageKey(module));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as PlaceholderItem[];
  } catch {
    return [];
  }
}

function writeItems(module: string, items: PlaceholderItem[]) {
  localStorage.setItem(storageKey(module), JSON.stringify(items));
}

type ModulePanelProps = {
  name: string;
  note?: string;
  actionLabel?: string;
  fields?: { name: string; label: string; placeholder?: string; required?: boolean }[];
};

export function ModulePanel({
  name,
  note,
  actionLabel = "New",
  fields = [{ name: "name", label: "Name", placeholder: "Name", required: true }]
}: ModulePanelProps) {
  const [items, setItems] = useState<PlaceholderItem[]>(() => readItems(name));
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const label = String(data.get("name") || data.get(fields[0]?.name || "name") || "").trim();
    if (!label) {
      setError("Name is required");
      return;
    }
    const detail = fields
      .slice(1)
      .map((field) => `${field.label}: ${String(data.get(field.name) || "-")}`)
      .join(" · ");
    const next: PlaceholderItem = { id: crypto.randomUUID(), name: label, detail: detail || "Created locally" };
    const updated = [next, ...items];
    setItems(updated);
    writeItems(name, updated);
    event.currentTarget.reset();
    setModalOpen(false);
  }

  return (
    <>
      <PageHeader title={name} note={note} actionLabel={actionLabel} onAction={() => setModalOpen(true)} />
      {error && <p className="error">{error}</p>}
      <section className="panel tablePanel">
        <h2>{name} records ({items.length})</h2>
        {items.length === 0 ? (
          <p className="emptyState">
            No {name.toLowerCase()} records yet. Backend APIs for this module are planned — entries created here are stored locally until the API lands.
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.name}</strong>
                  </td>
                  <td>{item.detail}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Modal open={modalOpen} title={`Add ${name.toLowerCase()}`} onClose={() => setModalOpen(false)}>
        <form onSubmit={handleCreate}>
          {fields.map((field) => (
            <input
              key={field.name}
              name={field.name}
              placeholder={field.placeholder || field.label}
              required={field.required}
            />
          ))}
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
