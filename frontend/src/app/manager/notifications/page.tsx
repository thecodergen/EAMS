"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EamsShell from "@/components/EamsShell";

const API = "http://localhost:5000/api";

type Notification = {
  id: number;
  employeeId: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

function getNotifIcon(title: string) {
  const t = title?.toLowerCase() || "";
  if (t.includes("leave")) return "🗓️";
  if (t.includes("approve") || t.includes("approved")) return "✅";
  if (t.includes("reject")) return "❌";
  if (t.includes("attendance")) return "📋";
  if (t.includes("alert") || t.includes("warning")) return "⚠️";
  if (t.includes("team") || t.includes("member")) return "👥";
  if (t.includes("report")) return "📊";
  return "🔔";
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ManagerNotificationsPage() {
  const router = useRouter();
  const [managerId, setManagerId] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  useEffect(() => {
    const stored = localStorage.getItem("eams_user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    try {
      const user = JSON.parse(stored);
      setManagerId(user.id);
      loadNotifications(user.id);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  async function loadNotifications(id: number) {
    try {
      setLoading(true);
      const res = await fetch(`${API}/Notifications/employee/${id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function markAsRead(id: number) {
    try {
      await fetch(`${API}/Notifications/${id}/read`, { method: "PUT" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  }

  async function markAllAsRead() {
    if (!managerId) return;
    try {
      await fetch(`${API}/Notifications/employee/${managerId}/read-all`, { method: "PUT" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const filtered = notifications.filter(n => {
    if (filter === "unread") return !n.isRead;
    if (filter === "read") return n.isRead;
    return true;
  });

  if (!managerId) {
    return (
      <EamsShell role="Manager">
        <div className="loading">Loading...</div>
      </EamsShell>
    );
  }

  return (
    <EamsShell role="Manager">
      <div className="professional-attendance" style={{ maxWidth: "900px", margin: "0 auto", padding: "28px" }}>

        {/* HEADER */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
              🔔 Manager Notifications
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
              Team alerts, leave approvals, attendance flags, and system messages.
            </p>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              style={{
                background: "#7c3aed",
                color: "#ffffff",
                border: "none",
                padding: "9px 18px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "13px",
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(124,58,237,0.3)"
              }}
            >
              ✓ Mark All Read ({unreadCount})
            </button>
          )}
        </div>

        {/* STATS */}
        <div style={{ display: "flex", gap: "14px", marginBottom: "24px", flexWrap: "wrap" }}>
          {[
            { label: "Total Alerts", count: notifications.length, color: "#7c3aed", bg: "#f5f3ff", border: "#ddd6fe" },
            { label: "Action Required", count: unreadCount, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
            { label: "Resolved", count: notifications.length - unreadCount, color: "#059669", bg: "#f0fdf4", border: "#bbf7d0" },
          ].map((stat) => (
            <div key={stat.label} style={{
              padding: "14px 22px",
              background: stat.bg,
              border: `1px solid ${stat.border}`,
              borderRadius: "10px",
              minWidth: "130px"
            }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>
                {stat.label}
              </div>
              <div style={{ fontSize: "24px", fontWeight: 800, color: stat.color }}>
                {stat.count}
              </div>
            </div>
          ))}
        </div>

        {/* FILTER TABS */}
        <div style={{ display: "flex", gap: "6px", marginBottom: "20px" }}>
          {(["all", "unread", "read"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                background: filter === f ? "#1e293b" : "#f1f5f9",
                color: filter === f ? "#ffffff" : "#64748b",
                border: "1px solid",
                borderColor: filter === f ? "#1e293b" : "#e2e8f0",
                borderRadius: "8px",
                padding: "6px 16px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                textTransform: "capitalize"
              }}
            >
              {f === "all" ? `All (${notifications.length})` : f === "unread" ? `Unread (${unreadCount})` : `Read (${notifications.length - unreadCount})`}
            </button>
          ))}
        </div>

        {/* NOTIFICATIONS */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px", color: "#64748b" }}>
            <div style={{ fontSize: "32px", marginBottom: "12px" }}>⏳</div>
            Loading notifications...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "60px 20px",
            background: "#ffffff",
            borderRadius: "16px",
            border: "1px solid #e2e8f0"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>🎉</div>
            <h3 style={{ margin: "0 0 8px", fontSize: "18px", fontWeight: 700, color: "#1e293b" }}>
              {filter === "unread" ? "All Clear!" : "No Notifications"}
            </h3>
            <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>
              {filter === "unread" ? "No pending items requiring your attention." : "Team notifications will appear here."}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filtered.map((n) => (
              <div
                key={n.id}
                style={{
                  background: n.isRead ? "#ffffff" : "#faf5ff",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  border: `1px solid ${n.isRead ? "#e2e8f0" : "#ddd6fe"}`,
                  borderLeft: `4px solid ${n.isRead ? "#e2e8f0" : "#7c3aed"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "16px",
                  boxShadow: n.isRead ? "none" : "0 2px 8px rgba(124,58,237,0.07)",
                }}
              >
                <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", flex: 1 }}>
                  <div style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: n.isRead ? "#f1f5f9" : "#ede9fe",
                    display: "grid",
                    placeItems: "center",
                    fontSize: "20px",
                    flexShrink: 0
                  }}>
                    {getNotifIcon(n.title)}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px", flexWrap: "wrap" }}>
                      <h3 style={{
                        margin: 0,
                        fontSize: "14px",
                        fontWeight: n.isRead ? 600 : 800,
                        color: n.isRead ? "#334155" : "#1e293b"
                      }}>
                        {n.title}
                      </h3>
                      {!n.isRead && (
                        <span style={{
                          background: "#7c3aed",
                          color: "#ffffff",
                          borderRadius: "99px",
                          padding: "1px 8px",
                          fontSize: "10px",
                          fontWeight: 700
                        }}>
                          NEW
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "0 0 6px 0", color: "#64748b", fontSize: "13px", lineHeight: 1.5 }}>
                      {n.message}
                    </p>
                    <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 500 }}>
                      🕐 {timeAgo(n.createdAt)}
                    </span>
                  </div>
                </div>

                {!n.isRead && (
                  <button
                    onClick={() => markAsRead(n.id)}
                    style={{
                      background: "#f5f3ff",
                      color: "#7c3aed",
                      border: "1px solid #ddd6fe",
                      borderRadius: "8px",
                      padding: "6px 12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      cursor: "pointer",
                      flexShrink: 0
                    }}
                  >
                    Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </EamsShell>
  );
}
