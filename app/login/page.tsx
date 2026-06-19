"use client";

import { Building2, Lock, Mail } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "../../lib/api";
import { saveSession } from "../../lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const data = new FormData(event.currentTarget);
    try {
      const session = await adminLogin(String(data.get("email")), String(data.get("password")));
      saveSession(session);
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next || "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="authPage">
      <form className="authPanel" onSubmit={handleLogin}>
        <div className="authBrand">
          <Building2 size={28} />
          <span>Assess Admin</span>
        </div>

        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 4 }}>
            Welcome back
          </h1>
          <p style={{ color: "var(--muted)", fontSize: 14 }}>Sign in to your admin account</p>
        </div>

        <div style={{ display: "grid", gap: 10, marginTop: 4 }}>
          <div style={{ position: "relative" }}>
            <Mail
              size={16}
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }}
            />
            <input
              name="email"
              type="email"
              defaultValue="superadmin@smv.edu"
              aria-label="Admin email"
              placeholder="Email address"
              required
              style={{ paddingLeft: 40 }}
            />
          </div>
          <div style={{ position: "relative" }}>
            <Lock
              size={16}
              style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--muted)", pointerEvents: "none" }}
            />
            <input
              name="password"
              type="password"
              defaultValue="Admin@123"
              aria-label="Admin password"
              placeholder="Password"
              required
              style={{ paddingLeft: 40 }}
            />
          </div>
        </div>

        <button className="primary" type="submit" disabled={loading} style={{ width: "100%", height: 44, marginTop: 4, fontSize: 15 }}>
          {loading ? "Signing in…" : "Sign in"}
        </button>

        {error && <span className="error">{error}</span>}
      </form>
    </main>
  );
}
