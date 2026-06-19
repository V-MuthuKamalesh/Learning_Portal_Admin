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
        <h1>{title}</h1>
        {note && <p className="pageSubtitle">{note}</p>}
      </div>
      {!hideAction && onAction && (
        <button className="primary" type="button" onClick={onAction}>
          <Plus size={18} /> {actionLabel}
        </button>
      )}
    </div>
  );
}
