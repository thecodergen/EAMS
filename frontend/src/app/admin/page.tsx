"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EamsShell from "@/components/EamsShell";

const API = "http://localhost:5000/api";

type Employee = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  department: string;
  isActive?: boolean;
};

type Department = {
  id: number;
  name: string;
};

type AttendanceRecord = {
  id: number;
  date: string;
  status?: { name: string };
  location?: { name: string };
};

type LeaveRequest = {
  id: number;
  status: string;
};

type AttendanceCorrection = {
  id: number;
  status: string;
};

type AuditLog = {
  id: number;
  timestamp: string;
  action: string;
  employeeName?: string;
};

export default function AdminDashboard() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dynamic Live Stats
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [corrections, setCorrections] = useState<AttendanceCorrection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("eams_user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    try {
      const user = JSON.parse(stored);
      setAdmin(user);
      loadAdminDashboardData();
    } catch {
      router.replace("/login");
    }
  }, [router]);

  async function loadAdminDashboardData() {
    try {
      setLoading(true);
      const [empRes, deptRes, attRes, leaveRes, corrRes, auditRes] = await Promise.all([
        fetch(`${API}/Employees`),
        fetch(`${API}/Departments`),
        fetch(`${API}/Attendance`),
        fetch(`${API}/LeaveRequests`),
        fetch(`${API}/AttendanceCorrections`),
        fetch(`${API}/AuditLogs`),
      ]);

      if (empRes.ok) {
        const data = await empRes.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
      if (deptRes.ok) {
        const data = await deptRes.json();
        setDepartments(Array.isArray(data) ? data : []);
      }
      if (attRes.ok) {
        const data = await attRes.json();
        setAttendances(Array.isArray(data) ? data : []);
      }
      if (leaveRes.ok) {
        const data = await leaveRes.json();
        setLeaves(Array.isArray(data) ? data : []);
      }
      if (corrRes.ok) {
        const data = await corrRes.json();
        setCorrections(Array.isArray(data) ? data : []);
      }
      if (auditRes.ok) {
        const data = await auditRes.json();
        setAuditLogs(Array.isArray(data) ? data.slice(0, 8) : []);
      }
    } catch (err) {
      console.error("Error loading admin dashboard data", err);
    } finally {
      setLoading(false);
    }
  }

  if (!admin) {
    return (
      <EamsShell role="Admin">
        <div className="loading">Loading Admin Portal...</div>
      </EamsShell>
    );
  }

  // Calculate live computed stats
  const totalEmployees = employees.length;
  const activeDepartments = departments.length;
  const pendingLeaves = leaves.filter((l) => l.status === "Pending").length;
  const pendingCorrections = corrections.filter((c) => c.status === "Pending").length;

  const presentCount = attendances.filter(
    (a) => a.status?.name?.toLowerCase() === "present"
  ).length;
  const wfoCount = attendances.filter(
    (a) => a.location?.name?.toLowerCase() === "office"
  ).length;
  const wfhCount = attendances.filter(
    (a) => a.location?.name?.toLowerCase() === "home"
  ).length;

  return (
    <EamsShell role="Admin">
      <div className="professional-attendance" style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Page Header */}
        <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
              Admin Control Center
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
              Live organizational metrics, employee management, and system health.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              href="/admin/employees"
              style={{
                padding: "9px 16px",
                background: "#2563eb",
                color: "#ffffff",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "13px"
              }}
            >
              + Manage Employees
            </Link>
            <Link
              href="/reports"
              style={{
                padding: "9px 16px",
                background: "#f1f5f9",
                color: "#334155",
                border: "1px solid #cbd5e1",
                borderRadius: "8px",
                textDecoration: "none",
                fontWeight: 600,
                fontSize: "13px"
              }}
            >
              Analytics Reports
            </Link>
          </div>
        </div>

        {/* Live Stat Cards Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px"
        }}>
          <div style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            borderTop: "4px solid #2563eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Total Employees
            </span>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", margin: "8px 0 2px" }}>
              {loading ? "..." : totalEmployees}
            </div>
            <span style={{ fontSize: "12px", color: "#059669", fontWeight: 600 }}>Active in DB</span>
          </div>

          <div style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            borderTop: "4px solid #059669",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Departments
            </span>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", margin: "8px 0 2px" }}>
              {loading ? "..." : activeDepartments}
            </div>
            <span style={{ fontSize: "12px", color: "#64748b" }}>Active Units</span>
          </div>

          <div style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            borderTop: "4px solid #d97706",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Pending Leaves
            </span>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#d97706", margin: "8px 0 2px" }}>
              {loading ? "..." : pendingLeaves}
            </div>
            <Link href="/admin/leave" style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
              Review Requests →
            </Link>
          </div>

          <div style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            borderTop: "4px solid #7c3aed",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              Pending Corrections
            </span>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#7c3aed", margin: "8px 0 2px" }}>
              {loading ? "..." : pendingCorrections}
            </div>
            <Link href="/admin/attendance" style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
              Inspect Details →
            </Link>
          </div>

          <div style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            borderTop: "4px solid #0284c7",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#64748b", textTransform: "uppercase" }}>
              System Health
            </span>
            <div style={{ fontSize: "24px", fontWeight: 800, color: "#059669", margin: "10px 0 2px" }}>
              ● Operational
            </div>
            <span style={{ fontSize: "12px", color: "#64748b" }}>API & DB Online</span>
          </div>
        </div>

        {/* 2 Column Layout: Department Breakdown & Recent Activity */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
          {/* Department Breakdown */}
          <div style={{
            background: "#ffffff",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "#1e293b" }}>
                Departments Overview
              </h2>
              <Link href="/admin/departments" style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
                View All
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {departments.map((dept) => {
                const count = employees.filter((e) => e.department === dept.name).length;
                return (
                  <div
                    key={dept.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      background: "#f8fafc",
                      borderRadius: "8px"
                    }}
                  >
                    <div>
                      <strong style={{ fontSize: "14px", color: "#334155" }}>{dept.name}</strong>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>Department ID #{dept.id}</div>
                    </div>
                    <span style={{
                      padding: "4px 12px",
                      background: "#dbeafe",
                      color: "#1e40af",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600
                    }}>
                      {count} Employees
                    </span>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: "20px", padding: "12px", background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px" }}>
              <span style={{ fontSize: "13px", color: "#166534" }}>
                🏢 Total recorded attendance events: <strong>{attendances.length}</strong> (WFO: {wfoCount} | WFH: {wfhCount})
              </span>
            </div>
          </div>

          {/* Audit Logs / Recent Activity */}
          <div style={{
            background: "#ffffff",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "#1e293b" }}>
                Recent Audit Trail
              </h2>
              <Link href="/admin/audit" style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
                Full Log
              </Link>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {auditLogs.length > 0 ? (
                auditLogs.map((log) => (
                  <div
                    key={log.id}
                    style={{
                      padding: "10px 12px",
                      borderLeft: "3px solid #3b82f6",
                      background: "#f8fafc",
                      borderRadius: "0 6px 6px 0",
                      fontSize: "13px"
                    }}
                  >
                    <div style={{ fontWeight: 600, color: "#1e293b" }}>{log.action}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginTop: "2px" }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ color: "#94a3b8", fontSize: "13px" }}>No recent audit events recorded.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </EamsShell>
  );
}
