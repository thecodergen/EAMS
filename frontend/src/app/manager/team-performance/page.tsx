"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EamsShell from "@/components/EamsShell";
import { getTeamPerformance } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function TeamPerformancePage() {
  const router = useRouter();
  const [manager, setManager] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("eams_user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    const user = JSON.parse(stored);
    if (user.role !== "Manager") {
      router.replace(`/${user.role.toLowerCase()}`);
      return;
    }
    setManager(user);
    loadPerformance(user.id);
  }, [router]);

  async function loadPerformance(managerId: number) {
    try {
      const data = await getTeamPerformance(managerId);
      setPerformanceData(data);
    } catch (err) {
      console.error("Error loading team performance", err);
    } finally {
      setLoading(false);
    }
  }

  if (!manager) {
    return (
      <EamsShell role="Manager">
        <div className="loading">Loading...</div>
      </EamsShell>
    );
  }

  return (
    <EamsShell role="Manager">
      <div className="manager-container">
        <div className="page-heading">
          <div>
            <h1>Team Performance Metrics</h1>
            <p>Analyze attendance rates and leave usage across your direct reports.</p>
          </div>
        </div>

        {/* Analytics Section */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Attendance Rates</h2>
          </div>
          
          {loading ? (
            <p>Loading charts...</p>
          ) : performanceData.length === 0 ? (
            <p>No team members found.</p>
          ) : (
            <div className="stat-card" style={{ height: "400px", padding: "20px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={performanceData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} tickFormatter={(val) => `${val}%`} />
                  <Tooltip formatter={(value) => [`${value}%`, "Attendance Rate"]} />
                  <Legend />
                  <Bar dataKey="attendanceRate" fill="#4f46e5" name="Attendance Rate %" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

        {/* Details Table */}
        <section className="dashboard-section" style={{ marginTop: "30px" }}>
          <div className="section-header">
            <h2>Team Metrics Overview</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Attendance Rate</th>
                  <th>Approved Leaves Taken</th>
                  <th>Pending Leave Requests</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.map((emp) => (
                  <tr key={emp.employeeId}>
                    <td style={{ fontWeight: 600 }}>{emp.name}</td>
                    <td>
                      <span className={`status-badge ${emp.attendanceRate >= 80 ? 'approved' : emp.attendanceRate >= 50 ? 'pending' : 'rejected'}`}>
                        {emp.attendanceRate}%
                      </span>
                    </td>
                    <td>{emp.totalLeavesTaken}</td>
                    <td>{emp.pendingLeaves > 0 ? <span className="status-badge pending">{emp.pendingLeaves}</span> : "0"}</td>
                  </tr>
                ))}
                {performanceData.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: "20px" }}>No team members found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

      </div>
    </EamsShell>
  );
}
