"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EamsShell from "@/components/EamsShell";

export default function AdminAuditPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("eams_user");
    if (stored) setAdmin(JSON.parse(stored));
    else router.replace("/login");
  }, [router]);

  if (!admin) return <EamsShell role="Admin"><div className="loading">Loading...</div></EamsShell>;

  return (
    <EamsShell role="Admin">
      <div className="professional-attendance">
        <div className="page-heading">
          <div>
            <h1>System Audit Logs</h1>
            <p>Track administrative and user actions.</p>
          </div>
        </div>
        <div className="panel" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <h3>Audit Trails</h3>
          <p>This module is under construction.</p>
        </div>
      </div>
    </EamsShell>
  );
}
