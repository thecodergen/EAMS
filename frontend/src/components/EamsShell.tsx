"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { getUser, logout, UserRole } from "@/lib/auth";
import { useTheme } from "@/lib/theme";

type MenuItem = {
  label: string;
  href: string;
  icon: string;
};

type Props = {
  children: ReactNode;
  role: UserRole;
};

export default function EamsShell({
  children,
  role,
}: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  // IMPORTANT:
  // Do not call getUser() during the initial render.
  // This prevents the hydration mismatch.
  const [user, setUser] = useState<
    ReturnType<typeof getUser>
  >(null);

  const [mounted, setMounted] = useState(false);

  // Load logged-in user only after the browser mounts
  useEffect(() => {
    setMounted(true);

    const currentUser = getUser();

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    setUser(currentUser);
  }, [router]);

  // Same HTML on server and first client render
  if (!mounted) {
    return (
      <div className="loading">
        Loading EAMS...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="loading">
        Please login...
      </div>
    );
  }

  // ============================================================
  // EMPLOYEE MENU
  // ============================================================

  const employeeMenu: MenuItem[] = [
    {
      label: "Dashboard",
      href: "/employee",
      icon: "⌂",
    },
    {
      label: "Attendance",
      href: "/employee/attendance",
      icon: "▣",
    },
    {
      label: "Schedule Settings",
      href: "/employee/schedule",
      icon: "⚙",
    },
    {
      label: "Leave Management",
      href: "/employee/leave",
      icon: "▤",
    },
    {
      label: "Reports & Analytics",
      href: "/employee/reports",
      icon: "▥",
    },
    {
      label: "Notifications",
      href: "/employee/notifications",
      icon: "♧",
    },
    {
      label: "Profile",
      href: "/employee/profile",
      icon: "◉",
    },
  ];

  // ============================================================
  // MANAGER MENU
  // ============================================================

  const managerMenu: MenuItem[] = [
    {
      label: "Dashboard",
      href: "/manager",
      icon: "⌂",
    },
    {
      label: "Team Attendance",
      href: "/manager/attendance",
      icon: "▣",
    },
    {
      label: "Team Members",
      href: "/manager/team",
      icon: "♙",
    },
    {
      label: "Leave Requests",
      href: "/manager/leave",
      icon: "▤",
    },
    {
      label: "Reports & Analytics",
      href: "/manager/reports",
      icon: "▥",
    },
    {
      label: "Team Performance",
      href: "/manager/team-performance",
      icon: "📊",
    },
    {
      label: "Notifications",
      href: "/manager/notifications",
      icon: "♧",
    },
    {
      label: "Profile",
      href: "/manager/profile",
      icon: "◉",
    },
  ];

  // ============================================================
  // ADMIN MENU
  // ============================================================

  const adminMenu: MenuItem[] = [
    {
      label: "Dashboard",
      href: "/admin",
      icon: "⌂",
    },
    {
      label: "Employees",
      href: "/admin/employees",
      icon: "♙",
    },
    {
      label: "Attendance",
      href: "/admin/attendance",
      icon: "▣",
    },
    {
      label: "Leave Requests",
      href: "/admin/leave",
      icon: "▤",
    },
    {
      label: "Departments",
      href: "/admin/departments",
      icon: "▦",
    },
    {
      label: "Reports & Analytics",
      href: "/admin/reports",
      icon: "▥",
    },
    {
      label: "Audit Logs",
      href: "/admin/audit",
      icon: "◫",
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: "⚙",
    },
  ];

  // ============================================================
  // SELECT MENU BASED ON ROLE
  // ============================================================

  const menu =
    role === "Admin"
      ? adminMenu
      : role === "Manager"
      ? managerMenu
      : employeeMenu;

  const roleTitle =
    role === "Admin"
      ? "Admin Portal"
      : role === "Manager"
      ? "Manager Portal"
      : "Employee Portal";

  // ============================================================
  // USER INITIAL
  // ============================================================

  const initials =
    user.fullName?.charAt(0)?.toUpperCase() || "U";

  // ============================================================
  // LOGOUT
  // ============================================================

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="eams-layout">

      {/* ======================================================
          SIDEBAR
      ======================================================= */}

      <aside className="eams-sidebar">

        {/* LOGO */}

        <div className="sidebar-logo">

          <div className="logo-icon">
            ▣
          </div>

          <div>
            <div className="logo-title">
              EAMS
            </div>

            <div className="logo-subtitle">
              Attendance Management
            </div>
          </div>

        </div>

        {/* ROLE */}

        <div className="sidebar-role">
          {roleTitle}
        </div>

        {/* NAVIGATION */}

        <nav className="sidebar-nav">

          {menu.map((item) => {

            const active =
              pathname === item.href ||
              pathname.startsWith(
                item.href + "/"
              );

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-link ${
                  active ? "active" : ""
                }`}
              >

                <span className="sidebar-icon">
                  {item.icon}
                </span>

                <span>
                  {item.label}
                </span>

              </Link>
            );
          })}

        </nav>

        {/* SIDEBAR USER */}

        <div className="sidebar-bottom">

          <div className="user-mini">

            <div className="avatar" style={{ overflow: "hidden", display: "grid", placeItems: "center" }}>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                />
              ) : (
                initials
              )}
            </div>

            <div className="user-mini-info">

              <strong>
                {user.fullName}
              </strong>

              <span>
                {user.department || role}
              </span>

            </div>

          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </aside>

      {/* ======================================================
          MAIN CONTENT
      ======================================================= */}

      <div className="eams-main">

        {/* TOP BAR */}

        <header className="topbar">

          <div>
            <strong>
              EAMS Portal
            </strong>
          </div>

          <div className="topbar-user" style={{ display: "flex", alignItems: "center", gap: "12px" }}>

            {/* Quick Theme Switcher Pill */}
            <select
              value={theme}
              onChange={(e) => setTheme(e.target.value as any)}
              title="Change Theme"
              style={{
                background: "var(--eams-card, #ffffff)",
                color: "var(--eams-text, #1e293b)",
                border: "1px solid var(--eams-border, #e2e8f0)",
                borderRadius: "8px",
                padding: "5px 8px",
                fontSize: "12px",
                fontWeight: 600,
                cursor: "pointer",
                outline: "none"
              }}
            >
              <option value="light">☀️ Light</option>
              <option value="dark">🌙 Dark</option>
              <option value="ocean">🌊 Ocean</option>
              <option value="sunset">🌅 Sunset</option>
              <option value="forest">🌿 Forest</option>
              <option value="galaxy">🪐 Galaxy</option>
            </select>

            <div className="topbar-avatar" style={{ overflow: "hidden", display: "grid", placeItems: "center" }}>
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.fullName}
                  style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }}
                />
              ) : (
                initials
              )}
            </div>

            <div>

              <strong>
                {user.fullName}
              </strong>

              <span>
                {user.email}
              </span>

            </div>

            <button
              onClick={handleLogout}
              className="top-logout"
            >
              Logout
            </button>

          </div>

        </header>

        {/* PAGE CONTENT */}

        <main className="eams-content">
          {children}
        </main>

      </div>

    </div>
  );
}