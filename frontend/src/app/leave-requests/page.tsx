"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";

type LeaveRequest = {
  id: number;
  employeeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string | null;
  status: string;
};

export default function LeaveRequestsPage() {
  const employeeId = 1;

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [leaveType, setLeaveType] = useState("Vacation");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadLeaveRequests = async () => {
    try {
      const response = await fetch(
        `http://localhost:5000/api/LeaveRequests/employee/${employeeId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load leave requests");
      }

      const data = await response.json();
      setLeaveRequests(data);
    } catch (err) {
      console.error(err);
      setError("Unable to load leave requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaveRequests();
  }, []);

  const submitLeaveRequest = async (event: FormEvent) => {
    event.preventDefault();

    setMessage("");
    setError("");

    if (!startDate || !endDate) {
      setError("Please select both start and end dates.");
      return;
    }

    if (startDate > endDate) {
      setError("Start date cannot be after end date.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/LeaveRequests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeeId,
            leaveType,
            startDate,
            endDate,
            reason,
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          typeof data === "string"
            ? data
            : "Failed to submit leave request"
        );
      }

      setMessage("Leave request submitted successfully.");

      setStartDate("");
      setEndDate("");
      setReason("");

      await loadLeaveRequests();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit leave request."
      );
    } finally {
      setSubmitting(false);
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
            style={navStyle(true)}
          >
            📋 Leave Requests
          </Link>

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
          maxWidth: "1200px",
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
            Leave Requests
          </h1>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
            }}
          >
            Request leave and view your leave history.
          </p>
        </div>

        {/* REQUEST FORM */}

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
            Request Leave
          </h2>

          <form onSubmit={submitLeaveRequest}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(2, 1fr)",
                gap: "18px",
              }}
            >
              {/* LEAVE TYPE */}

              <div>
                <label style={labelStyle}>
                  Leave Type
                </label>

                <select
                  value={leaveType}
                  onChange={(e) =>
                    setLeaveType(e.target.value)
                  }
                  style={inputStyle}
                >
                  <option value="Vacation">
                    Vacation
                  </option>

                  <option value="Sick Leave">
                    Sick Leave
                  </option>

                  <option value="Personal Leave">
                    Personal Leave
                  </option>

                  <option value="Emergency Leave">
                    Emergency Leave
                  </option>
                </select>
              </div>

              {/* START DATE */}

              <div>
                <label style={labelStyle}>
                  Start Date
                </label>

                <input
                  type="date"
                  value={startDate}
                  onChange={(e) =>
                    setStartDate(e.target.value)
                  }
                  style={inputStyle}
                />
              </div>

              {/* END DATE */}

              <div>
                <label style={labelStyle}>
                  End Date
                </label>

                <input
                  type="date"
                  value={endDate}
                  onChange={(e) =>
                    setEndDate(e.target.value)
                  }
                  style={inputStyle}
                />
              </div>

              {/* REASON */}

              <div>
                <label style={labelStyle}>
                  Reason
                </label>

                <input
                  type="text"
                  value={reason}
                  onChange={(e) =>
                    setReason(e.target.value)
                  }
                  placeholder="Enter reason"
                  style={inputStyle}
                />
              </div>
            </div>

            {error && (
              <div
                style={{
                  marginTop: "18px",
                  color: "#dc2626",
                  background: "#fef2f2",
                  padding: "12px",
                  borderRadius: "8px",
                }}
              >
                {error}
              </div>
            )}

            {message && (
              <div
                style={{
                  marginTop: "18px",
                  color: "#166534",
                  background: "#f0fdf4",
                  padding: "12px",
                  borderRadius: "8px",
                }}
              >
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              style={{
                marginTop: "20px",
                background: submitting
                  ? "#9ca3af"
                  : "#2563eb",
                color: "#ffffff",
                border: "none",
                padding: "12px 20px",
                borderRadius: "8px",
                cursor: submitting
                  ? "not-allowed"
                  : "pointer",
                fontWeight: "bold",
              }}
            >
              {submitting
                ? "Submitting..."
                : "Submit Leave Request"}
            </button>
          </form>
        </div>

        {/* HISTORY */}

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
            My Leave Requests
          </h2>

          {loading && (
            <p>Loading leave requests...</p>
          )}

          {!loading &&
            !error &&
            leaveRequests.length === 0 && (
              <p style={{ color: "#6b7280" }}>
                No leave requests yet.
              </p>
            )}

          {!loading && leaveRequests.length > 0 && (
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
                      Type
                    </th>

                    <th style={tableCell}>
                      Start Date
                    </th>

                    <th style={tableCell}>
                      End Date
                    </th>

                    <th style={tableCell}>
                      Reason
                    </th>

                    <th style={tableCell}>
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {leaveRequests.map((request) => (
                    <tr
                      key={request.id}
                      style={{
                        borderBottom:
                          "1px solid #eeeeee",
                      }}
                    >
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
                        <span
                          style={{
                            display: "inline-block",
                            padding: "5px 10px",
                            borderRadius: "20px",
                            background:
                              request.status ===
                              "Approved"
                                ? "#dcfce7"
                                : request.status ===
                                  "Rejected"
                                ? "#fee2e2"
                                : "#fef3c7",
                            color:
                              request.status ===
                              "Approved"
                                ? "#166534"
                                : request.status ===
                                  "Rejected"
                                ? "#991b1b"
                                : "#92400e",
                            fontSize: "12px",
                            fontWeight: "bold",
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
        </div>
      </section>
    </main>
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

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  fontSize: "14px",
  fontWeight: "bold",
};

const inputStyle = {
  width: "100%",
  padding: "11px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  boxSizing: "border-box" as const,
  fontSize: "14px",
};

const tableCell = {
  padding: "13px 10px",
  fontSize: "14px",
};