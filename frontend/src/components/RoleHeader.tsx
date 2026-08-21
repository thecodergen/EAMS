"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { User, Shield, Briefcase, Calendar, LogOut } from "lucide-react";

type LoggedInUser = {
  id: number;
  fullName: string;
  email: string;
  role: string;
};

export function RoleHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<LoggedInUser | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("eams_user");
    if (saved) {
      try {
        setCurrentUser(JSON.parse(saved));
      } catch {
        setCurrentUser(null);
      }
    }
  }, [pathname]);

  if (pathname === "/login") return null;

  const getRoleDisplay = () => {
    if (!currentUser) return null;
    
    const role = currentUser.role?.toLowerCase();
    
    if (role === "admin") {
      return {
        label: "System Admin",
        icon: Shield,
        color: "text-amber-400 bg-amber-950/30",
        link: "/admin"
      };
    } else if (role === "manager") {
      return {
        label: "Team Manager",
        icon: Briefcase,
        color: "text-indigo-400 bg-indigo-950/30",
        link: "/manager"
      };
    } else {
      return {
        label: "Employee Portal",
        icon: User,
        color: "text-blue-400 bg-blue-950/30",
        link: "/employee"
      };
    }
  };

  const roleDisplay = getRoleDisplay();

  if (!roleDisplay) return null;

  const IconComponent = roleDisplay.icon;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center gap-4">
        {/* LEFT: LOGO & CURRENT ROLE */}
        <div className="flex items-center gap-3">
          <Link href={roleDisplay.link} className="flex items-center gap-2 font-bold text-lg hover:opacity-80 transition">
            <Calendar className="h-6 w-6 text-blue-400" />
            <span className="text-white">EAMS Portal</span>
          </Link>

          <span className="hidden md:inline-block text-slate-700">|</span>

          {/* CURRENT ROLE BADGE */}
          <div className={`hidden md:flex items-center gap-2 px-4 py-1.5 rounded-lg font-semibold text-sm ${roleDisplay.color}`}>
            <IconComponent className="h-4 w-4" />
            <span>{roleDisplay.label}</span>
          </div>
        </div>

        {/* RIGHT: USER INFO & LOGOUT */}
        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="hidden sm:flex items-center gap-2 text-xs">
              <div>
                <p className="font-semibold text-slate-200">{currentUser.fullName}</p>
                <p className="text-slate-400">{currentUser.email}</p>
              </div>
              <span className="text-slate-700">|</span>
            </div>
          )}

          <button
            onClick={() => {
              localStorage.removeItem("eams_token");
              localStorage.removeItem("eams_user");
              router.push("/login");
            }}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
