"use client";

import { useEffect, useState } from "react";

const API = "http://localhost:5000/api";

type Employee = {
  id: number;
  fullName: string;
  email: string;
  department?: {
    id: number;
    name: string;
  } | null;
  role?: {
    id: number;
    name: string;
  } | null;
};

type LeaveRequest = {
  id: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason?: string | null;
  status: string;
  employee?: {
    fullName: string;
  } | null;
};

export default function AdminPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadAdminData() {
    try {
      setLoading(true);
      setError("");

      const [employeesResponse, leaveResponse] = await Promise.all([
        fetch(`${API}/employees`),
        fetch(`${API}/LeaveRequests`),
      ]);

      if (!employeesResponse.ok) {
        throw new Error(
          `Employees API failed: ${employeesResponse.status}`
        );
      }

      if (!leaveResponse.ok) {
        throw new Error(
          `Leave Requests API failed: ${leaveResponse.status}`
        );
      }

      const employeeData: Employee[] =
        await employeesResponse.json();

      const leaveData: LeaveRequest[] =
        await leaveResponse.json();

      setEmployees(employeeData);
      setLeaveRequests(leaveData);
    } catch (err) {
      console.error("Admin API error:", err);
      setError(
        "Unable to load Admin Portal. Make sure ASP.NET Core API is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  const managers = employees.filter(
    (employee) => employee.role?.name === "Manager"
  );

  const pendingLeaves = leaveRequests.filter(
    (request) => request.status === "Pending"
  );

  const approvedLeaves = leaveRequests.filter(
    (request) => request.status === "Approved"
  );

  return (
    <main
      style={{
        padding: "32px",
        background: "#f5f7fb",
        minHeight: "100vh",
      }}
    >
      <h1
        style={{
          fontSize: "32px",
          fontWeight: 700,
          marginBottom: "8px",
        }}
      >
        Admin Dashboard
      </h1>

      <p
        style={{
          color: "#64748b",
          marginBottom: "20px",
        }}
      >
        Manage employees, attendance, departments, roles and leave
        requests.
      </p>

      {error && (
        <div
          style={{
            background: "#fee2e2",
            color: "#b91c1c",
            padding: "14px",
            borderRadius: "8px",
            marginTop: "20px",
            marginBottom: "20px",
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ marginTop: "30px" }}>
          Loading Admin Portal...
        </p>
      ) : (
        <>
          {/* =========================
              STATISTICS
          ========================== */}

          <section
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
              marginTop: "30px",
            }}
          >
            <StatCard
              title="Total Employees"
              value={employees.length}
            />

            <StatCard
              title="Managers"
              value={managers.length}
            />

            <StatCard
              title="Pending Leaves"
              value={pendingLeaves.length}
            />

            <StatCard
              title="Approved Leaves"
              value={approvedLeaves.length}
            />
          </section>

          {/* =========================
              EMPLOYEES
          ========================== */}

          <section
            style={{
              background: "white",
              marginTop: "30px",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
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
              <h2
                style={{
                  fontSize: "22px",
                  margin: 0,
                }}
              >
                Employees
              </h2>

              <button
                style={{
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  padding: "10px 18px",
                  borderRadius: "7px",
                  cursor: "pointer",
                }}
                onClick={() =>
                  alert("Add Employee feature will be added next.")
                }
              >
                + Add Employee
              </button>
            </div>

            {employees.length === 0 ? (
              <p style={{ color: "#64748b" }}>
                No employees found.
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
                      <th style={thStyle}>ID</th>
                      <th style={thStyle}>Name</th>
                      <th style={thStyle}>Email</th>
                      <th style={thStyle}>Department</th>
                      <th style={thStyle}>Role</th>
                      <th style={thStyle}>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {employees.map((employee) => (
                      <tr key={employee.id}>
                        <td style={tdStyle}>
                          {employee.id}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight: 600,
                          }}
                        >
                          {employee.fullName}
                        </td>

                        <td style={tdStyle}>
                          {employee.email}
                        </td>

                        <td style={tdStyle}>
                          {employee.department?.name ?? "-"}
                        </td>

                        <td style={tdStyle}>
                          {employee.role?.name ?? "-"}
                        </td>

                        <td style={tdStyle}>
                          <button
                            style={{
                              background: "#2563eb",
                              color: "white",
                              border: "none",
                              padding: "8px 14px",
                              borderRadius: "6px",
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              alert(
                                `Manage employee: ${employee.fullName}`
                              )
                            }
                          >
                            Manage
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* =========================
              PENDING LEAVE REQUESTS
          ========================== */}

          <section
            style={{
              background: "white",
              marginTop: "30px",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h2
              style={{
                fontSize: "22px",
                marginBottom: "20px",
              }}
            >
              Pending Leave Requests
            </h2>

            {pendingLeaves.length === 0 ? (
              <p style={{ color: "#64748b" }}>
                No pending leave requests.
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
                      <th style={thStyle}>Employee</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Start</th>
                      <th style={thStyle}>End</th>
                      <th style={thStyle}>Reason</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pendingLeaves.map((request) => (
                      <tr key={request.id}>
                        <td style={tdStyle}>
                          {request.employee?.fullName ?? "-"}
                        </td>

                        <td style={tdStyle}>
                          {request.leaveType}
                        </td>

                        <td style={tdStyle}>
                          {request.startDate}
                        </td>

                        <td style={tdStyle}>
                          {request.endDate}
                        </td>

                        <td style={tdStyle}>
                          {request.reason ?? "-"}
                        </td>

                        <td style={tdStyle}>
                          <span
                            style={{
                              background: "#fef3c7",
                              color: "#92400e",
                              padding: "5px 10px",
                              borderRadius: "20px",
                              fontSize: "13px",
                              fontWeight: 600,
                            }}
                          >
                            {request.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {/* =========================
              ALL LEAVE REQUESTS
          ========================== */}

          <section
            style={{
              background: "white",
              marginTop: "30px",
              padding: "24px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
            }}
          >
            <h2
              style={{
                fontSize: "22px",
                marginBottom: "20px",
              }}
            >
              Leave Request History
            </h2>

            {leaveRequests.length === 0 ? (
              <p style={{ color: "#64748b" }}>
                No leave requests found.
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
                      <th style={thStyle}>Employee</th>
                      <th style={thStyle}>Type</th>
                      <th style={thStyle}>Start</th>
                      <th style={thStyle}>End</th>
                      <th style={thStyle}>Reason</th>
                      <th style={thStyle}>Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {leaveRequests.map((request) => (
                      <tr key={request.id}>
                        <td style={tdStyle}>
                          {request.employee?.fullName ?? "-"}
                        </td>

                        <td style={tdStyle}>
                          {request.leaveType}
                        </td>

                        <td style={tdStyle}>
                          {request.startDate}
                        </td>

                        <td style={tdStyle}>
                          {request.endDate}
                        </td>

                        <td style={tdStyle}>
                          {request.reason ?? "-"}
                        </td>

                        <td style={tdStyle}>
                          <StatusBadge
                            status={request.status}
                          />
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
    </main>
  );
}

/* =========================
   STAT CARD
========================= */

function StatCard({
  title,
  value,
}: {
  title: string;
  value: number;
}) {
  return (
    <div
      style={{
        background: "white",
        padding: "24px",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
      }}
    >
      <p
        style={{
          color: "#64748b",
          margin: 0,
          fontSize: "14px",
        }}
      >
        {title}
      </p>

      <h2
        style={{
          fontSize: "32px",
          marginTop: "12px",
          marginBottom: 0,
        }}
      >
        {value}
      </h2>
    </div>
  );
}

/* =========================
   STATUS BADGE
========================= */

function StatusBadge({
  status,
}: {
  status: string;
}) {
  let background = "#e5e7eb";
  let color = "#374151";

  if (status === "Pending") {
    background = "#fef3c7";
    color = "#92400e";
  }

  if (status === "Approved") {
    background = "#dcfce7";
    color = "#166534";
  }

  if (status === "Rejected") {
    background = "#fee2e2";
    color = "#991b1b";
  }

  return (
    <span
      style={{
        background,
        color,
        padding: "5px 10px",
        borderRadius: "20px",
        fontSize: "13px",
        fontWeight: 600,
      }}
    >
      {status}
    </span>
  );
}

/* =========================
   TABLE STYLES
========================= */

const thStyle = {
  textAlign: "left" as const,
  padding: "12px",
  borderBottom: "1px solid #e2e8f0",
  fontSize: "14px",
};

const tdStyle = {
  padding: "12px",
  borderBottom: "1px solid #e2e8f0",
  fontSize: "14px",
};