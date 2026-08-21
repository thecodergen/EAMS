"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EamsShell from "@/components/EamsShell";

const API = "http://localhost:5000/api";

type LeaveRequest = {
  id: number;
  employeeId: number;
  employee?: { fullName: string };
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: string;
};

export default function ManagerLeavePage() {
  const router = useRouter();
  const [manager, setManager] = useState<any>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("eams_user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    const user = JSON.parse(stored);
    setManager(user);
    loadLeaves(user.id);
  }, [router]);

  async function loadLeaves(managerId: number) {
    try {
      setLoading(true);
      const res = await fetch(`${API}/LeaveRequests/manager/${managerId}/pending`);
      if (res.ok) {
        const data = await res.json();
        setLeaves(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    try {
      await fetch(`${API}/LeaveRequests/${id}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(status)
      });
      loadLeaves(manager.id);
    } catch (err) {
      console.error(err);
    }
  }

  if (!manager) return <EamsShell role="Manager"><div className="loading">Loading...</div></EamsShell>;

  return (
    <EamsShell role="Manager">
      <div className="professional-attendance">
        <div className="page-heading">
          <div>
            <h1>Team Leave Requests</h1>
            <p>Review and approve pending leave requests from your team.</p>
          </div>
        </div>

        <section className="dashboard-section">
          <div className="section-header">
            <h2>Pending Approvals</h2>
          </div>
          {loading ? (
            <div className="loading">Loading requests...</div>
          ) : leaves.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>No pending requests.</div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Type</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>Reason</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaves.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 600 }}>{l.employee?.fullName || 'Unknown'}</td>
                      <td>{l.leaveType}</td>
                      <td>{new Date(l.startDate).toLocaleDateString()}</td>
                      <td>{new Date(l.endDate).toLocaleDateString()}</td>
                      <td>{l.reason}</td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button onClick={() => updateStatus(l.id, "Approved")} className="primary-button" style={{ background: "#16a34a", padding: "6px 12px" }}>Approve</button>
                          <button onClick={() => updateStatus(l.id, "Rejected")} className="primary-button" style={{ background: "#dc2626", padding: "6px 12px" }}>Reject</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </EamsShell>
  );
}
