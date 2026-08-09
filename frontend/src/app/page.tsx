"use client";

import { useEffect, useState } from "react";

type Employee = {
  id: number;
  fullName: string;
  email: string;
  department: { name: string } | null;
  role: { name: string } | null;
};

export default function Home() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("http://localhost:5000/api/employees")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch employees");
        return res.json();
      })
      .then((data) => {
        setEmployees(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <main style={{ padding: "40px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: "28px", fontWeight: "bold", marginBottom: "20px" }}>
        EAMS — Employees
      </h1>

      {loading && <p>Loading employees...</p>}
      {error && <p style={{ color: "red" }}>Error: {error}</p>}

      {!loading && !error && (
        <table style={{ borderCollapse: "collapse", width: "100%", maxWidth: "700px" }}>
          <thead>
            <tr style={{ borderBottom: "2px solid #333", textAlign: "left" }}>
              <th style={{ padding: "8px" }}>Name</th>
              <th style={{ padding: "8px" }}>Email</th>
              <th style={{ padding: "8px" }}>Department</th>
              <th style={{ padding: "8px" }}>Role</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr key={emp.id} style={{ borderBottom: "1px solid #ddd" }}>
                <td style={{ padding: "8px" }}>{emp.fullName}</td>
                <td style={{ padding: "8px" }}>{emp.email}</td>
                <td style={{ padding: "8px" }}>{emp.department?.name ?? "—"}</td>
                <td style={{ padding: "8px" }}>{emp.role?.name ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </main>
  );
}