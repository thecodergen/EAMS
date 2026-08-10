"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Employee = {
  id: number;
  fullName: string;
  email: string;
  department: {
    id: number;
    name: string;
  } | null;
  role: {
    id: number;
    name: string;
  } | null;
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:5000/api/employees")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load employees");
        }

        return response.json();
      })
      .then((data) => {
        setEmployees(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Unable to load employees.");
        setLoading(false);
      });
  }, []);

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
            style={navStyle(true)}
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
      </aside>

      {/* MAIN CONTENT */}

      <section
        style={{
          flex: 1,
          padding: "35px",
        }}
      >
        <div style={{ marginBottom: "30px" }}>
          <h1
            style={{
              fontSize: "30px",
              margin: 0,
              marginBottom: "8px",
            }}
          >
            Team Overview
          </h1>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
            }}
          >
            View employees and their organizational information.
          </p>
        </div>

        {/* SUMMARY */}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "18px",
            marginBottom: "25px",
          }}
        >
          <SummaryCard
            title="Total Employees"
            value={employees.length}
            icon="👥"
          />

          <SummaryCard
            title="Departments"
            value={
              new Set(
                employees
                  .map((employee) => employee.department?.name)
                  .filter(Boolean)
              ).size
            }
            icon="🏢"
          />

          <SummaryCard
            title="Roles"
            value={
              new Set(
                employees
                  .map((employee) => employee.role?.name)
                  .filter(Boolean)
              ).size
            }
            icon="💼"
          />
        </div>

        {/* EMPLOYEE TABLE */}

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
              marginBottom: "20px",
              fontSize: "20px",
            }}
          >
            Employees
          </h2>

          {loading && <p>Loading employees...</p>}

          {error && (
            <p style={{ color: "red" }}>
              {error}
            </p>
          )}

          {!loading && !error && employees.length === 0 && (
            <p>No employees found.</p>
          )}

          {!loading && !error && employees.length > 0 && (
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
                      borderBottom: "2px solid #e5e7eb",
                      textAlign: "left",
                    }}
                  >
                    <th style={tableCell}>ID</th>
                    <th style={tableCell}>Name</th>
                    <th style={tableCell}>Email</th>
                    <th style={tableCell}>Department</th>
                    <th style={tableCell}>Role</th>
                    <th style={tableCell}>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {employees.map((employee) => (
                    <tr
                      key={employee.id}
                      style={{
                        borderBottom:
                          "1px solid #eeeeee",
                      }}
                    >
                      <td style={tableCell}>
                        {employee.id}
                      </td>

                      <td
                        style={{
                          ...tableCell,
                          fontWeight: "bold",
                        }}
                      >
                        {employee.fullName}
                      </td>

                      <td style={tableCell}>
                        {employee.email}
                      </td>

                      <td style={tableCell}>
                        {employee.department?.name ?? "—"}
                      </td>

                      <td style={tableCell}>
                        {employee.role?.name ?? "—"}
                      </td>

                      <td style={tableCell}>
                        <Link
                          href={`/attendance/calendar?employeeId=${employee.id}`}
                          style={{
                            background: "#2563eb",
                            color: "#ffffff",
                            padding: "7px 12px",
                            borderRadius: "6px",
                            textDecoration: "none",
                            fontSize: "13px",
                          }}
                        >
                          Attendance
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function SummaryCard({
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
        padding: "20px",
        boxShadow:
          "0 2px 8px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "12px",
        }}
      >
        <span
          style={{
            color: "#6b7280",
            fontSize: "14px",
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
  padding: "13px 10px",
  fontSize: "14px",
};