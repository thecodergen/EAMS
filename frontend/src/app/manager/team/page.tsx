"use client";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import EamsShell from "@/components/EamsShell";
import { apiFetch } from "@/lib/api";

type Employee = { id: number; fullName: string; email: string; department?: any; managerId?: number };

export default function ManagerTeamPage() {
  const router = useRouter();
  const [manager, setManager] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("eams_user");
    if (stored) {
      setManager(JSON.parse(stored));
      loadTeam();
    } else router.replace("/login");
  }, [router]);

  async function loadTeam() {
    try {
      const data = await apiFetch("/employees");
      if (Array.isArray(data)) setEmployees(data);
    } catch (err) { console.error(err); }
  }

  function getDeptName(e: Employee) {
    if (!e.department) return "—";
    if (typeof e.department === "string") return e.department;
    return e.department.name || "—";
  }

  const teamMembers = useMemo(() => {
    if (!manager) return [];
    return employees.filter(e => {
      if (e.managerId === manager.id) return true;
      const empDept = getDeptName(e);
      const mgrDept = manager.department || "";
      return empDept && empDept === mgrDept;
    });
  }, [employees, manager]);

  if (!manager) return <EamsShell role="Manager"><div className="loading">Loading...</div></EamsShell>;

  return (
    <EamsShell role="Manager">
      <div className="professional-attendance">
        <div className="page-heading">
          <div>
            <h1>Team Members</h1>
            <p>Monitor your direct reports and department members.</p>
          </div>
        </div>
        <section className="dashboard-section">
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {teamMembers.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>{e.fullName}</td>
                    <td>{e.email}</td>
                    <td>{getDeptName(e)}</td>
                    <td><span style={{color: "#16a34a", fontWeight: 600}}>Active</span></td>
                  </tr>
                ))}
                {teamMembers.length === 0 && <tr><td colSpan={4} style={{textAlign:'center', padding:'30px'}}>No team members found</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </EamsShell>
  );
}
