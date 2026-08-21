"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "@/lib/auth";

export default function AttendanceRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    if (user.role === "Admin") {
      router.replace("/admin/attendance");
    } else if (user.role === "Manager") {
      router.replace("/manager/attendance");
    } else {
      router.replace("/employee/attendance");
    }
  }, [router]);

  return (
    <div className="loading">
      Loading Attendance Portal...
    </div>
  );
}
