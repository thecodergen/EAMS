"use client";

import { useEffect, useMemo, useState } from "react";
import EamsShell from "@/components/EamsShell";
import {
  getEmployeeAttendance,
  getEmployeeLeaveRequests,
  getNotifications,
} from "@/lib/api";
import { getUser } from "@/lib/auth";

type User = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  department?: string;
} | null;

type Attendance = {
  id: number;
  date: string;
  employeeId: number;
  remarks?: string;
  status?: {
    id?: number;
    name?: string;
  } | string;
  location?: {
    id?: number;
    name?: string;
  } | string;
  shift?: {
    id?: number;
    name?: string;
    startTime?: string;
    endTime?: string;
  } | string;
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

type Notification = {
  id: number;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

// ============================================================
// HELPERS FOR EXTRACTING DATA SAFELY
// ============================================================

function extractStatusName(record?: any): string {
  if (!record) return "";
  if (typeof record.status === "string") return record.status;
  if (record.status?.name) return record.status.name;
  if (record.statusName) return record.statusName;
  if (record.Status) return record.Status;
  return "";
}

function extractLocationName(record?: any): string {
  if (!record) return "";
  if (typeof record.location === "string") return record.location;
  if (record.location?.name) return record.location.name;
  if (record.locationName) return record.locationName;
  if (record.Location) return record.Location;
  return "";
}

function extractShiftName(record?: any): string {
  if (!record) return "";
  if (typeof record.shift === "string") return record.shift;
  if (record.shift?.name) return record.shift.name;
  if (record.shiftName) return record.shiftName;
  if (record.Shift) return record.Shift;
  return "";
}

// ============================================================
// HELPERS FOR WEEK TIMETABLE
// ============================================================

function getWeekDays(referenceDate: Date) {
  const day = referenceDate.getDay(); // 0=Sun, 1=Mon...
  const monday = new Date(referenceDate);
  monday.setDate(referenceDate.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function formatDateKey(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getWeekStatusStyle(statusName: string, locationName: string): { bg: string; text: string; label: string } {
  const s = (statusName || "").toLowerCase().trim();
  if (s === "present") {
    if (locationName?.toLowerCase() === "home") return { bg: "#065f46", text: "#a7f3d0", label: "WFH" };
    if (locationName?.toLowerCase() === "client site") return { bg: "#7c3aed", text: "#ddd6fe", label: "Client" };
    return { bg: "#1d4ed8", text: "#ffffff", label: "Present" };
  }
  if (s === "sick leave")  return { bg: "#b45309", text: "#fde68a", label: "Sick" };
  if (s === "vacation")    return { bg: "#0e7490", text: "#a5f3fc", label: "Leave" };
  if (s === "absent")      return { bg: "#991b1b", text: "#fecaca", label: "Absent" };
  return { bg: "#374151", text: "#9ca3af", label: "—" };
}

export default function EmployeeDashboard() {
  // ============================================================
  // IMPORTANT:
  // Do NOT call getUser() during the first render.
  // This prevents Next.js hydration mismatch.
  // ============================================================

  const [user, setUser] = useState<User>(null);
  const [mounted, setMounted] = useState(false);

  const [attendance, setAttendance] =
    useState<Attendance[]>([]);

  const [leaves, setLeaves] =
    useState<LeaveRequest[]>([]);

  const [notifications, setNotifications] =
    useState<Notification[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  // ============================================================
  // LOAD USER ONLY IN BROWSER
  // ============================================================

  useEffect(() => {
    setMounted(true);

    const currentUser = getUser();

    setUser(currentUser as User);
  }, []);

  // ============================================================
  // LOAD DASHBOARD DATA
  // ============================================================

  useEffect(() => {
    if (!mounted || !user) {
      return;
    }

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [
          attendanceData,
          leaveData,
          notificationData,
        ] = await Promise.all([
          getEmployeeAttendance(user!.id),
          getEmployeeLeaveRequests(user!.id),
          getNotifications(user!.id),
        ]);

        setAttendance(
          attendanceData ?? []
        );

        setLeaves(
          leaveData ?? []
        );

        setNotifications(
          notificationData ?? []
        );
      } catch (err) {
        console.error(
          "Dashboard loading error:",
          err
        );

        setError(
          "Unable to load dashboard data."
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [mounted, user?.id]);

  // ============================================================
  // HYDRATION SAFE LOADING
  // ============================================================

  if (!mounted) {
    return (
      <div className="loading">
        Loading...
      </div>
    );
  }

  // ============================================================
  // NOT LOGGED IN
  // ============================================================

  if (!user) {
    return (
      <div className="loading">
        Please login...
      </div>
    );
  }

  // ============================================================
  // DASHBOARD LOADING
  // ============================================================

  if (loading) {
    return (
      <EamsShell role="Employee">
        <div className="loading">
          Loading your dashboard...
        </div>
      </EamsShell>
    );
  }

  // ============================================================
  // ATTENDANCE CALCULATIONS
  // ============================================================

  const presentDays = attendance.filter(
    (item) => extractStatusName(item).toLowerCase() === "present"
  ).length;

  const officeDays = attendance.filter(
    (item) =>
      extractStatusName(item).toLowerCase() === "present" &&
      extractLocationName(item).toLowerCase() === "office"
  ).length;

  const homeDays = attendance.filter(
    (item) =>
      extractStatusName(item).toLowerCase() === "present" &&
      extractLocationName(item).toLowerCase() === "home"
  ).length;

  const sickDays = attendance.filter(
    (item) => extractStatusName(item).toLowerCase() === "sick leave"
  ).length;

  const vacationDays = attendance.filter(
    (item) => extractStatusName(item).toLowerCase() === "vacation"
  ).length;

  const attendancePercentage =
    attendance.length === 0
      ? 0
      : Math.round(
          (presentDays / attendance.length) *
            100
        );

  // ============================================================
  // LEAVE CALCULATIONS
  // ============================================================

  const pendingLeaves = leaves.filter(
    (item) =>
      item.status === "Pending"
  ).length;

  const approvedLeaves = leaves.filter(
    (item) =>
      item.status === "Approved"
  ).length;

  const rejectedLeaves = leaves.filter(
    (item) =>
      item.status === "Rejected"
  ).length;

  // ============================================================
  // NOTIFICATION CALCULATIONS
  // ============================================================

  const unreadNotifications =
    notifications.filter(
      (item) => !item.isRead
    ).length;

  // ============================================================
  // RECENT DATA
  // ============================================================

  const recentAttendance =
    attendance.slice(0, 5);

  const recentLeaves =
    leaves.slice(0, 5);

  const recentNotifications =
    notifications.slice(0, 5);

  // ============================================================
  // DASHBOARD
  // ============================================================

  return (
    <EamsShell role="Employee">

      {/* ======================================================
          HEADER
      ====================================================== */}

      <div className="page-heading">
        <div>
          <h1>
            Welcome, {user.fullName}
          </h1>

          <p>
            Here's your EAMS overview.
          </p>
        </div>
      </div>

      {/* ======================================================
          ERROR
      ====================================================== */}

      {error && (
        <div className="error-box">
          {error}
        </div>
      )}

      {/* ======================================================
          SUMMARY CARDS
      ====================================================== */}

      <div className="cards-grid">

        {/* Attendance */}

        <div className="stat-card">
          <div className="stat-label">
            Attendance
          </div>

          <div className="stat-value">
            {attendancePercentage}%
          </div>

          <div className="stat-small">
            {presentDays} days present
          </div>
        </div>

        {/* Office */}

        <div className="stat-card">
          <div className="stat-label">
            Office Days
          </div>

          <div className="stat-value">
            {officeDays}
          </div>

          <div className="stat-small">
            Work from office
          </div>
        </div>

        {/* Home */}

        <div className="stat-card">
          <div className="stat-label">
            Home Days
          </div>

          <div className="stat-value">
            {homeDays}
          </div>

          <div className="stat-small">
            Work from home
          </div>
        </div>

        {/* Notifications */}

        <div className="stat-card">
          <div className="stat-label">
            Notifications
          </div>

          <div className="stat-value">
            {unreadNotifications}
          </div>

          <div className="stat-small">
            Unread notifications
          </div>
        </div>

      </div>

      {/* ======================================================
          THIS WEEK — TIMETABLE WIDGET
      ====================================================== */}

      <WeekTimetable
        attendance={attendance}
        setAttendance={setAttendance}
        user={user}
        onRefresh={async () => {
          if (!user?.id) return;
          try {
            const [attendanceData, leaveData, notificationData] = await Promise.all([
              getEmployeeAttendance(user.id),
              getEmployeeLeaveRequests(user.id),
              getNotifications(user.id),
            ]);
            setAttendance(attendanceData ?? []);
            setLeaves(leaveData ?? []);
            setNotifications(notificationData ?? []);
          } catch (e) {
            console.error(e);
          }
        }}
      />

      {/* ======================================================
          ATTENDANCE + LEAVE SUMMARY
      ====================================================== */}

      <div className="dashboard-grid">

        {/* ====================================================
            RECENT ATTENDANCE
        ==================================================== */}

        <section className="panel">

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div>
              <h2>Recent Attendance</h2>
              <div className="panel-subtitle">
                Your latest attendance records.
              </div>
            </div>
            <a href="/employee/attendance">View All</a>
          </div>

          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Shift</th>
                </tr>
              </thead>
              <tbody>
                {recentAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "30px" }}>
                      No attendance records found.
                    </td>
                  </tr>
                ) : (
                  recentAttendance.map((item) => (
                    <tr key={item.id}>
                      <td>{item.date?.slice(0, 10)}</td>
                      <td>
                        <span className="badge badge-blue">
                          {extractStatusName(item) || "Unknown"}
                        </span>
                      </td>
                      <td>{extractLocationName(item) || "—"}</td>
                      <td>{extractShiftName(item) || "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </section>

        {/* ====================================================
            LEAVE SUMMARY
        ==================================================== */}

        <section className="panel">

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "center",
            }}
          >

            <div>
              <h2>
                Leave Summary
              </h2>

              <div className="panel-subtitle">
                Your current leave status.
              </div>
            </div>

            <a href="/employee/leave">
              View All
            </a>

          </div>

          <div
            style={{
              display: "grid",
              gap: "12px",
              marginTop: "20px",
            }}
          >

            <div className="stat-card">

              <div className="stat-label">
                Pending
              </div>

              <div className="stat-value">
                {pendingLeaves}
              </div>

              <div className="stat-small">
                Awaiting approval
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-label">
                Approved
              </div>

              <div className="stat-value">
                {approvedLeaves}
              </div>

              <div className="stat-small">
                Approved requests
              </div>

            </div>

            <div className="stat-card">

              <div className="stat-label">
                Rejected
              </div>

              <div className="stat-value">
                {rejectedLeaves}
              </div>

              <div className="stat-small">
                Rejected requests
              </div>

            </div>

          </div>

        </section>

      </div>

      {/* ======================================================
          RECENT LEAVE REQUESTS
      ====================================================== */}

      <section className="panel">

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >

          <div>
            <h2>
              Recent Leave Requests
            </h2>

            <div className="panel-subtitle">
              Your latest leave applications.
            </div>
          </div>

          <a href="/employee/leave">
            Manage Leave
          </a>

        </div>

        <div className="table-wrap">

          <table className="data-table">

            <thead>
              <tr>
                <th>
                  Leave Type
                </th>

                <th>
                  Start Date
                </th>

                <th>
                  End Date
                </th>

                <th>
                  Reason
                </th>

                <th>
                  Status
                </th>
              </tr>
            </thead>

            <tbody>

              {recentLeaves.length === 0 ? (

                <tr>
                  <td
                    colSpan={5}
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "30px",
                    }}
                  >
                    No leave requests
                    found.
                  </td>
                </tr>

              ) : (

                recentLeaves.map(
                  (leave) => (

                    <tr
                      key={leave.id}
                    >

                      <td>
                        {leave.leaveType}
                      </td>

                      <td>
                        {leave.startDate}
                      </td>

                      <td>
                        {leave.endDate}
                      </td>

                      <td>
                        {leave.reason}
                      </td>

                      <td>
                        <span className="badge badge-blue">
                          {leave.status}
                        </span>
                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* ======================================================
          RECENT NOTIFICATIONS
      ====================================================== */}

      <section className="panel">

        <div
          style={{
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
          }}
        >

          <div>
            <h2>
              Recent Notifications
            </h2>

            <div className="panel-subtitle">
              Important updates from EAMS.
            </div>
          </div>

          <a href="/employee/notifications">
            View All
          </a>

        </div>

        <div className="table-wrap">

          <table className="data-table">

            <thead>
              <tr>
                <th>
                  Title
                </th>

                <th>
                  Message
                </th>

                <th>
                  Status
                </th>

                <th>
                  Date
                </th>
              </tr>
            </thead>

            <tbody>

              {recentNotifications.length === 0 ? (

                <tr>
                  <td
                    colSpan={4}
                    style={{
                      textAlign:
                        "center",
                      padding:
                        "30px",
                    }}
                  >
                    No notifications
                    found.
                  </td>
                </tr>

              ) : (

                recentNotifications.map(
                  (notification) => (

                    <tr
                      key={
                        notification.id
                      }
                    >

                      <td>
                        <strong>
                          {
                            notification.title
                          }
                        </strong>
                      </td>

                      <td>
                        {
                          notification.message
                        }
                      </td>

                      <td>

                        <span
                          className={`badge ${
                            notification.isRead
                              ? "badge-blue"
                              : "badge-orange"
                          }`}
                        >
                          {notification.isRead
                            ? "Read"
                            : "Unread"}
                        </span>

                      </td>

                      <td>
                        {new Date(
                          notification.createdAt
                        ).toLocaleString()}
                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </section>

      {/* ======================================================
          QUICK ACTIONS
      ====================================================== */}

      <section className="panel">

        <h2>
          Quick Actions
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "12px",
            marginTop: "20px",
          }}
        >

          <a
            href="/employee/attendance"
            className="stat-card"
            style={{
              textDecoration:
                "none",
            }}
          >

            <div className="stat-label">
              Attendance
            </div>

            <div
              style={{
                marginTop: "8px",
                fontWeight: 600,
              }}
            >
              View Attendance →
            </div>

          </a>

          <a
            href="/employee/leave"
            className="stat-card"
            style={{
              textDecoration:
                "none",
            }}
          >

            <div className="stat-label">
              Leave Management
            </div>

            <div
              style={{
                marginTop: "8px",
                fontWeight: 600,
              }}
            >
              Apply / View Leave →
            </div>

          </a>

          <a
            href="/employee/reports"
            className="stat-card"
            style={{
              textDecoration:
                "none",
            }}
          >

            <div className="stat-label">
              Reports
            </div>

            <div
              style={{
                marginTop: "8px",
                fontWeight: 600,
              }}
            >
              View Reports →
            </div>

          </a>

          <a
            href="/employee/notifications"
            className="stat-card"
            style={{
              textDecoration:
                "none",
            }}
          >

            <div className="stat-label">
              Notifications
            </div>

            <div
              style={{
                marginTop: "8px",
                fontWeight: 600,
              }}
            >
              View Notifications →
            </div>

          </a>

          <a
            href="/employee/profile"
            className="stat-card"
            style={{
              textDecoration:
                "none",
            }}
          >

            <div className="stat-label">
              Profile
            </div>

            <div
              style={{
                marginTop: "8px",
                fontWeight: 600,
              }}
            >
              View Profile →
            </div>

          </a>

        </div>

      </section>

    </EamsShell>
  );
}

function WeekTimetable({
  attendance,
  setAttendance,
  user,
  onRefresh,
}: {
  attendance: Attendance[];
  setAttendance?: React.Dispatch<React.SetStateAction<Attendance[]>>;
  user?: User;
  onRefresh?: () => void;
}) {
  const today = new Date();
  const weekDays = useMemo(() => getWeekDays(today), []);
  const todayKey = formatDateKey(today);
  const [markingDate, setMarkingDate] = useState<string | null>(null);

  // Derive header date range (handles week spanning two months)
  const startMonth = weekDays[0].toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endMonth   = weekDays[6].toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  function getRecord(date: Date) {
    const key = formatDateKey(date);
    return attendance.find(
      (a) => a.date && a.date.toString().substring(0, 10) === key
    );
  }

  // Count marked days this week
  const markedCount = weekDays.filter(d => getRecord(d)).length;

  const handleQuickMark = async (
    e: React.MouseEvent,
    dateStr: string,
    statusType: "Present" | "Absent"
  ) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    // Instant optimistic update on UI
    if (setAttendance) {
      const existing = attendance.find((a) => a.date?.toString().substring(0, 10) === dateStr);
      const optimisticRecord: Attendance = {
        id: existing?.id || Date.now(),
        date: dateStr,
        employeeId: user.id,
        status: statusType,
        location: statusType === "Present" ? "Office" : undefined,
        shift: "Morning",
        remarks: `Quick marked as ${statusType}`,
      };

      setAttendance((prev) => {
        const withoutDate = prev.filter((a) => a.date?.toString().substring(0, 10) !== dateStr);
        return [optimisticRecord, ...withoutDate];
      });
    }

    try {
      setMarkingDate(dateStr);
      const statusId = statusType === "Present" ? 1 : 2;
      const locationId = statusType === "Present" ? 1 : null;

      const payload = {
        employeeId: user.id,
        date: dateStr,
        statusId: statusId,
        locationId: locationId,
        shiftId: 1,
        remarks: `Quick marked as ${statusType}`,
      };

      const token = typeof window !== "undefined" ? localStorage.getItem("eams_token") : null;
      const res = await fetch("http://localhost:5000/api/Attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      if (res.ok && onRefresh) {
        await onRefresh();
      }
    } catch (err) {
      console.error("Failed to mark attendance", err);
    } finally {
      setMarkingDate(null);
    }
  };

  return (
    <section
      style={{
        background: "linear-gradient(135deg, #1a1f2e 0%, #1e2340 100%)",
        borderRadius: "18px",
        padding: "24px",
        marginBottom: "24px",
        border: "1px solid rgba(99,102,241,0.15)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative glow */}
      <div style={{
        position: "absolute",
        top: "-60px",
        right: "-60px",
        width: "200px",
        height: "200px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "20px",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <h2 style={{ margin: 0, fontSize: "1.15rem", fontWeight: 700 }}>
              📅 This Week
            </h2>
            <span style={{
              background: markedCount === 7 ? "rgba(52,211,153,0.15)" : "rgba(99,102,241,0.15)",
              color: markedCount === 7 ? "#34d399" : "#a5b4fc",
              borderRadius: "20px",
              padding: "2px 10px",
              fontSize: "0.72rem",
              fontWeight: 700,
              border: `1px solid ${markedCount === 7 ? "rgba(52,211,153,0.3)" : "rgba(99,102,241,0.3)"}`,
            }}>
              {markedCount}/7 marked
            </span>
          </div>
          <div
            style={{
              fontSize: "0.78rem",
              color: "#6b7280",
            }}
          >
            {startMonth} – {endMonth}
          </div>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <a
            href="/employee/attendance"
            style={{
              fontSize: "0.8rem",
              color: "#ffffff",
              textDecoration: "none",
              fontWeight: 600,
              background: "#2563eb",
              borderRadius: "8px",
              padding: "6px 14px",
              transition: "background 0.2s",
              boxShadow: "0 2px 6px rgba(37,99,235,0.3)"
            }}
          >
            🗓️ Plan Whole Month →
          </a>
        </div>
      </div>

      {/* Week grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: "8px",
        }}
      >
        {weekDays.map((date, idx) => {
          const dateStr = formatDateKey(date);
          const record = getRecord(date);
          const statusName = extractStatusName(record);
          const locationName = extractLocationName(record);
          const isToday = dateStr === todayKey;
          const isPast = date < today && !isToday;
          const isMarking = markingDate === dateStr;
          const statusStyle = statusName
            ? getWeekStatusStyle(statusName, locationName)
            : null;

          const cardBg = statusStyle
            ? statusStyle.bg
            : isToday
            ? "rgba(99,102,241,0.08)"
            : isPast
            ? "rgba(255,255,255,0.02)"
            : "rgba(255,255,255,0.035)";

          return (
            <a
              key={idx}
              href="/employee/attendance"
              style={{
                borderRadius: "12px",
                padding: "10px 4px 8px",
                textAlign: "center",
                background: cardBg,
                border: isToday
                  ? "2px solid rgba(99,102,241,0.7)"
                  : statusStyle
                  ? "2px solid rgba(255,255,255,0.07)"
                  : "2px solid rgba(255,255,255,0.04)",
                textDecoration: "none",
                transition: "transform 0.15s, box-shadow 0.15s",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "140px",
                boxShadow: isToday ? "0 0 0 3px rgba(99,102,241,0.15)" : "none",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                (e.currentTarget as HTMLElement).style.boxShadow = isToday
                  ? "0 6px 20px rgba(99,102,241,0.3)"
                  : "0 4px 12px rgba(0,0,0,0.3)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = "";
                (e.currentTarget as HTMLElement).style.boxShadow = isToday ? "0 0 0 3px rgba(99,102,241,0.15)" : "none";
              }}
            >
              <div>
                {/* Day name */}
                <div
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: isToday ? "#a5b4fc" : statusStyle ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.35)",
                    textTransform: "uppercase",
                    marginBottom: "4px",
                  }}
                >
                  {DAY_LABELS[idx]}
                </div>

                {/* Date number */}
                <div
                  style={{
                    fontSize: isToday ? "1.25rem" : "1.05rem",
                    fontWeight: isToday ? 800 : 600,
                    color: statusStyle ? statusStyle.text : isToday ? "#e0e7ff" : isPast ? "#4b5563" : "#9ca3af",
                    marginBottom: "6px",
                    lineHeight: 1,
                  }}
                >
                  {date.getDate()}
                </div>

                {/* Status pill */}
                {statusStyle ? (
                  <div
                    style={{
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      padding: "3px 7px",
                      borderRadius: "6px",
                      background: "rgba(0,0,0,0.4)",
                      color: statusStyle.text,
                      display: "inline-block",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  >
                    {statusStyle.label}
                  </div>
                ) : (
                  <div style={{ fontSize: "0.65rem", color: "#6b7280", fontWeight: 600 }}>—</div>
                )}
              </div>

              {/* Quick Action P & A Buttons */}
              <div
                style={{
                  display: "flex",
                  gap: "4px",
                  justifyContent: "center",
                  marginTop: "8px",
                  paddingTop: "6px",
                  borderTop: "1px solid rgba(255,255,255,0.06)",
                }}
              >
                <button
                  type="button"
                  title="Mark Present"
                  disabled={isMarking}
                  onClick={(e) => handleQuickMark(e, dateStr, "Present")}
                  style={{
                    background: statusName?.toLowerCase() === "present" ? "#16a34a" : "rgba(22, 163, 74, 0.25)",
                    color: "#ffffff",
                    border: "1px solid rgba(34, 197, 94, 0.5)",
                    borderRadius: "4px",
                    width: "28px",
                    height: "24px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    transition: "all 0.15s",
                    boxShadow: statusName?.toLowerCase() === "present" ? "0 0 6px rgba(34, 197, 94, 0.6)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#16a34a";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = statusName?.toLowerCase() === "present" ? "#16a34a" : "rgba(22, 163, 74, 0.25)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  P
                </button>

                <button
                  type="button"
                  title="Mark Absent"
                  disabled={isMarking}
                  onClick={(e) => handleQuickMark(e, dateStr, "Absent")}
                  style={{
                    background: statusName?.toLowerCase() === "absent" ? "#dc2626" : "rgba(220, 38, 38, 0.25)",
                    color: "#ffffff",
                    border: "1px solid rgba(239, 68, 68, 0.5)",
                    borderRadius: "4px",
                    width: "28px",
                    height: "24px",
                    fontSize: "0.75rem",
                    fontWeight: 800,
                    cursor: "pointer",
                    display: "grid",
                    placeItems: "center",
                    transition: "all 0.15s",
                    boxShadow: statusName?.toLowerCase() === "absent" ? "0 0 6px rgba(220, 38, 38, 0.6)" : "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#dc2626";
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = statusName?.toLowerCase() === "absent" ? "#dc2626" : "rgba(220, 38, 38, 0.25)";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  A
                </button>
              </div>
            </a>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: "14px",
          flexWrap: "wrap",
          marginTop: "16px",
          paddingTop: "14px",
          borderTop: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {[
          { bg: "#1d4ed8", text: "WFO" },
          { bg: "#065f46", text: "WFH" },
          { bg: "#7c3aed", text: "Client" },
          { bg: "#b45309", text: "Sick" },
          { bg: "#0e7490", text: "Leave" },
          { bg: "#991b1b", text: "Absent" },
        ].map((l) => (
          <span
            key={l.text}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              fontSize: "0.7rem",
              color: "#6b7280",
            }}
          >
            <span
              style={{
                width: "9px",
                height: "9px",
                borderRadius: "3px",
                background: l.bg,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            {l.text}
          </span>
        ))}
      </div>
    </section>
  );
}