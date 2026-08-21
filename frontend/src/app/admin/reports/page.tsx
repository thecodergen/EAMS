"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EamsShell from "@/components/EamsShell";
import { getWfhWfoReport, getExportAttendanceUrl, getExportLeavesUrl } from "@/lib/api";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function AdminReportsPage() {
  const router = useRouter();
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("eams_user");
    if (!stored) {
      router.replace("/login");
      return;
    }
    const user = JSON.parse(stored);
    if (user.role !== "Admin") {
      router.replace(`/${user.role.toLowerCase()}`);
      return;
    }

    loadData();
  }, [router]);

  async function loadData() {
    try {
      const data = await getWfhWfoReport();
      setReportData(data);
    } catch (err) {
      console.error("Error loading report", err);
    } finally {
      setLoading(false);
    }
  }

  const chartData = reportData ? [
    { name: "Work From Office", value: reportData.workFromOffice },
    { name: "Work From Home", value: reportData.workFromHome },
  ] : [];

  const COLORS = ["#0ea5e9", "#10b981"]; // Tailwind Sky 500 and Emerald 500

  return (
    <EamsShell role="Admin">
      <div className="admin-container">
        <div className="page-heading">
          <div>
            <h1>Advanced Reporting & Analytics</h1>
            <p>Export system data and view organization trends.</p>
          </div>
        </div>

        {/* Exports Section */}
        <section className="dashboard-section">
          <div className="section-header">
            <h2>Excel Exports</h2>
          </div>
          <div className="cards-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))" }}>
            <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems: "flex-start" }}>
              <div>
                <h3>Attendance Master Report</h3>
                <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Download complete attendance history of all employees.</p>
              </div>
              <a href={getExportAttendanceUrl()} className="login-button" style={{ textDecoration: "none", width: "auto", padding: "10px 20px" }}>
                ⬇️ Export to Excel
              </a>
            </div>
            
            <div className="stat-card" style={{ display: "flex", flexDirection: "column", gap: "15px", alignItems: "flex-start" }}>
              <div>
                <h3>Leave Requests Report</h3>
                <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Download complete history of all leave requests.</p>
              </div>
              <a href={getExportLeavesUrl()} className="login-button" style={{ textDecoration: "none", width: "auto", padding: "10px 20px", background: "#f59e0b" }}>
                ⬇️ Export to Excel
              </a>
            </div>
          </div>
        </section>

        {/* Analytics Section */}
        <section className="dashboard-section" style={{ marginTop: "30px" }}>
          <div className="section-header">
            <h2>Organization Trends</h2>
          </div>
          
          {loading ? (
            <p>Loading charts...</p>
          ) : (
            <div className="stat-card" style={{ height: "400px", padding: "20px" }}>
              <h3 style={{ marginBottom: "20px", textAlign: "center" }}>Work From Office vs Work From Home (All Time)</h3>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="45%"
                    innerRadius={80}
                    outerRadius={120}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }: { name?: string; percent?: number }) => `${name || ''} ${(((percent ?? 0)) * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} days`, "Attendance Count"]} />
                  <Legend verticalAlign="bottom" height={36}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </section>

      </div>
    </EamsShell>
  );
}
