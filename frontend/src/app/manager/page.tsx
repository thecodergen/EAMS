"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import EamsShell from "@/components/EamsShell";

const API = "http://localhost:5000/api";

type TeamMember = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  department?: string;
};

type LeaveRequest = {
  id: number;
  employeeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
  employee?: { fullName: string };
};

type AttendanceCorrection = {
  id: number;
  employeeId: number;
  employeeName?: string;
  date: string;
  reason: string;
  status: string;
};

type AttendanceRecord = {
  id: number;
  employeeId: number;
  date: string;
  status?: { name: string };
  location?: { name: string };
};

export default function ManagerDashboard() {
  const router = useRouter();
  const [manager, setManager] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLeaves, setTeamLeaves] = useState<LeaveRequest[]>([]);
  const [teamCorrections, setTeamCorrections] = useState<AttendanceCorrection[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("eams_user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    try {
      const user = JSON.parse(stored);
      setManager(user);
      loadManagerDashboard(user.id);
    } catch {
      router.replace("/login");
    }
  }, [router]);

  async function loadManagerDashboard(managerId: number) {
    try {
      setLoading(true);
      const [teamRes, leavesRes, corrRes, attRes] = await Promise.all([
        fetch(`${API}/employees/manager/${managerId}/team`),
        fetch(`${API}/LeaveRequests`),
        fetch(`${API}/AttendanceCorrections/manager/${managerId}`),
        fetch(`${API}/Attendance`),
      ]);

      let members: TeamMember[] = [];
      if (teamRes.ok) {
        members = await teamRes.json();
        setTeamMembers(Array.isArray(members) ? members : []);
      }

      const teamIds = new Set(members.map((m) => m.id));

      if (leavesRes.ok) {
        const allLeaves: LeaveRequest[] = await leavesRes.json();
        // Filter leaves for this manager's team or all if manager manages everyone
        const relevantLeaves = Array.isArray(allLeaves)
          ? allLeaves.filter((l) => teamIds.has(l.employeeId) || teamIds.size === 0)
          : [];
        setTeamLeaves(relevantLeaves);
      }

      if (corrRes.ok) {
        const corrs = await corrRes.json();
        setTeamCorrections(Array.isArray(corrs) ? corrs : []);
      }

      if (attRes.ok) {
        const atts: AttendanceRecord[] = await attRes.json();
        setAttendances(Array.isArray(atts) ? atts : []);
      }
    } catch (err) {
      console.error("Error loading manager dashboard", err);
    } finally {
      setLoading(false);
    }
  }

  if (!manager) {
    return (
      <EamsShell role="Manager">
        <div className="loading">Loading Manager Portal...</div>
      </EamsShell>
    );
  }

  const teamCount = teamMembers.length;
  const pendingLeaves = teamLeaves.filter((l) => l.status === "Pending").length;
  const pendingCorrections = teamCorrections.filter((c) => c.status === "Pending").length;

  // Team attendance stats
  const teamMemberIds = new Set(teamMembers.map((m) => m.id));
  const teamAttendances = attendances.filter(
    (a) => teamMemberIds.has(a.employeeId) || (teamMemberIds.size === 0 && attendances.length > 0)
  );

  const presentCount = teamAttendances.filter(
    (a) => a.status?.name?.toLowerCase() === "present"
  ).length;

  const wfhCount = teamAttendances.filter(
    (a) => a.location?.name?.toLowerCase() === "home"
  ).length;

  const wfoCount = teamAttendances.filter(
    (a) => a.location?.name?.toLowerCase() === "office"
  ).length;

  return (
    <EamsShell role="Manager">
      <div className="professional-attendance" style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Page Header */}
        <div className="page-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 700, margin: 0, color: "#0f172a" }}>
              Manager Portal
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
              Welcome back, {manager.fullName}. Live team attendance and approvals.
            </p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              href="/manager/attendance"
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
              Team Attendance
            </Link>
            <Link
              href="/manager/leave"
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
              Leave Approvals
            </Link>
          </div>
        </div>

        {/* Live Stats Cards Grid */}
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
              Team Members
            </span>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#1e293b", margin: "8px 0 2px" }}>
              {loading ? "..." : teamCount}
            </div>
            <Link href="/manager/team" style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
              View Team Directory →
            </Link>
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
              Present Records
            </span>
            <div style={{ fontSize: "28px", fontWeight: 800, color: "#059669", margin: "8px 0 2px" }}>
              {loading ? "..." : presentCount}
            </div>
            <span style={{ fontSize: "12px", color: "#64748b" }}>WFO: {wfoCount} | WFH: {wfhCount}</span>
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
            <Link href="/manager/leave" style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
              Action Requests →
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
            <Link href="/manager/attendance" style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
              Review Requests →
            </Link>
          </div>
        </div>

        {/* 2 Column Layout: Team Members List & Pending Approval Queue */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
          {/* Team Members List */}
          <div style={{
            background: "#ffffff",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "#1e293b" }}>
                Direct Team Members
              </h2>
              <Link href="/manager/team" style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
                All Members
              </Link>
            </div>

            {teamMembers.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {teamMembers.map((member) => (
                  <div
                    key={member.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 14px",
                      background: "#f8fafc",
                      borderRadius: "8px",
                      border: "1px solid #f1f5f9"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: "#2563eb",
                        color: "#ffffff",
                        display: "grid",
                        placeItems: "center",
                        fontWeight: 700,
                        fontSize: "14px"
                      }}>
                        {member.fullName?.charAt(0) || "U"}
                      </div>
                      <div>
                        <strong style={{ fontSize: "14px", color: "#334155" }}>{member.fullName}</strong>
                        <div style={{ fontSize: "12px", color: "#64748b" }}>{member.email}</div>
                      </div>
                    </div>
                    <span style={{
                      padding: "4px 10px",
                      background: "#dbeafe",
                      color: "#1e40af",
                      borderRadius: "16px",
                      fontSize: "11px",
                      fontWeight: 600
                    }}>
                      {member.role || "Employee"}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "#64748b", fontSize: "14px" }}>
                No direct reports assigned currently.
              </div>
            )}
          </div>

          {/* Pending Approval Queue */}
          <div style={{
            background: "#ffffff",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "17px", fontWeight: 700, margin: 0, color: "#1e293b" }}>
                Pending Leave Queue
              </h2>
              <Link href="/manager/leave" style={{ fontSize: "12px", color: "#2563eb", textDecoration: "none", fontWeight: 600 }}>
                Manage All
              </Link>
            </div>

            {teamLeaves.filter((l) => l.status === "Pending").length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {teamLeaves
                  .filter((l) => l.status === "Pending")
                  .map((leave) => (
                    <div
                      key={leave.id}
                      style={{
                        padding: "14px",
                        borderLeft: "4px solid #d97706",
                        background: "#fffbeb",
                        borderRadius: "0 8px 8px 0",
                        fontSize: "13px",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                        <div>
                          <div style={{ fontWeight: 700, color: "#92400e", fontSize: "14px" }}>
                            {leave.employee?.fullName || `Employee #${leave.employeeId}`} - {leave.leaveType}
                          </div>
                          <div style={{ color: "#78350f", fontSize: "12px", marginTop: "2px", fontWeight: 500 }}>
                            📅 {leave.startDate?.slice(0, 10)} to {leave.endDate?.slice(0, 10)}
                          </div>
                          <div style={{ color: "#451a03", fontSize: "12px", marginTop: "4px", fontStyle: "italic" }}>
                            Reason: "{leave.reason || "No reason specified"}"
                          </div>
                        </div>
                      </div>
                      
                      <div style={{ display: "flex", gap: "8px", marginTop: "12px", justifyContent: "flex-end" }}>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API}/LeaveRequests/${leave.id}/approve`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" }
                              });
                              if (res.ok) {
                                if (manager?.id) loadManagerDashboard(manager.id);
                              } else {
                                alert("Failed to approve leave request.");
                              }
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          style={{
                            background: "#16a34a",
                            color: "#ffffff",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "6px",
                            fontWeight: 600,
                            fontSize: "12px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            boxShadow: "0 1px 2px rgba(22, 163, 74, 0.3)"
                          }}
                        >
                          ✓ Accept / Approve
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              const res = await fetch(`${API}/LeaveRequests/${leave.id}/reject`, {
                                method: "PUT",
                                headers: { "Content-Type": "application/json" }
                              });
                              if (res.ok) {
                                if (manager?.id) loadManagerDashboard(manager.id);
                              } else {
                                alert("Failed to reject leave request.");
                              }
                            } catch (e) {
                              console.error(e);
                            }
                          }}
                          style={{
                            background: "#dc2626",
                            color: "#ffffff",
                            border: "none",
                            padding: "6px 14px",
                            borderRadius: "6px",
                            fontWeight: 600,
                            fontSize: "12px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            boxShadow: "0 1px 2px rgba(220, 38, 38, 0.3)"
                          }}
                        >
                          ✕ Reject
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div style={{ padding: "20px", textAlign: "center", color: "#059669", fontSize: "13px", background: "#f0fdf4", borderRadius: "8px" }}>
                ✓ No pending leave approvals for your team.
              </div>
            )}

            <div style={{ marginTop: "20px" }}>
              <Link
                href="/manager/team-performance"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "10px",
                  background: "#f8fafc",
                  border: "1px solid #cbd5e1",
                  borderRadius: "8px",
                  color: "#334155",
                  fontWeight: 600,
                  fontSize: "13px",
                  textDecoration: "none"
                }}
              >
                📊 View Team Performance & Analytics
              </Link>
            </div>
          </div>
        </div>
      </div>
    </EamsShell>
  );
}
