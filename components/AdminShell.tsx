"use client";

import { Bell, Building2, LogOut, Moon, Search, Sun } from "lucide-react";
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
  const { theme, toggle } = useTheme();

  useEffect(() => {
    setName(getSession()?.user.name || "Admin");
  }, []);

  function signOut() {
    clearSession();
    router.replace("/login");
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <Building2 size={28} />
          <span>Assess Admin</span>
        </div>
        <nav>
          {adminNav.map(({ label, href, icon: Icon }) => (
            <Link key={href} className={pathname === href ? "active" : ""} href={href} title={label}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <label className="search">
            <Search size={18} />
            <input placeholder="Search students, tests, reports" />
          </label>
          <button className="icon" title="Theme" onClick={toggle}>
            {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <div className="identity">{name}</div>
          <button className="icon" title="Sign out" onClick={signOut}><LogOut size={19} /></button>
        </header>
        <section className="content">{children}</section>
      </section>
    </main>
  );
}
