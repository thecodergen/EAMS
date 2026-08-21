"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EamsShell from "@/components/EamsShell";

export default function ManagerReportsPage() {
  const router = useRouter();
  const [manager, setManager] = useState<any>(null);

  useEffect(() => {
    const stored = localStorage.getItem("eams_user");
    if (stored) setManager(JSON.parse(stored));
    else router.replace("/login");
  }, [router]);

  if (!manager) return <EamsShell role="Manager"><div className="loading">Loading...</div></EamsShell>;

  return (
    <EamsShell role="Manager">
      <div className="professional-attendance">
        <div className="page-heading">
          <div>
            <h1>Team Reports</h1>
            <p>View analytics and performance metrics for your team.</p>
          </div>
        </div>
        <div className="panel" style={{ textAlign: 'center', padding: '60px', color: '#64748b' }}>
          <h3>Reports Module</h3>
          <p>This module is currently under construction. Check back soon for detailed team analytics.</p>
        </div>
      </div>
    </EamsShell>
  );
}
