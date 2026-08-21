"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EamsShell from "@/components/EamsShell";

const API = "http://localhost:5000/api";

type LeaveRequest = {
  id: number;
  employeeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
};

export default function EmployeeLeavePage() {
  const router = useRouter();

  const [employee, setEmployee] = useState<any>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("eams_user");

    if (!stored) {
      router.replace("/login");
      return;
    }

    try {
      const user = JSON.parse(stored);
      setEmployee(user);
      loadLeaves(user.id);
    } catch {
      localStorage.removeItem("eams_user");
      localStorage.removeItem("eams_token");
      router.replace("/login");
    }
  }, [router]);

  async function loadLeaves(employeeId: number) {
    try {
      setLoading(true);

      const response = await fetch(
        `${API}/LeaveRequests/employee/${employeeId}`
      );

      if (!response.ok) {
        throw new Error("Failed to load leave requests");
      }

      const data = await response.json();

      setLeaves(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  }

  async function submitLeave() {
    if (!employee) return;

    setMessage("");

    if (!startDate || !endDate || !reason.trim()) {
      setMessage("Please fill all required fields.");
      return;
    }

    if (startDate > endDate) {
      setMessage("Start date cannot be after end date.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await fetch(`${API}/LeaveRequests`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employeeId: employee.id,
          leaveType,
          startDate,
          endDate,
          reason,
          status: "Pending",
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || "Failed to submit leave request");
      }

      setMessage("Leave request submitted successfully.");

      setLeaveType("Casual Leave");
      setStartDate("");
      setEndDate("");
      setReason("");

      await loadLeaves(employee.id);
    } catch (error) {
      console.error(error);
      setMessage("Unable to submit leave request.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteLeave(id: number) {
    if (!employee) return;

    const confirmed = window.confirm(
      "Are you sure you want to delete this leave request?"
    );

    if (!confirmed) return;

    try {
      const response = await fetch(
        `${API}/LeaveRequests/${id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Unable to delete leave request");
      }

      await loadLeaves(employee.id);
    } catch (error) {
      console.error(error);
      setMessage(
        "Only pending leave requests can be deleted."
      );
    }
  }

  if (!employee) {
    return (
      <EamsShell role="Employee">
        <div className="loading">
          Loading EAMS...
        </div>
      </EamsShell>
    );
  }

  const pending = leaves.filter(
    (leave) => leave.status === "Pending"
  ).length;

  const approved = leaves.filter(
    (leave) => leave.status === "Approved"
  ).length;

  const rejected = leaves.filter(
    (leave) => leave.status === "Rejected"
  ).length;

  return (
    <EamsShell role="Employee">
      <div className="professional-attendance">

      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, margin: 0, color: "#0f172a" }}>Leave Management</h1>
          <p style={{ margin: "4px 0 0", color: "#64748b", fontSize: "14px" }}>
            Apply for formal leave, view balance, and track manager approval status.
          </p>
        </div>
      </div>

      {/* SUMMARY */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "16px",
        marginBottom: "24px"
      }}>
        <div style={{
          background: "#ffffff",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          borderTop: "4px solid #d97706",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            ⏳ Pending Requests
          </span>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#d97706", margin: "8px 0 2px" }}>
            {pending}
          </div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Awaiting manager review</span>
        </div>

        <div style={{
          background: "#ffffff",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          borderTop: "4px solid #059669",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            ✓ Approved Leaves
          </span>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#059669", margin: "8px 0 2px" }}>
            {approved}
          </div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Confirmed days off</span>
        </div>

        <div style={{
          background: "#ffffff",
          padding: "20px",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          borderTop: "4px solid #dc2626",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}>
          <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
            ✕ Rejected Requests
          </span>
          <div style={{ fontSize: "28px", fontWeight: 800, color: "#dc2626", margin: "8px 0 2px" }}>
            {rejected}
          </div>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Requests declined</span>
        </div>
      </div>

      {/* APPLY LEAVE */}

      <section className="dashboard-section">
        <div className="section-header">
          <div>
            <h2>Apply for Leave</h2>
            <p>
              Submit a new leave request to your manager.
            </p>
          </div>
        </div>

        {message && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: "18px",
              borderRadius: "8px",
              background: "#eff6ff",
              color: "#1d4ed8",
              border: "1px solid #bfdbfe",
            }}
          >
            {message}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "18px",
          }}
        >
          <div>
            <label>Leave Type</label>

            <select
              value={leaveType}
              onChange={(e) =>
                setLeaveType(e.target.value)
              }
              className="form-input"
            >
              <option>Casual Leave</option>
              <option>Sick Leave</option>
              <option>Vacation</option>
              <option>Emergency Leave</option>
            </select>
          </div>

          <div>
            <label>Start Date</label>

            <input
              type="date"
              value={startDate}
              onChange={(e) =>
                setStartDate(e.target.value)
              }
              className="form-input"
            />
          </div>

          <div>
            <label>End Date</label>

            <input
              type="date"
              value={endDate}
              onChange={(e) =>
                setEndDate(e.target.value)
              }
              className="form-input"
            />
          </div>
        </div>

        <div style={{ marginTop: "18px" }}>
          <label>Reason</label>

          <textarea
            value={reason}
            onChange={(e) =>
              setReason(e.target.value)
            }
            placeholder="Enter reason for leave..."
            rows={4}
            className="form-input"
          />
        </div>

        <button
          onClick={submitLeave}
          disabled={submitting}
          className="primary-button"
          style={{ marginTop: "18px" }}
        >
          {submitting
            ? "Submitting..."
            : "Submit Leave Request"}
        </button>
      </section>

      {/* LEAVE HISTORY */}

      <section
        className="dashboard-section"
        style={{ marginTop: "24px" }}
      >
        <div className="section-header">
          <div>
            <h2>My Leave Requests</h2>
            <p>
              View your complete leave request history.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="loading">
            Loading leave requests...
          </div>
        ) : leaves.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "50px",
              color: "#64748b",
            }}
          >
            No leave requests found.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Reason</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {leaves.map((leave) => (
                  <tr key={leave.id}>
                    <td>{leave.leaveType}</td>

                    <td>
                      {new Date(
                        leave.startDate
                      ).toLocaleDateString()}
                    </td>

                    <td>
                      {new Date(
                        leave.endDate
                      ).toLocaleDateString()}
                    </td>

                    <td>{leave.reason}</td>

                    <td>
                      <span
                        style={{
                          padding: "5px 10px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background:
                            leave.status === "Approved"
                              ? "#dcfce7"
                              : leave.status === "Rejected"
                              ? "#fee2e2"
                              : "#fef3c7",
                          color:
                            leave.status === "Approved"
                              ? "#15803d"
                              : leave.status === "Rejected"
                              ? "#b91c1c"
                              : "#a16207",
                        }}
                      >
                        {leave.status}
                      </span>
                    </td>

                      <td>
                        {leave.status === "Pending" ? (
                          <button
                            onClick={() => deleteLeave(leave.id)}
                            style={{
                              background: "#fee2e2",
                              color: "#dc2626",
                              border: "1px solid #fecaca",
                              borderRadius: "6px",
                              padding: "4px 10px",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer"
                            }}
                          >
                            🗑️ Cancel Request
                          </button>
                        ) : (
                          <span style={{ color: "#94a3b8", fontSize: "12px" }}>—</span>
                        )}
                      </td>
                  </tr>
                ))}

                {leaves.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: "40px",
                        color: "var(--muted-foreground)",
                      }}
                    >
                      No leave requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  </EamsShell>
  );
}