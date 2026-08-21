"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EamsShell from "@/components/EamsShell";

const API = "http://localhost:5000/api";

type AttendanceRecord = {
  id?: number;
  employeeId: number;
  date?: string;
  attendanceDate?: string;
  status?: string;
  attendanceStatus?: { name?: string };
  workLocation?: string;
  workLocationName?: string;
};

type LeaveRequest = {
  id: number;
  employeeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
};

export default function EmployeeReportsPage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("eams_user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    try {
      const user = JSON.parse(stored);
      setEmployee(user);
      loadReports(user.id);
    } catch {
      localStorage.removeItem("eams_user");
      localStorage.removeItem("eams_token");
      router.replace("/login");
    }
  }, [router]);

  async function loadReports(employeeId: number) {
    try {
      setLoading(true);
      const [attRes, leaveRes] = await Promise.all([
        fetch(`${API}/Attendance/employee/${employeeId}`),
        fetch(`${API}/LeaveRequests/employee/${employeeId}`)
      ]);

      if (attRes.ok) {
        const data = await attRes.json();
        setAttendance(Array.isArray(data) ? data : []);
      }
      if (leaveRes.ok) {
        const data = await leaveRes.json();
        setLeaves(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function getStatus(r: AttendanceRecord) {
    return (r.status || r.attendanceStatus?.name || "").toLowerCase();
  }

  function getLocation(r: AttendanceRecord) {
    return (r.workLocation || r.workLocationName || "").toLowerCase();
  }

  const presentDays = attendance.filter(r => {
    const s = getStatus(r);
    return s.includes("present") || s.includes("office") || s.includes("home");
  }).length;

  const sickDays = attendance.filter(r => getStatus(r).includes("sick")).length;
  const vacationDays = attendance.filter(r => getStatus(r).includes("vacation")).length;

  const totalAttendance = attendance.length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentDays / totalAttendance) * 100) : 0;

  if (!employee) {
    return (
      <EamsShell role="Employee">
        <div className="loading">Loading EAMS...</div>
      </EamsShell>
    );
  }

  return (
    <EamsShell role="Employee">
      <div className="professional-attendance" style={{ maxWidth: "1100px", margin: "0 auto", padding: "28px" }}>

        {/* HEADER */}
        <div className="page-heading" style={{ marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#0f172a" }}>
              📊 Reports & Analytics
            </h1>
            <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
              Your personal attendance performance, leave usage, and monthly trends.
            </p>
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
          marginBottom: "28px"
        }}>
          <div style={{ background: "#ffffff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", borderTop: "4px solid #2563eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>📈 Attendance Rate</div>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#2563eb", lineHeight: 1 }}>{attendanceRate}%</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>Based on {totalAttendance} records</div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", borderTop: "4px solid #059669", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>✅ Days Present</div>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#059669", lineHeight: 1 }}>{presentDays}</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>Out of {totalAttendance} scheduled</div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", borderTop: "4px solid #d97706", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>🏥 Sick Days</div>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#d97706", lineHeight: 1 }}>{sickDays}</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>Medical leave taken</div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", borderTop: "4px solid #7c3aed", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>🌴 Vacation Days</div>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#7c3aed", lineHeight: 1 }}>{vacationDays}</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>Annual leave consumed</div>
          </div>

          <div style={{ background: "#ffffff", borderRadius: "12px", padding: "20px", border: "1px solid #e2e8f0", borderTop: "4px solid #dc2626", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "8px" }}>📋 Total Leave Requests</div>
            <div style={{ fontSize: "32px", fontWeight: 900, color: "#dc2626", lineHeight: 1 }}>{leaves.length}</div>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>All time requests</div>
          </div>
        </div>

        {/* ATTENDANCE TABLE */}
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Recent Attendance Records</h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>Your latest 10 attendance entries.</p>
            </div>
            <a href="/employee/attendance" style={{ color: "#2563eb", fontWeight: 600, fontSize: "13px", textDecoration: "none" }}>View All →</a>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading records...</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Day</th>
                    <th>Status</th>
                    <th>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.slice(0, 10).map((record, i) => {
                    const d = new Date(record.date || record.attendanceDate || "");
                    const statusText = record.status || record.attendanceStatus?.name || "—";
                    const locationText = record.workLocation || record.workLocationName || "—";
                    const isPresent = statusText.toLowerCase().includes("present");
                    const isSick = statusText.toLowerCase().includes("sick");
                    const isAbsent = statusText.toLowerCase().includes("absent");

                    return (
                      <tr key={record.id || i}>
                        <td style={{ fontWeight: 600 }}>{d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</td>
                        <td style={{ color: "#64748b" }}>{d.toLocaleDateString("en-US", { weekday: "short" })}</td>
                        <td>
                          <span style={{
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 700,
                            background: isPresent ? "#dcfce7" : isSick ? "#fef3c7" : isAbsent ? "#fee2e2" : "#f1f5f9",
                            color: isPresent ? "#15803d" : isSick ? "#a16207" : isAbsent ? "#b91c1c" : "#475569"
                          }}>
                            {statusText}
                          </span>
                        </td>
                        <td style={{ color: "#64748b" }}>{locationText}</td>
                      </tr>
                    );
                  })}
                  {attendance.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                        No attendance records found. Start marking your attendance from the dashboard.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* LEAVE REQUESTS TABLE */}
        <div style={{ background: "#ffffff", borderRadius: "14px", border: "1px solid #e2e8f0", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 800, color: "#1e293b" }}>Leave Request History</h2>
              <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "13px" }}>All your submitted leave requests and their status.</p>
            </div>
            <a href="/employee/leave" style={{ color: "#2563eb", fontWeight: 600, fontSize: "13px", textDecoration: "none" }}>Manage →</a>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>Loading...</div>
          ) : leaves.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No leave requests found.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Leave Type</th>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map((leave) => {
                    const isApproved = leave.status === "Approved";
                    const isRejected = leave.status === "Rejected";
                    return (
                      <tr key={leave.id}>
                        <td style={{ fontWeight: 600 }}>{leave.leaveType}</td>
                        <td>{new Date(leave.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                        <td>{new Date(leave.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                        <td>
                          <span style={{
                            padding: "3px 10px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 700,
                            background: isApproved ? "#dcfce7" : isRejected ? "#fee2e2" : "#fef3c7",
                            color: isApproved ? "#15803d" : isRejected ? "#b91c1c" : "#a16207"
                          }}>
                            {leave.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </EamsShell>
  );
}