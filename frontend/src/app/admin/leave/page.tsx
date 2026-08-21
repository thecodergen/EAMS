"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EamsShell from "@/components/EamsShell";
const API = "http://localhost:5000/api";

type LeaveRequest = {
  id: number;
  employee?: { fullName: string };
  leaveType: string;
  startDate: string;
  endDate: string;
  status: string;
};

export default function AdminLeavePage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("eams_user");
    if (!stored) { router.replace("/login"); return; }
    setAdmin(JSON.parse(stored));
    loadLeaves();
  }, [router]);

  async function loadLeaves() {
    try {
      const res = await fetch(`${API}/LeaveRequests`);
      if (res.ok) {
        const data = await res.json();
        setLeaves(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
  }

  if (!admin) return <EamsShell role="Admin"><div className="loading">Loading...</div></EamsShell>;

  return (
    <EamsShell role="Admin">
      <div className="professional-attendance">
        <div className="page-heading">
          <div>
            <h1>All Leave Requests</h1>
            <p>System-wide overview of all employee leave requests.</p>
          </div>
        </div>
        <section className="dashboard-section">
          <div className="section-header"><h2>Leave History</h2></div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.map(l => (
                  <tr key={l.id}>
                    <td>{l.employee?.fullName || 'Unknown'}</td>
                    <td>{l.leaveType}</td>
                    <td>{new Date(l.startDate).toLocaleDateString()}</td>
                    <td>{new Date(l.endDate).toLocaleDateString()}</td>
                    <td>{l.status}</td>
                  </tr>
                ))}
                {leaves.length === 0 && <tr><td colSpan={5} style={{textAlign:'center', padding:'30px'}}>No records found</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </EamsShell>
  );
}
