"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

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
  const [records, setRecords] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadAttendance = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/Attendance"
        );

        if (!response.ok) {
          throw new Error("Failed to load attendance");
        }

        const data = await response.json();
        setRecords(data);
      } catch (error) {
        console.error(error);
        setError(
          "Unable to load attendance reports. Make sure the backend is running."
        );
      } finally {
        setLoading(false);
      }
    };

    loadAttendance();
  }, []);

  const statistics = useMemo(() => {
    const present = records.filter(
      (r) => r.status?.name === "Present"
    ).length;

    const absent = records.filter(
      (r) => r.status?.name === "Absent"
    ).length;

    const sickLeave = records.filter(
      (r) => r.status?.name === "Sick Leave"
    ).length;

    const vacation = records.filter(
      (r) => r.status?.name === "Vacation"
    ).length;

    const office = records.filter(
      (r) => r.location?.name === "Office"
    ).length;

    const home = records.filter(
      (r) => r.location?.name === "Home"
    ).length;

    return {
      total: records.length,
      present,
      absent,
      sickLeave,
      vacation,
      office,
      home,
    };
  }, [records]);

  const monthlyData = useMemo(() => {
    const months: Record<
      string,
      {
        present: number;
        absent: number;
        leave: number;
        total: number;
      }
    > = {};

    records.forEach((record) => {
      const month = record.date.substring(0, 7);

      if (!months[month]) {
        months[month] = {
          present: 0,
          absent: 0,
          leave: 0,
          total: 0,
        };
      }

      months[month].total++;

      if (record.status?.name === "Present") {
        months[month].present++;
      }

      if (record.status?.name === "Absent") {
        months[month].absent++;
      }

      if (
        record.status?.name === "Sick Leave" ||
        record.status?.name === "Vacation"
      ) {
        months[month].leave++;
      }
    });

    return Object.entries(months)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([month, value]) => ({
        month,
        ...value,
      }));
  }, [records]);

  const formatMonth = (month: string) => {
    const date = new Date(`${month}-01`);

    return date.toLocaleDateString("en-IN", {
      month: "long",
      year: "numeric",
    });
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

    const csv = [
      header,
      ...rows,
    ]
      .map((row) =>
        row
          .map((value) =>
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

          <div style={navStyle(false)}>
            ⚙️ Settings
          </div>
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
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
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
              Analyze employee attendance and work patterns.
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
                title="Total Attendance"
                value={statistics.total}
                icon="📊"
              />

              <StatCard
                title="Present"
                value={statistics.present}
                icon="✅"
              />

              <StatCard
                title="Absent"
                value={statistics.absent}
                icon="❌"
              />

              <StatCard
                title="Leave"
                value={
                  statistics.sickLeave +
                  statistics.vacation
                }
                icon="🏖️"
              />
            </div>

            {/* WORK LOCATION */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, minmax(250px, 1fr))",
                gap: "20px",
                marginBottom: "25px",
              }}
            >
              <StatCard
                title="Work From Office"
                value={statistics.office}
                icon="🏢"
              />

              <StatCard
                title="Work From Home"
                value={statistics.home}
                icon="🏠"
              />
            </div>

            {/* MONTHLY SUMMARY */}

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
                Monthly Attendance Summary
              </h2>

              {monthlyData.length === 0 ? (
                <p style={{ color: "#6b7280" }}>
                  No attendance data available.
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
                          Month
                        </th>

                        <th style={tableCell}>
                          Total
                        </th>

                        <th style={tableCell}>
                          Present
                        </th>

                        <th style={tableCell}>
                          Absent
                        </th>

                        <th style={tableCell}>
                          Leave
                        </th>

                        <th style={tableCell}>
                          Attendance %
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {monthlyData.map((item) => {
                        const percentage =
                          item.total === 0
                            ? 0
                            : Math.round(
                                (item.present /
                                  item.total) *
                                  100
                              );

                        return (
                          <tr
                            key={item.month}
                            style={{
                              borderBottom:
                                "1px solid #eeeeee",
                            }}
                          >
                            <td style={tableCell}>
                              {formatMonth(item.month)}
                            </td>

                            <td style={tableCell}>
                              {item.total}
                            </td>

                            <td
                              style={{
                                ...tableCell,
                                color: "#15803d",
                                fontWeight: "bold",
                              }}
                            >
                              {item.present}
                            </td>

                            <td style={tableCell}>
                              {item.absent}
                            </td>

                            <td style={tableCell}>
                              {item.leave}
                            </td>

                            <td style={tableCell}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "100px",
                                    height: "8px",
                                    background:
                                      "#e5e7eb",
                                    borderRadius: "10px",
                                    overflow: "hidden",
                                  }}
                                >
                                  <div
                                    style={{
                                      width: `${percentage}%`,
                                      height: "100%",
                                      background:
                                        "#2563eb",
                                    }}
                                  />
                                </div>

                                {percentage}%
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* ATTENDANCE RECORDS */}

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
                      {records.map((record) => (
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
                              ?.fullName ?? "Om Prakash"}
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
                            {record.location?.name ??
                              "—"}
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
};