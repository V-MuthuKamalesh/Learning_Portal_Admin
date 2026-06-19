"use client";

import { Bell, Building2, LogOut, Menu, Moon, Search, Sun, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { adminNav } from "../lib/data";
import { clearSession, getSession } from "../lib/auth";
import { useTheme } from "../lib/theme";

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [name, setName] = useState("Admin");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggle } = useTheme();

  useEffect(() => {
    setName(getSession()?.user.name || "Admin");
  }, []);

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false); }, [pathname]);

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <main className="shell">
      {/* Sidebar overlay */}
      <div
        className={`sidebarOverlay${sidebarOpen ? " open" : ""}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <div className="brand">
          <Building2 size={24} />
          <span>Assess Admin</span>
        </div>
        <nav>
          {adminNav.map(({ label, href, icon: Icon }) => (
            <Link
              key={href}
              className={pathname === href ? "active" : ""}
              href={href}
              title={label}
              onClick={() => setSidebarOpen(false)}
            >
              <Icon size={17} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebarFooter">
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              minHeight: 40,
              border: 0,
              borderRadius: 8,
              background: "transparent",
              color: "#8b949e",
              padding: "0 12px",
              cursor: "pointer",
              fontSize: 13.5,
              fontWeight: 500,
              transition: "background 0.15s, color 0.15s",
            }}
            onClick={signOut}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
              (e.currentTarget as HTMLButtonElement).style.color = "#e6edf3";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              (e.currentTarget as HTMLButtonElement).style.color = "#8b949e";
            }}
          >
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      {/* Main workspace */}
      <section className="workspace">
        <header className="topbar">
          <button
            className="menuBtn"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <label className="search">
            <Search size={16} style={{ flexShrink: 0, color: "var(--muted)" }} />
            <input placeholder="Search students, tests, reports…" />
          </label>

          <div className="topbarSpacer" />

          <div className="topbarActions">
            <button className="icon" title="Toggle theme" onClick={toggle} aria-label="Toggle theme">
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="identity">
              <div className="avatar">{initials}</div>
              <span>{name}</span>
            </div>

            <button className="icon" title="Sign out" onClick={signOut} aria-label="Sign out">
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <section className="content">{children}</section>
      </section>
    </main>
  );
}
