"use client";

import { useEffect, useMemo, useState } from "react";
import EamsShell from "@/components/EamsShell";
import { getUser } from "@/lib/auth";
import { apiFetch } from "@/lib/api";

// ============================================================
// TYPES
// ============================================================

type Employee = {
  id: number;
  fullName: string;
  email: string;
  department?: { name: string } | string;
  role?: { name: string } | string;
  managerId?: number | null;
};

type AttendanceRecord = {
  id: number;
  employeeId: number;
  date: string;
  status?: { id: number; name: string } | null;
  location?: { id: number; name: string } | null;
  shift?: { id: number; name: string; startTime?: string; endTime?: string } | null;
  statusId?: number | null;
  locationId?: number | null;
  shiftId?: number | null;
  remarks?: string | null;
};

type CorrectionRequest = {
  id: number;
  attendanceId: number;
  employeeId: number;
  employeeName: string;
  departmentName?: string;
  date: string;
  requestedStatus?: string;
  requestedLocation?: string;
  requestedShift?: string;
  reason?: string;
  status: string;
  createdAt: string;
};

// ============================================================
// HELPERS
// ============================================================

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function parseLocalDate(s: string): Date {
  const parts = s.substring(0, 10).split("-");
  return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
}

function getMonthDays(year: number, month: number): (Date | null)[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days: (Date | null)[] = [];
  for (let i = 0; i < first.getDay(); i++) days.push(null);
  for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
  return days;
}

function getStatusName(r?: AttendanceRecord | null): string {
  return r?.status?.name ?? "";
}

function getLocationName(r?: AttendanceRecord | null): string {
  return r?.location?.name ?? "";
}

function getStatusClass(r?: AttendanceRecord | null): string {
  const status = getStatusName(r).toLowerCase();
  const loc = getLocationName(r);
  if (!status) return "not-marked";
  if (status === "present") {
    if (loc === "Home") return "wfh";
    if (loc === "Client Site") return "client";
    return "wfo";
  }
  if (status === "sick leave") return "sick";
  if (status === "vacation") return "vacation";
  if (status === "absent") return "absent";
  return "other";
}

function getStatusLabel(r?: AttendanceRecord | null): string {
  const status = getStatusName(r);
  const loc = getLocationName(r);
  if (!status) return "Not Marked";
  if (status === "Present") {
    if (loc === "Office") return "WFO";
    if (loc === "Home") return "WFH";
    if (loc === "Client Site") return "Client";
  }
  return status;
}

function getDeptName(emp: Employee): string {
  if (!emp.department) return "—";
  if (typeof emp.department === "string") return emp.department;
  return emp.department.name ?? "—";
}

// ============================================================
// COMPONENT
// ============================================================

export default function ManagerAttendancePage() {
  const user = getUser();
  const today = new Date();
  const todayString = formatDate(today);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [corrections, setCorrections] = useState<CorrectionRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [currentMonth, setCurrentMonth] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
  );

  const [searchQuery, setSearchQuery] = useState("");

  // ── Load data ──────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");

        const [empData, attData, correctionsData] = await Promise.all([
          apiFetch("/employees"),
          apiFetch("/Attendance"),
          apiFetch(`/AttendanceCorrections/manager/${user?.id || 0}`),
        ]);

        setEmployees(Array.isArray(empData) ? empData : []);
        setAttendance(Array.isArray(attData) ? attData : []);
        setCorrections(Array.isArray(correctionsData) ? correctionsData : []);
      } catch (err: unknown) {
        console.error(err);
        setError("Unable to load team attendance data.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  // ── Filter to this manager's team (using department logic) ───
  const teamMembers = useMemo(() => {
    if (!user) return [];
    // If strict managerId isn't assigned, default to same department!
    return employees.filter((e) => {
      if (e.managerId === user.id) return true;
      const empDept = getDeptName(e);
      const userDept = user.department || "";
      return empDept && empDept === userDept;
    });
  }, [employees, user]);

  const teamIds = useMemo(
    () => new Set(teamMembers.map((e) => e.id)),
    [teamMembers]
  );

  // ── Today's records for the team ──────────────────────────
  const todayRecords = useMemo(() => {
    return attendance.filter(
      (r) =>
        r.date.substring(0, 10) === todayString &&
        teamIds.has(r.employeeId)
    );
  }, [attendance, todayString, teamIds]);

  function getTodayRecord(empId: number): AttendanceRecord | undefined {
    return todayRecords.find((r) => r.employeeId === empId);
  }

  // ── Summary counts ────────────────────────────────────────
  const totalTeam = teamMembers.length;

  const presentToday = todayRecords.filter((r) =>
    getStatusName(r).toLowerCase() === "present"
  ).length;

  const absentToday = todayRecords.filter((r) =>
    getStatusName(r).toLowerCase() === "absent"
  ).length;

  const onLeaveToday = todayRecords.filter((r) => {
    const s = getStatusName(r).toLowerCase();
    return s === "sick leave" || s === "vacation";
  }).length;

  const notMarkedToday = totalTeam - todayRecords.length;

  // ── Month calendar ─────────────────────────────────────────
  const monthDays = useMemo(
    () => getMonthDays(currentMonth.getFullYear(), currentMonth.getMonth()),
    [currentMonth]
  );

  const monthName = currentMonth.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  function getTeamRecordsForDate(dateStr: string): AttendanceRecord[] {
    return attendance.filter(
      (r) => r.date.substring(0, 10) === dateStr && teamIds.has(r.employeeId)
    );
  }

  // ── Search filter ──────────────────────────────────────────
  const filteredTeam = useMemo(() => {
    if (!searchQuery.trim()) return teamMembers;
    const q = searchQuery.toLowerCase();
    return teamMembers.filter(
      (e) =>
        e.fullName.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        getDeptName(e).toLowerCase().includes(q)
    );
  }, [teamMembers, searchQuery]);

  // ── Navigate months ────────────────────────────────────────
  function prevMonth() {
    setCurrentMonth(
      (m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)
    );
  }

  function nextMonth() {
    setCurrentMonth(
      (m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)
    );
  }

  function goToday() {
    setCurrentMonth(
      new Date(today.getFullYear(), today.getMonth(), 1)
    );
  }

  // ── Handle Corrections ─────────────────────────────────────
  async function handleApprove(id: number) {
    if (!user) return;
    try {
      await apiFetch(`/AttendanceCorrections/${id}/approve`, {
        method: "POST",
        body: JSON.stringify({ managerId: user.id }),
      });
      setSuccess("Correction approved.");
      setCorrections(corrections.filter(c => c.id !== id));
      setTimeout(() => setSuccess(""), 3000);
      
      // Refresh attendance to reflect changes
      const attData = await apiFetch("/Attendance");
      setAttendance(Array.isArray(attData) ? attData : []);
    } catch (err: any) {
      setError(err.message || "Failed to approve correction.");
    }
  }

  async function handleReject(id: number) {
    if (!user) return;
    try {
      await apiFetch(`/AttendanceCorrections/${id}/reject`, {
        method: "POST",
        body: JSON.stringify({ managerId: user.id }),
      });
      setSuccess("Correction rejected.");
      setCorrections(corrections.filter(c => c.id !== id));
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reject correction.");
    }
  }

  const pendingCorrections = corrections.filter(c => c.status === "Pending");

  // ── Render ─────────────────────────────────────────────────
  if (loading) {
    return (
      <EamsShell role="Manager">
        <div className="professional-attendance">
          <div className="attendance-loading">
            <div className="loading-spinner" />
            <span>Loading team attendance…</span>
          </div>
        </div>
      </EamsShell>
    );
  }

  return (
    <EamsShell role="Manager">
      <div className="professional-attendance">

        {/* ── HEADER ── */}

        <div className="attendance-top">
          <div>
            <div className="attendance-breadcrumb">
              Manager Portal → Team Attendance
            </div>
            <h1>Team Attendance</h1>
            <p>
              Monitor your team's attendance for{" "}
              {today.toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
          <button className="attendance-today-btn" onClick={goToday}>
            ◉ Today
          </button>
        </div>

        {/* ── ALERTS ── */}

        {error && (
          <div className="attendance-alert error">
            <span>⚠</span>
            <div>{error}</div>
            <button onClick={() => setError("")}>✕</button>
          </div>
        )}

        {success && (
          <div className="attendance-alert success" style={{ background: "#dcfce7", color: "#166534", border: "1px solid #bbf7d0", padding: "12px 16px", borderRadius: "10px", display: "flex", gap: "12px", alignItems: "center", marginBottom: "20px" }}>
            <span>✅</span>
            <div style={{ flex: 1, fontWeight: 500, fontSize: "14px" }}>{success}</div>
            <button onClick={() => setSuccess("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#166534", fontSize: "16px" }}>✕</button>
          </div>
        )}

        {/* ── SUMMARY CARDS ── */}

        <div className="attendance-summary-grid">
          <div className="attendance-summary-card total">
            <div className="summary-card-icon">👥</div>
            <div>
              <span>Team Members</span>
              <strong>{totalTeam}</strong>
              <small>Direct reports</small>
            </div>
          </div>

          <div className="attendance-summary-card wfo">
            <div className="summary-card-icon">✅</div>
            <div>
              <span>Present Today</span>
              <strong>{presentToday}</strong>
              <small>WFO + WFH + Client</small>
            </div>
          </div>

          <div className="attendance-summary-card absent">
            <div className="summary-card-icon">❌</div>
            <div>
              <span>Absent Today</span>
              <strong>{absentToday}</strong>
              <small>Unexcused absences</small>
            </div>
          </div>

          <div className="attendance-summary-card leave">
            <div className="summary-card-icon">🏖</div>
            <div>
              <span>On Leave</span>
              <strong>{onLeaveToday}</strong>
              <small>Sick + Vacation</small>
            </div>
          </div>

          <div className="attendance-summary-card wfh">
            <div className="summary-card-icon">❓</div>
            <div>
              <span>Not Marked</span>
              <strong>{notMarkedToday}</strong>
              <small>No record today</small>
            </div>
          </div>
        </div>

        {/* ── PENDING CORRECTIONS SECTION ── */}
        {pendingCorrections.length > 0 && (
          <div className="attendance-history-card" style={{ marginBottom: "20px", border: "2px solid #fbbf24", background: "#fffbeb" }}>
            <div className="history-header">
              <div>
                <h2 style={{ color: "#d97706" }}>Pending Attendance Corrections</h2>
                <p>Action required on team requests</p>
              </div>
            </div>
            <div className="history-table-wrap">
              <table className="attendance-history-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Requested Changes</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingCorrections.map(req => (
                    <tr key={req.id}>
                      <td>
                        <strong>{req.employeeName}</strong>
                        <div style={{ color: "#94a3b8", fontSize: "9px" }}>{req.departmentName}</div>
                      </td>
                      <td>{req.date.substring(0, 10)}</td>
                      <td>
                        <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "2px" }}>
                          <span>Status: <strong>{req.requestedStatus || "—"}</strong></span>
                          <span>Location: <strong>{req.requestedLocation || "—"}</strong></span>
                          <span>Shift: <strong>{req.requestedShift || "—"}</strong></span>
                        </div>
                      </td>
                      <td style={{ maxWidth: "200px" }}>
                        <div style={{ fontSize: "11px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={req.reason || ""}>
                          {req.reason || "—"}
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => handleApprove(req.id)} style={{ padding: "6px 12px", background: "#10b981", color: "white", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                            Approve
                          </button>
                          <button onClick={() => handleReject(req.id)} style={{ padding: "6px 12px", background: "#ef4444", color: "white", border: "none", borderRadius: "6px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ── MAIN GRID: Table + Calendar ── */}

        <div className="attendance-main-grid">

          {/* LEFT: Today's Team Table */}
          <div>
            <div className="attendance-history-card">
              <div className="history-header">
                <div>
                  <h2>Today's Team Status</h2>
                  <p>
                    {filteredTeam.length} member
                    {filteredTeam.length !== 1 ? "s" : ""} ·{" "}
                    {today.toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>

                {/* Search */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <input
                    type="text"
                    placeholder="Search team…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      padding: "7px 12px",
                      border: "1px solid #dbe4f0",
                      borderRadius: "9px",
                      fontSize: "11px",
                      outline: "none",
                      background: "#fff",
                      color: "#334155",
                      width: "160px",
                    }}
                  />
                </div>
              </div>

              <div className="history-table-wrap">
                <table className="attendance-history-table">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Shift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeam.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="history-empty"
                        >
                          {teamMembers.length === 0
                            ? "No direct reports found for your account."
                            : "No results match your search."}
                        </td>
                      </tr>
                    ) : (
                      filteredTeam.map((emp) => {
                        const rec = getTodayRecord(emp.id);
                        const cls = getStatusClass(rec);
                        const label = getStatusLabel(rec);

                        return (
                          <tr key={emp.id}>
                            <td>
                              <div style={{ display: "flex", alignItems: "center", gap: "9px" }}>
                                <div
                                  style={{
                                    width: "30px",
                                    height: "30px",
                                    borderRadius: "50%",
                                    background: "var(--eams-primary-soft)",
                                    color: "var(--eams-primary)",
                                    display: "grid",
                                    placeItems: "center",
                                    fontWeight: 800,
                                    fontSize: "11px",
                                    flexShrink: 0,
                                  }}
                                >
                                  {emp.fullName.charAt(0).toUpperCase()}
                                </div>
                                <div>
                                  <strong>{emp.fullName}</strong>
                                  <div style={{ color: "#94a3b8", fontSize: "9px", marginTop: "2px" }}>
                                    {emp.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td>{getDeptName(emp)}</td>
                            <td>
                              {cls === "not-marked" ? (
                                <span
                                  style={{
                                    display: "inline-flex",
                                    padding: "5px 8px",
                                    borderRadius: "7px",
                                    fontSize: "8px",
                                    fontWeight: 800,
                                    background: "#f1f5f9",
                                    color: "#94a3b8",
                                  }}
                                >
                                  Not Marked
                                </span>
                              ) : (
                                <span className={`history-status ${cls}`}>
                                  {label}
                                </span>
                              )}
                            </td>
                            <td>{rec?.location?.name ?? "—"}</td>
                            <td>{rec?.shift?.name ?? "—"}</td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* RIGHT: Monthly Calendar Overview */}
          <div>
            <div className="attendance-calendar-card">
              <div className="calendar-toolbar">
                <div>
                  <h2>Team Calendar</h2>
                  <p>Days with full team presence highlighted</p>
                </div>
                <div className="calendar-navigation">
                  <button onClick={prevMonth}>‹</button>
                  <button className="calendar-current">{monthName}</button>
                  <button onClick={nextMonth}>›</button>
                </div>
              </div>

              {/* Legend */}
              <div className="attendance-legend">
                <span>
                  <span className="legend-dot wfo-dot" />
                  WFO
                </span>
                <span>
                  <span className="legend-dot wfh-dot" />
                  WFH
                </span>
                <span>
                  <span className="legend-dot sick-dot" />
                  Leave
                </span>
                <span>
                  <span className="legend-dot absent-dot" />
                  Absent
                </span>
              </div>

              {/* Weekday headers */}
              <div className="calendar-weekdays">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>

              {/* Day grid */}
              <div className="calendar-days-grid">
                {monthDays.map((day, i) => {
                  if (!day) {
                    return <div key={`e-${i}`} className="calendar-empty" />;
                  }

                  const ds = formatDate(day);
                  const dayRecs = getTeamRecordsForDate(ds);
                  const isToday = ds === todayString;

                  const presentCount = dayRecs.filter(
                    (r) => getStatusName(r).toLowerCase() === "present"
                  ).length;

                  const absentCount = dayRecs.filter(
                    (r) => getStatusName(r).toLowerCase() === "absent"
                  ).length;

                  const leaveCount = dayRecs.filter((r) => {
                    const s = getStatusName(r).toLowerCase();
                    return s === "sick leave" || s === "vacation";
                  }).length;

                  return (
                    <div
                      key={ds}
                      className={`calendar-date-cell${isToday ? " calendar-today" : ""}`}
                      title={`${day.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}: ${presentCount} present, ${absentCount} absent, ${leaveCount} on leave`}
                    >
                      <div className="calendar-date-number">
                        {day.getDate()}
                      </div>

                      {presentCount > 0 && (
                        <div
                          className="calendar-status wfo"
                          style={{ fontSize: "7px" }}
                        >
                          ✓ {presentCount}
                        </div>
                      )}
                      {absentCount > 0 && (
                        <div
                          className="calendar-status absent"
                          style={{ fontSize: "7px" }}
                        >
                          ✕ {absentCount}
                        </div>
                      )}
                      {leaveCount > 0 && (
                        <div
                          className="calendar-status sick"
                          style={{ fontSize: "7px" }}
                        >
                          🏖 {leaveCount}
                        </div>
                      )}
                      {dayRecs.length === 0 && (
                        <div className="calendar-not-marked">—</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Team summary for the month */}
            <div
              style={{
                marginTop: "14px",
                background: "#fff",
                border: "1px solid var(--eams-border)",
                borderRadius: "16px",
                padding: "16px 18px",
                boxShadow: "var(--eams-shadow)",
              }}
            >
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#334155",
                  marginBottom: "10px",
                }}
              >
                📊 {monthName} Summary
              </div>
              {[
                {
                  label: "Present (WFO/WFH/Client)",
                  cls: "wfo-dot",
                  count: attendance.filter(
                    (r) =>
                      parseLocalDate(r.date).getFullYear() === currentMonth.getFullYear() &&
                      parseLocalDate(r.date).getMonth() === currentMonth.getMonth() &&
                      teamIds.has(r.employeeId) &&
                      getStatusName(r).toLowerCase() === "present"
                  ).length,
                },
                {
                  label: "Absent",
                  cls: "absent-dot",
                  count: attendance.filter(
                    (r) =>
                      parseLocalDate(r.date).getFullYear() === currentMonth.getFullYear() &&
                      parseLocalDate(r.date).getMonth() === currentMonth.getMonth() &&
                      teamIds.has(r.employeeId) &&
                      getStatusName(r).toLowerCase() === "absent"
                  ).length,
                },
                {
                  label: "On Leave",
                  cls: "sick-dot",
                  count: attendance.filter((r) => {
                    const s = getStatusName(r).toLowerCase();
                    return (
                      parseLocalDate(r.date).getFullYear() === currentMonth.getFullYear() &&
                      parseLocalDate(r.date).getMonth() === currentMonth.getMonth() &&
                      teamIds.has(r.employeeId) &&
                      (s === "sick leave" || s === "vacation")
                    );
                  }).length,
                },
              ].map((item) => (
                <div
                  key={item.label}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "7px 0",
                    borderBottom: "1px solid #f1f5f9",
                    fontSize: "11px",
                    color: "#475569",
                  }}
                >
                  <span className={`legend-dot ${item.cls}`} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <strong style={{ color: "#334155" }}>{item.count}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </EamsShell>
  );
}
