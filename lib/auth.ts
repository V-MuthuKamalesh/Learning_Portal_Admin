"use client";

import { AuthSession } from "./api";

const KEY = "admin_session";

export function saveSession(session: AuthSession) {
  localStorage.setItem(KEY, JSON.stringify(session));
}

export function getSession(): AuthSession | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    localStorage.removeItem(KEY);
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(KEY);
}
