"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Employee = {
  id: number;
  fullName: string;
  email: string;
  departmentId: number;
  roleId: number;
  managerId: number | null;
  department?: {
    id: number;
    name: string;
  } | null;
  role?: {
    id: number;
    name: string;
  } | null;
};

type Attendance = {
  id: number;
  date: string;
  remarks?: string | null;
  employeeId: number;
  statusId: number;
  status?: {
    id: number;
    name: string;
  } | null;
  locationId?: number | null;
  location?: {
    id: number;
    name: string;
  } | null;
  shiftId?: number | null;
  shift?: {
    id: number;
    name: string;
  } | null;
  employee?: {
    id: number;
    fullName: string;
  } | null;
};

type LeaveRequest = {
  id: number;
  employeeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  status: string;
  employee?: {
    id: number;
    fullName: string;
    email: string;
  } | null;
};

const API = "http://localhost:5000/api";

// Current manager
const MANAGER_ID = 2;

export default function ManagerPage() {
  const [manager, setManager] = useState<Employee | null>(null);
  const [team, setTeam] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadManagerData = async () => {
    try {
      setError("");

      const [
        managerResponse,
        teamResponse,
        attendanceResponse,
        leaveResponse,
      ] = await Promise.all([
        fetch(`${API}/employees/manager/${MANAGER_ID}`),
        fetch(`${API}/employees/manager/${MANAGER_ID}/team`),
        fetch(`${API}/Attendance`),
        fetch(`${API}/LeaveRequests`),
      ]);

      if (!managerResponse.ok) {
        throw new Error("Unable to load manager information.");
      }

      if (!teamResponse.ok) {
        throw new Error("Unable to load team.");
      }

      if (!attendanceResponse.ok) {
        throw new Error("Unable to load attendance.");
      }

      if (!leaveResponse.ok) {
        throw new Error("Unable to load leave requests.");
      }

      const managerData = await managerResponse.json();
      const teamData = await teamResponse.json();
      const attendanceData = await attendanceResponse.json();
      const leaveData = await leaveResponse.json();

      setManager(managerData.manager);
      setTeam(teamData);
      setAttendance(attendanceData);
      setLeaveRequests(leaveData);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load Manager Portal."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadManagerData();
  }, []);

  const teamIds = useMemo(
    () => new Set(team.map((employee) => employee.id)),
    [team]
  );

  const teamAttendance = useMemo(
    () =>
      attendance.filter((record) =>
        teamIds.has(record.employeeId)
      ),
    [attendance, teamIds]
  );

  const teamLeaveRequests = useMemo(
    () =>
      leaveRequests.filter((request) =>
        teamIds.has(request.employeeId)
      ),
    [leaveRequests, teamIds]
  );

  const presentCount = teamAttendance.filter(
    (record) => record.status?.name === "Present"
  ).length;

  const absentCount = teamAttendance.filter(
    (record) => record.status?.name === "Absent"
  ).length;

  const pendingLeaves = teamLeaveRequests.filter(
    (request) => request.status === "Pending"
  ).length;

  const approveLeave = async (id: number) => {
    try {
      const response = await fetch(
        `${API}/LeaveRequests/${id}/approve`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error("Approve endpoint is not available yet.");
      }

      await loadManagerData();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Unable to approve leave."
      );
    }
  };

  const rejectLeave = async (id: number) => {
    try {
      const response = await fetch(
        `${API}/LeaveRequests/${id}/reject`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        throw new Error("Reject endpoint is not available yet.");
      }

      await loadManagerData();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : "Unable to reject leave."
      );
    }
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f8fc",
        fontFamily: "Arial, sans-serif",
        display: "flex",
      }}
    >
      {/* SIDEBAR */}

      <aside
        style={{
          width: "240px",
          minHeight: "100vh",
          background: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          padding: "25px 18px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontSize: "22px",
            fontWeight: "bold",
            marginBottom: "35px",
          }}
        >
          📅 EAMS
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <Link href="/" style={navStyle(false)}>
            🏠 Dashboard
          </Link>

          <Link
            href="/attendance/calendar"
            style={navStyle(false)}
          >
            📅 Attendance Calendar
          </Link>

          <Link
            href="/employees"
            style={navStyle(false)}
          >
            👥 Team Overview
          </Link>

          <Link
            href="/leave-requests"
            style={navStyle(false)}
          >
            📋 Leave Requests
          </Link>

          <Link
            href="/reports"
            style={navStyle(false)}
          >
            📊 Reports & Analytics
          </Link>

          <Link
            href="/manager"
            style={navStyle(true)}
          >
            👔 Manager Portal
          </Link>

          <Link
            href="/settings"
            style={navStyle(false)}
          >
            ⚙️ Settings
          </Link>
        </nav>

        {/* MANAGER INFO */}

        <div
          style={{
            position: "absolute",
            bottom: "25px",
            left: "18px",
            right: "18px",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "18px",
          }}
        >
          <strong>
            {manager?.fullName ?? "Rahul Sharma"}
          </strong>

          <div
            style={{
              color: "#6b7280",
              fontSize: "13px",
              marginTop: "4px",
            }}
          >
            Manager
          </div>
        </div>
      </aside>

      {/* MAIN */}

      <section
        style={{
          flex: 1,
          padding: "35px",
          overflowX: "auto",
        }}
      >
        {/* HEADER */}

        <div style={{ marginBottom: "30px" }}>
          <h1
            style={{
              fontSize: "30px",
              margin: 0,
              marginBottom: "8px",
            }}
          >
            Manager Dashboard
          </h1>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
            }}
          >
            Manage your team, attendance and leave requests.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              background: "#fef2f2",
              color: "#b91c1c",
              border: "1px solid #fecaca",
              padding: "14px",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            {error}
          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div
            style={{
              background: "#ffffff",
              padding: "30px",
              borderRadius: "14px",
              border: "1px solid #e5e7eb",
            }}
          >
            Loading Manager Portal...
          </div>
        ) : (
          <>
            {/* MANAGER HEADER */}

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "25px",
                marginBottom: "25px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "18px",
                }}
              >
                <div
                  style={{
                    width: "65px",
                    height: "65px",
                    borderRadius: "50%",
                    background: "#dbeafe",
                    color: "#1d4ed8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "25px",
                    fontWeight: "bold",
                  }}
                >
                  {manager?.fullName
                    ?.split(" ")
                    .map((name) => name[0])
                    .join("")
                    .substring(0, 2) ?? "RS"}
                </div>

                <div>
                  <h2
                    style={{
                      margin: 0,
                      marginBottom: "5px",
                    }}
                  >
                    Welcome,{" "}
                    {manager?.fullName ?? "Rahul Sharma"}
                  </h2>

                  <div
                    style={{
                      color: "#6b7280",
                      fontSize: "14px",
                    }}
                  >
                    {manager?.department?.name ??
                      "Engineering"}{" "}
                    • Manager
                  </div>
                </div>
              </div>
            </div>

            {/* STATISTICS */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(4, minmax(180px, 1fr))",
                gap: "18px",
                marginBottom: "25px",
              }}
            >
              <StatCard
                title="Team Members"
                value={team.length}
                icon="👥"
              />

              <StatCard
                title="Present"
                value={presentCount}
                icon="✅"
              />

              <StatCard
                title="Absent"
                value={absentCount}
                icon="❌"
              />

              <StatCard
                title="Pending Leave"
                value={pendingLeaves}
                icon="📋"
              />
            </div>

            {/* TEAM */}

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "25px",
                marginBottom: "25px",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  fontSize: "20px",
                }}
              >
                My Team
              </h2>

              {team.length === 0 ? (
                <p style={{ color: "#6b7280" }}>
                  No employees are assigned to you.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom:
                            "2px solid #e5e7eb",
                          textAlign: "left",
                        }}
                      >
                        <th style={tableCell}>
                          Employee
                        </th>

                        <th style={tableCell}>
                          Email
                        </th>

                        <th style={tableCell}>
                          Department
                        </th>

                        <th style={tableCell}>
                          Role
                        </th>

                        <th style={tableCell}>
                          Attendance
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {team.map((employee) => {
                        const employeeAttendance =
                          teamAttendance.filter(
                            (record) =>
                              record.employeeId ===
                              employee.id
                          );

                        const latest =
                          employeeAttendance.sort(
                            (a, b) =>
                              b.date.localeCompare(
                                a.date
                              )
                          )[0];

                        return (
                          <tr
                            key={employee.id}
                            style={{
                              borderBottom:
                                "1px solid #eeeeee",
                            }}
                          >
                            <td style={tableCell}>
                              <strong>
                                {employee.fullName}
                              </strong>
                            </td>

                            <td style={tableCell}>
                              {employee.email}
                            </td>

                            <td style={tableCell}>
                              {employee.department
                                ?.name ?? "—"}
                            </td>

                            <td style={tableCell}>
                              {employee.role?.name ??
                                "Employee"}
                            </td>

                            <td style={tableCell}>
                              {latest ? (
                                <StatusBadge
                                  status={
                                    latest.status
                                      ?.name ??
                                    "Unknown"
                                  }
                                />
                              ) : (
                                <span
                                  style={{
                                    color: "#6b7280",
                                  }}
                                >
                                  No record
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* LEAVE REQUESTS */}

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "25px",
                marginBottom: "25px",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  fontSize: "20px",
                }}
              >
                Team Leave Requests
              </h2>

              {teamLeaveRequests.length === 0 ? (
                <p style={{ color: "#6b7280" }}>
                  No leave requests from your team.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom:
                            "2px solid #e5e7eb",
                          textAlign: "left",
                        }}
                      >
                        <th style={tableCell}>
                          Employee
                        </th>

                        <th style={tableCell}>
                          Type
                        </th>

                        <th style={tableCell}>
                          Start
                        </th>

                        <th style={tableCell}>
                          End
                        </th>

                        <th style={tableCell}>
                          Reason
                        </th>

                        <th style={tableCell}>
                          Status
                        </th>

                        <th style={tableCell}>
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {teamLeaveRequests.map(
                        (request) => (
                          <tr
                            key={request.id}
                            style={{
                              borderBottom:
                                "1px solid #eeeeee",
                            }}
                          >
                            <td style={tableCell}>
                              {request.employee
                                ?.fullName ??
                                team.find(
                                  (e) =>
                                    e.id ===
                                    request.employeeId
                                )?.fullName ??
                                "Employee"}
                            </td>

                            <td style={tableCell}>
                              {request.leaveType}
                            </td>

                            <td style={tableCell}>
                              {request.startDate}
                            </td>

                            <td style={tableCell}>
                              {request.endDate}
                            </td>

                            <td style={tableCell}>
                              {request.reason || "—"}
                            </td>

                            <td style={tableCell}>
                              <StatusBadge
                                status={request.status}
                              />
                            </td>

                            <td style={tableCell}>
                              {request.status ===
                              "Pending" ? (
                                <div
                                  style={{
                                    display: "flex",
                                    gap: "7px",
                                  }}
                                >
                                  <button
                                    onClick={() =>
                                      approveLeave(
                                        request.id
                                      )
                                    }
                                    style={{
                                      background:
                                        "#16a34a",
                                      color:
                                        "#ffffff",
                                      border: "none",
                                      borderRadius:
                                        "6px",
                                      padding:
                                        "7px 10px",
                                      cursor:
                                        "pointer",
                                      fontSize:
                                        "12px",
                                      fontWeight:
                                        "bold",
                                    }}
                                  >
                                    Approve
                                  </button>

                                  <button
                                    onClick={() =>
                                      rejectLeave(
                                        request.id
                                      )
                                    }
                                    style={{
                                      background:
                                        "#dc2626",
                                      color:
                                        "#ffffff",
                                      border: "none",
                                      borderRadius:
                                        "6px",
                                      padding:
                                        "7px 10px",
                                      cursor:
                                        "pointer",
                                      fontSize:
                                        "12px",
                                      fontWeight:
                                        "bold",
                                    }}
                                  >
                                    Reject
                                  </button>
                                </div>
                              ) : (
                                <span
                                  style={{
                                    color: "#6b7280",
                                    fontSize: "13px",
                                  }}
                                >
                                  Completed
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ATTENDANCE */}

            <div
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "25px",
              }}
            >
              <h2
                style={{
                  marginTop: 0,
                  fontSize: "20px",
                }}
              >
                Team Attendance
              </h2>

              {teamAttendance.length === 0 ? (
                <p style={{ color: "#6b7280" }}>
                  No attendance records found.
                </p>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table
                    style={{
                      width: "100%",
                      borderCollapse: "collapse",
                    }}
                  >
                    <thead>
                      <tr
                        style={{
                          borderBottom:
                            "2px solid #e5e7eb",
                          textAlign: "left",
                        }}
                      >
                        <th style={tableCell}>
                          Date
                        </th>

                        <th style={tableCell}>
                          Employee
                        </th>

                        <th style={tableCell}>
                          Status
                        </th>

                        <th style={tableCell}>
                          Location
                        </th>

                        <th style={tableCell}>
                          Shift
                        </th>

                        <th style={tableCell}>
                          Remarks
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {teamAttendance
                        .sort((a, b) =>
                          b.date.localeCompare(
                            a.date
                          )
                        )
                        .map((record) => (
                          <tr
                            key={record.id}
                            style={{
                              borderBottom:
                                "1px solid #eeeeee",
                            }}
                          >
                            <td style={tableCell}>
                              {record.date}
                            </td>

                            <td style={tableCell}>
                              {record.employee
                                ?.fullName ??
                                team.find(
                                  (e) =>
                                    e.id ===
                                    record.employeeId
                                )?.fullName ??
                                "Employee"}
                            </td>

                            <td style={tableCell}>
                              <StatusBadge
                                status={
                                  record.status
                                    ?.name ??
                                  "Unknown"
                                }
                              />
                            </td>

                            <td style={tableCell}>
                              {record.location?.name ??
                                "—"}
                            </td>

                            <td style={tableCell}>
                              {record.shift?.name ??
                                "—"}
                            </td>

                            <td style={tableCell}>
                              {record.remarks || "—"}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </main>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "22px",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          color: "#64748b",
          fontSize: "14px",
        }}
      >
        <span>{title}</span>

        <span style={{ fontSize: "20px" }}>
          {icon}
        </span>
      </div>

      <div
        style={{
          fontSize: "32px",
          fontWeight: "bold",
          marginTop: "15px",
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<
    string,
    {
      background: string;
      color: string;
    }
  > = {
    Present: {
      background: "#dcfce7",
      color: "#166534",
    },

    Absent: {
      background: "#fee2e2",
      color: "#991b1b",
    },

    Pending: {
      background: "#fef3c7",
      color: "#92400e",
    },

    Approved: {
      background: "#dcfce7",
      color: "#166534",
    },

    Rejected: {
      background: "#fee2e2",
      color: "#991b1b",
    },

    "Sick Leave": {
      background: "#fef3c7",
      color: "#92400e",
    },

    Vacation: {
      background: "#dbeafe",
      color: "#1d4ed8",
    },
  };

  const current = styles[status] ?? {
    background: "#f1f5f9",
    color: "#475569",
  };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "5px 10px",
        borderRadius: "20px",
        background: current.background,
        color: current.color,
        fontSize: "12px",
        fontWeight: "bold",
      }}
    >
      {status}
    </span>
  );
}

function navStyle(active: boolean) {
  return {
    display: "block",
    padding: "11px 13px",
    borderRadius: "8px",
    textDecoration: "none",
    color: active ? "#2563eb" : "#374151",
    background: active ? "#eff6ff" : "transparent",
    fontSize: "14px",
    fontWeight: active ? "bold" : "normal",
  };
}

const tableCell = {
  padding: "13px 10px",
  fontSize: "14px",
};