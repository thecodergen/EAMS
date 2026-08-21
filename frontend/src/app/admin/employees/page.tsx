"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EamsShell from "@/components/EamsShell";
const API = "http://localhost:5000/api";

type Employee = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  department: string;
};

export default function AdminEmployeesPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("eams_user");
    if (!stored) { router.replace("/login"); return; }
    setAdmin(JSON.parse(stored));
    loadEmployees();
  }, [router]);

  async function loadEmployees() {
    try {
      const res = await fetch(`${API}/Employees`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (err) { console.error(err); }
  }

  if (!admin) return <EamsShell role="Admin"><div className="loading">Loading...</div></EamsShell>;

  return (
    <EamsShell role="Admin">
      <div className="professional-attendance">
        <div className="page-heading">
          <div>
            <h1>Employee Directory</h1>
            <p>Manage users, roles, and organizational structure.</p>
          </div>
          <button className="primary-button">Add Employee</button>
        </div>
        <section className="dashboard-section">
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Role</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map(e => (
                  <tr key={e.id}>
                    <td style={{ fontWeight: 600 }}>{e.fullName}</td>
                    <td>{e.email}</td>
                    <td>{e.department || 'N/A'}</td>
                    <td>{e.role}</td>
                    <td>
                      <button className="text-blue-600 hover:text-blue-800 font-medium mr-3">Edit</button>
                      <button className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </EamsShell>
  );
}
