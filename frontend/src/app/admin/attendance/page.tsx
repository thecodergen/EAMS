"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EamsShell from "@/components/EamsShell";
import { apiFetch } from "@/lib/api";

type AttendanceRecord = {
  id: number; employeeId: number; date: string; 
  status?: { name: string }; location?: { name: string }; remarks?: string;
};

export default function AdminAttendancePage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("eams_user");
    if (stored) {
      setAdmin(JSON.parse(stored));
      loadAttendance();
    } else router.replace("/login");
  }, [router]);

  async function loadAttendance() {
    try {
      const data = await apiFetch("/Attendance");
      if (Array.isArray(data)) setAttendance(data.slice(0, 50));
    } catch (err) { console.error(err); }
  }

  if (!admin) return <EamsShell role="Admin"><div className="loading">Loading...</div></EamsShell>;

  return (
    <EamsShell role="Admin">
      <div className="professional-attendance">
        <div className="page-heading">
          <div>
            <h1>Global Attendance Log</h1>
            <p>System-wide view of all employee attendance records.</p>
          </div>
        </div>
        <section className="dashboard-section">
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Location</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map(a => (
                  <tr key={a.id}>
                    <td>{a.employeeId}</td>
                    <td>{a.date.substring(0, 10)}</td>
                    <td><span style={{fontWeight: 600}}>{a.status?.name || 'Not Marked'}</span></td>
                    <td>{a.location?.name || '—'}</td>
                    <td>{a.remarks || '—'}</td>
                  </tr>
                ))}
                {attendance.length === 0 && <tr><td colSpan={5} style={{textAlign:'center', padding:'30px'}}>No records found</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </EamsShell>
  );
}
