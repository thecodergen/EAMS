"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getDashboardPath,
  getUser,
} from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    router.replace(
      getDashboardPath(user.role)
    );
  }, [router]);

  return (
    <div className="loading">
      Loading EAMS...
    </div>
  );
}