"use client";

import { Building2 } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { adminLogin } from "../../lib/api";
import { saveSession } from "../../lib/auth";

export default function AdminLoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const session = await adminLogin(String(data.get("email")), String(data.get("password")));
      saveSession(session);
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next || "/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    }
  }

  return (
    <main className="authPage">
      <form className="authPanel" onSubmit={handleLogin}>
        <div className="brand authBrand">
          <Building2 size={30} />
          <span>Assess Admin</span>
        </div>
        <h1>Admin Sign In</h1>
        <input name="email" type="email" defaultValue="superadmin@smv.edu" aria-label="Admin email" required />
        <input name="password" type="password" defaultValue="Admin@123" aria-label="Admin password" required />
        <button className="primary" type="submit">Sign in</button>
        {error && <span className="error">{error}</span>}
      </form>
    </main>
  );
}
