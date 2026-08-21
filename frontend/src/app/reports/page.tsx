"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API = "http://localhost:5000/api";

type AttendanceSummary = {
  totalRecords: number;
  present: number;
  absent: number;
  attendancePercentage: number;
};

type WfhWfo = {
  workFromOffice: number;
  workFromHome: number;
  total: number;
};

type LeaveSummary = {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
};

type DepartmentReport = {
  department: string;
  employeeCount: number;
};

type MonthlyReport = {
  year: number;
  month: number;
  totalRecords: number;
  present: number;
  absent: number;
  workFromOffice: number;
  workFromHome: number;
  attendancePercentage: number;
};

type Attendance = {
  id: number;
  date: string;
  remarks?: string | null;
  employeeId: number;
  status?: {
    id: number;
    name: string;
  } | null;
  location?: {
    id: number;
    name: string;
  } | null;
  shift?: {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
  } | null;
  employee?: {
    id: number;
    fullName: string;
    email: string;
  } | null;
};

export default function ReportsPage() {
  const [attendanceSummary, setAttendanceSummary] =
    useState<AttendanceSummary | null>(null);

  const [wfhWfo, setWfhWfo] = useState<WfhWfo | null>(null);

  const [leaveSummary, setLeaveSummary] =
    useState<LeaveSummary | null>(null);

  const [departmentReport, setDepartmentReport] =
    useState<DepartmentReport[]>([]);

  const [monthlyReport, setMonthlyReport] =
    useState<MonthlyReport | null>(null);

  const [records, setRecords] = useState<Attendance[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const currentDate = new Date();

  const [selectedYear, setSelectedYear] = useState(
    currentDate.getFullYear()
  );

  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1
  );

  async function loadReports() {
    try {
      setLoading(true);
      setError("");

      const [
        attendanceResponse,
        wfhWfoResponse,
        leaveResponse,
        departmentResponse,
        monthlyResponse,
        recordsResponse,
      ] = await Promise.all([
        fetch(`${API}/reports/attendance-summary`),
        fetch(`${API}/reports/wfh-wfo`),
        fetch(`${API}/reports/leave-summary`),
        fetch(`${API}/reports/department`),
        fetch(
          `${API}/reports/monthly?year=${selectedYear}&month=${selectedMonth}`
        ),
        fetch(`${API}/Attendance`),
      ]);

      if (
        !attendanceResponse.ok ||
        !wfhWfoResponse.ok ||
        !leaveResponse.ok ||
        !departmentResponse.ok ||
        !monthlyResponse.ok ||
        !recordsResponse.ok
      ) {
        throw new Error("Failed to load reports");
      }

      const [
        attendanceData,
        wfhWfoData,
        leaveData,
        departmentData,
        monthlyData,
        recordsData,
      ] = await Promise.all([
        attendanceResponse.json(),
        wfhWfoResponse.json(),
        leaveResponse.json(),
        departmentResponse.json(),
        monthlyResponse.json(),
        recordsResponse.json(),
      ]);

      setAttendanceSummary(attendanceData);
      setWfhWfo(wfhWfoData);
      setLeaveSummary(leaveData);
      setDepartmentReport(departmentData);
      setMonthlyReport(monthlyData);
      setRecords(recordsData);
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load reports. Make sure the ASP.NET Core backend is running on http://localhost:5000."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadReports();
  }, [selectedYear, selectedMonth]);

  const formatMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).toLocaleDateString(
      "en-IN",
      {
        month: "long",
        year: "numeric",
      }
    );
  };

  const exportCSV = () => {
    if (records.length === 0) {
      return;
    }

    const header = [
      "Date",
      "Employee",
      "Status",
      "Location",
      "Shift",
      "Remarks",
    ];

    const rows = records.map((record) => [
      record.date,
      record.employee?.fullName ?? "Unknown",
      record.status?.name ?? "",
      record.location?.name ?? "",
      record.shift?.name ?? "",
      record.remarks ?? "",
    ]);

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map(
            (value) =>
              `"${String(value).replaceAll('"', '""')}"`
          )
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = url;
    link.download = "EAMS-Attendance-Report.csv";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);

    URL.revokeObjectURL(url);
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
            style={navStyle(true)}
          >
            📊 Reports & Analytics
          </Link>

          <Link
            href="/settings"
            style={navStyle(false)}
          >
            ⚙️ Settings
          </Link>
        </nav>
      </aside>

      {/* CONTENT */}

      <section
        style={{
          flex: 1,
          padding: "35px",
          overflowX: "auto",
        }}
      >
        {/* HEADER */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "30px",
                margin: 0,
                marginBottom: "8px",
              }}
            >
              Reports & Analytics
            </h1>

            <p
              style={{
                margin: 0,
                color: "#6b7280",
              }}
            >
              Real-time attendance, leave and workforce analytics.
            </p>
          </div>

          <button
            onClick={exportCSV}
            disabled={records.length === 0}
            style={{
              background:
                records.length === 0
                  ? "#9ca3af"
                  : "#2563eb",
              color: "#ffffff",
              border: "none",
              borderRadius: "8px",
              padding: "12px 18px",
              fontWeight: "bold",
              cursor:
                records.length === 0
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            📥 Export CSV
          </button>
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
            Loading reports...
          </div>
        ) : (
          <>
            {/* TOP STATISTICS */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "18px",
                marginBottom: "25px",
              }}
            >
              <StatCard
                title="Attendance"
                value={`${attendanceSummary?.attendancePercentage ?? 0}%`}
                icon="📊"
              />

              <StatCard
                title="Present"
                value={attendanceSummary?.present ?? 0}
                icon="✅"
              />

              <StatCard
                title="Absent"
                value={attendanceSummary?.absent ?? 0}
                icon="❌"
              />

              <StatCard
                title="Total Records"
                value={attendanceSummary?.totalRecords ?? 0}
                icon="📋"
              />
            </div>

            {/* WFH / WFO */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "20px",
                marginBottom: "25px",
              }}
            >
              <StatCard
                title="Work From Office"
                value={wfhWfo?.workFromOffice ?? 0}
                icon="🏢"
              />

              <StatCard
                title="Work From Home"
                value={wfhWfo?.workFromHome ?? 0}
                icon="🏠"
              />

              <StatCard
                title="Total Leave Requests"
                value={leaveSummary?.total ?? 0}
                icon="🏖️"
              />

              <StatCard
                title="Approved Leaves"
                value={leaveSummary?.approved ?? 0}
                icon="✅"
              />
            </div>

            {/* LEAVE SUMMARY */}

            <section
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "25px",
                marginBottom: "25px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                Leave Statistics
              </h2>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(160px, 1fr))",
                  gap: "15px",
                }}
              >
                <MiniCard
                  title="Pending"
                  value={leaveSummary?.pending ?? 0}
                />

                <MiniCard
                  title="Approved"
                  value={leaveSummary?.approved ?? 0}
                />

                <MiniCard
                  title="Rejected"
                  value={leaveSummary?.rejected ?? 0}
                />
              </div>
            </section>

            {/* DEPARTMENT REPORT */}

            <section
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "25px",
                marginBottom: "25px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                Department-wise Report
              </h2>

              {departmentReport.length === 0 ? (
                <p style={{ color: "#6b7280" }}>
                  No department data available.
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
                      <tr>
                        <th style={tableCell}>
                          Department
                        </th>

                        <th style={tableCell}>
                          Employees
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {departmentReport.map((item) => (
                        <tr key={item.department}>
                          <td style={tableCell}>
                            {item.department}
                          </td>

                          <td style={tableCell}>
                            <strong>
                              {item.employeeCount}
                            </strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* MONTHLY REPORT */}

            <section
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
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "15px",
                  flexWrap: "wrap",
                  marginBottom: "20px",
                }}
              >
                <div>
                  <h2 style={{ margin: 0 }}>
                    Monthly Attendance Report
                  </h2>

                  <p
                    style={{
                      color: "#6b7280",
                      marginBottom: 0,
                    }}
                  >
                    {monthlyReport
                      ? formatMonth(
                          monthlyReport.month,
                          monthlyReport.year
                        )
                      : "Monthly report"}
                  </p>
                </div>

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                  }}
                >
                  <select
                    value={selectedMonth}
                    onChange={(e) =>
                      setSelectedMonth(
                        Number(e.target.value)
                      )
                    }
                    style={selectStyle}
                  >
                    {Array.from(
                      { length: 12 },
                      (_, index) => index + 1
                    ).map((month) => (
                      <option
                        key={month}
                        value={month}
                      >
                        {new Date(
                          2026,
                          month - 1,
                          1
                        ).toLocaleDateString("en-IN", {
                          month: "long",
                        })}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedYear}
                    onChange={(e) =>
                      setSelectedYear(
                        Number(e.target.value)
                      )
                    }
                    style={selectStyle}
                  >
                    <option value={2026}>
                      2026
                    </option>

                    <option value={2025}>
                      2025
                    </option>

                    <option value={2027}>
                      2027
                    </option>
                  </select>
                </div>
              </div>

              {monthlyReport && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(160px, 1fr))",
                    gap: "15px",
                  }}
                >
                  <MiniCard
                    title="Total Records"
                    value={monthlyReport.totalRecords}
                  />

                  <MiniCard
                    title="Present"
                    value={monthlyReport.present}
                  />

                  <MiniCard
                    title="Absent"
                    value={monthlyReport.absent}
                  />

                  <MiniCard
                    title="WFO"
                    value={monthlyReport.workFromOffice}
                  />

                  <MiniCard
                    title="WFH"
                    value={monthlyReport.workFromHome}
                  />

                  <MiniCard
                    title="Attendance"
                    value={`${monthlyReport.attendancePercentage}%`}
                  />
                </div>
              )}
            </section>

            {/* ATTENDANCE DETAILS */}

            <section
              style={{
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: "14px",
                padding: "25px",
              }}
            >
              <h2 style={{ marginTop: 0 }}>
                Attendance Details
              </h2>

              {records.length === 0 ? (
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
                      <tr>
                        <th style={tableCell}>Date</th>
                        <th style={tableCell}>Employee</th>
                        <th style={tableCell}>Status</th>
                        <th style={tableCell}>Location</th>
                        <th style={tableCell}>Shift</th>
                        <th style={tableCell}>Remarks</th>
                      </tr>
                    </thead>

                    <tbody>
                      {records.map((record) => (
                        <tr key={record.id}>
                          <td style={tableCell}>
                            {record.date}
                          </td>

                          <td style={tableCell}>
                            {record.employee?.fullName ??
                              "Unknown"}
                          </td>

                          <td style={tableCell}>
                            <StatusBadge
                              status={
                                record.status?.name ??
                                "Unknown"
                              }
                            />
                          </td>

                          <td style={tableCell}>
                            {record.location?.name ?? "—"}
                          </td>

                          <td style={tableCell}>
                            {record.shift?.name ?? "—"}
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
            </section>
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
  value: number | string;
  icon: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "22px",
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.04)",
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

function MiniCard({
  title,
  value,
}: {
  title: string;
  value: number | string;
}) {
  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        padding: "18px",
      }}
    >
      <div
        style={{
          color: "#64748b",
          fontSize: "13px",
          marginBottom: "8px",
        }}
      >
        {title}
      </div>

      <div
        style={{
          fontSize: "24px",
          fontWeight: "bold",
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
  borderBottom: "1px solid #eeeeee",
};

const selectStyle = {
  padding: "9px 12px",
  border: "1px solid #d1d5db",
  borderRadius: "8px",
  background: "#ffffff",
  cursor: "pointer",
};