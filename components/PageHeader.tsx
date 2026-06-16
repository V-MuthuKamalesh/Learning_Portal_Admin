"use client";

import { Plus } from "lucide-react";

type PageHeaderProps = {
  title: string;
  note?: string;
  actionLabel?: string;
  onAction?: () => void;
  hideAction?: boolean;
};

export function PageHeader({ title, note, actionLabel = "New", onAction, hideAction }: PageHeaderProps) {
  return (
    <div className="titleRow">
      <div>
        {note && <p className="eyebrow">{note}</p>}
        <h1>{title}</h1>
      </div>
      {!hideAction && onAction && (
        <button className="primary" type="button" onClick={onAction}>
          <Plus size={18} /> {actionLabel}
        </button>
      )}
    </div>
  );
}
