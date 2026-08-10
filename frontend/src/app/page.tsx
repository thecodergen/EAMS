"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Attendance = {
  id: number;
  date: string;
  remarks: string | null;
  employeeId: number;
  status: {
    id: number;
    name: string;
  } | null;
  location: {
    id: number;
    name: string;
  } | null;
  shift: {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
  } | null;
};

type Employee = {
  id: number;
  fullName: string;
  email: string;
  department: {
    name: string;
  } | null;
  role: {
    name: string;
  } | null;
};

export default function Dashboard() {
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const employeeId = 1;

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [employeeResponse, attendanceResponse] =
          await Promise.all([
            fetch("http://localhost:5000/api/employees"),
            fetch("http://localhost:5000/api/Attendance"),
          ]);

        if (!employeeResponse.ok || !attendanceResponse.ok) {
          throw new Error("Failed to load dashboard data");
        }

        const employees = await employeeResponse.json();
        const attendanceData = await attendanceResponse.json();

        const currentEmployee = employees.find(
          (item: Employee) => item.id === employeeId
        );

        setEmployee(currentEmployee ?? null);
        setAttendance(
          attendanceData.filter(
            (item: Attendance) =>
              item.employeeId === employeeId
          )
        );
      } catch (err) {
        console.error(err);
        setError("Unable to load EAMS dashboard.");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const presentDays = attendance.filter(
    (item) => item.status?.name === "Present"
  ).length;

  const officeDays = attendance.filter(
    (item) =>
      item.status?.name === "Present" &&
      item.location?.name === "Office"
  ).length;

  const homeDays = attendance.filter(
    (item) =>
      item.status?.name === "Present" &&
      item.location?.name === "Home"
  ).length;

  const sickLeaveDays = attendance.filter(
    (item) => item.status?.name === "Sick Leave"
  ).length;

  const vacationDays = attendance.filter(
    (item) => item.status?.name === "Vacation"
  ).length;

  if (loading) {
    return (
      <main
        style={{
          padding: "40px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading EAMS dashboard...
      </main>
    );
  }

  if (error) {
    return (
      <main
        style={{
          padding: "40px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <p style={{ color: "red" }}>{error}</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f8fc",
        fontFamily: "Arial, sans-serif",
        display: "flex",
      }}
    >
      {/* ================= SIDEBAR ================= */}

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
          <Link
            href="/"
            style={navStyle(true)}
          >
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

          <div style={navStyle(false)}>
            📋 Leave Requests
          </div>

          <div style={navStyle(false)}>
            📊 Reports & Analytics
          </div>

          <div style={navStyle(false)}>
            ⚙️ Settings
          </div>
        </nav>

        <div
          style={{
            borderTop: "1px solid #e5e7eb",
            marginTop: "40px",
            paddingTop: "20px",
          }}
        >
          <div
            style={{
              fontWeight: "bold",
              marginBottom: "5px",
            }}
          >
            {employee?.fullName ?? "Employee"}
          </div>

          <div
            style={{
              fontSize: "13px",
              color: "#6b7280",
            }}
          >
            {employee?.role?.name ?? "Employee"}
          </div>
        </div>
      </aside>

      {/* ================= MAIN ================= */}

      <section
        style={{
          flex: 1,
          padding: "35px",
          maxWidth: "1400px",
        }}
      >
        <div
          style={{
            marginBottom: "30px",
          }}
        >
          <h1
            style={{
              fontSize: "30px",
              margin: 0,
              marginBottom: "8px",
            }}
          >
            Attendance Tracker
          </h1>

          <p
            style={{
              color: "#6b7280",
              margin: 0,
            }}
          >
            Manage and monitor your employee attendance.
          </p>
        </div>

        {/* ================= SUMMARY CARDS ================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(5, minmax(150px, 1fr))",
            gap: "16px",
            marginBottom: "30px",
          }}
        >
          <SummaryCard
            title="Total Days Present"
            value={presentDays}
            label="days"
            icon="📅"
          />

          <SummaryCard
            title="Work From Office"
            value={officeDays}
            label="days"
            icon="🏢"
          />

          <SummaryCard
            title="Work From Home"
            value={homeDays}
            label="days"
            icon="🏠"
          />

          <SummaryCard
            title="Sick Leave"
            value={sickLeaveDays}
            label="days"
            icon="🤒"
          />

          <SummaryCard
            title="Vacation Days"
            value={vacationDays}
            label="days"
            icon="🌴"
          />
        </div>

        {/* ================= CONTENT ================= */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 350px",
            gap: "22px",
          }}
        >
          {/* Attendance Overview */}

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "14px",
              padding: "25px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "20px",
                  }}
                >
                  Recent Attendance
                </h2>

                <p
                  style={{
                    color: "#6b7280",
                    fontSize: "14px",
                  }}
                >
                  Attendance records from SQL Server
                </p>
              </div>

              <Link
                href="/attendance/calendar"
                style={{
                  background: "#2563eb",
                  color: "#ffffff",
                  padding: "10px 15px",
                  borderRadius: "7px",
                  textDecoration: "none",
                  fontSize: "14px",
                }}
              >
                Open Calendar
              </Link>
            </div>

            {attendance.length === 0 ? (
              <p>No attendance records found.</p>
            ) : (
              <div
                style={{
                  overflowX: "auto",
                }}
              >
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
                        Status
                      </th>

                      <th style={tableCell}>
                        Location
                      </th>

                      <th style={tableCell}>
                        Shift
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {[...attendance]
                      .sort(
                        (a, b) =>
                          b.date.localeCompare(
                            a.date
                          )
                      )
                      .slice(0, 8)
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
                            {record.status?.name ??
                              "—"}
                          </td>

                          <td style={tableCell}>
                            {record.location?.name ??
                              "—"}
                          </td>

                          <td style={tableCell}>
                            {record.shift?.name ??
                              "—"}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Employee Card */}

          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "14px",
              padding: "25px",
              height: "fit-content",
            }}
          >
            <h2
              style={{
                marginTop: 0,
                fontSize: "20px",
              }}
            >
              Employee Profile
            </h2>

            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                marginBottom: "10px",
              }}
            >
              {employee?.fullName}
            </div>

            <div
              style={{
                color: "#6b7280",
                marginBottom: "8px",
              }}
            >
              {employee?.email}
            </div>

            <div
              style={{
                color: "#6b7280",
                marginBottom: "8px",
              }}
            >
              Department:{" "}
              {employee?.department?.name ??
                "—"}
            </div>

            <div
              style={{
                color: "#6b7280",
                marginBottom: "20px",
              }}
            >
              Role:{" "}
              {employee?.role?.name ??
                "—"}
            </div>

            <Link
              href="/attendance/calendar"
              style={{
                display: "block",
                textAlign: "center",
                background: "#111827",
                color: "white",
                padding: "12px",
                borderRadius: "8px",
                textDecoration: "none",
              }}
            >
              Manage Attendance
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ================= COMPONENTS ================= */

function SummaryCard({
  title,
  value,
  label,
  icon,
}: {
  title: string;
  value: number;
  label: string;
  icon: string;
}) {
  return (
    <div
      style={{
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: "14px",
        padding: "20px",
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "15px",
        }}
      >
        <span
          style={{
            fontSize: "13px",
            color: "#6b7280",
          }}
        >
          {title}
        </span>

        <span>{icon}</span>
      </div>

      <div
        style={{
          fontSize: "30px",
          fontWeight: "bold",
        }}
      >
        {value}
        <span
          style={{
            fontSize: "13px",
            fontWeight: "normal",
            color: "#6b7280",
            marginLeft: "5px",
          }}
        >
          {label}
        </span>
      </div>
    </div>
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
  padding: "12px 10px",
  fontSize: "14px",
};