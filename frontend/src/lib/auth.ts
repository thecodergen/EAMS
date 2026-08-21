export type UserRole = "Employee" | "Manager" | "Admin";

export type LoggedInUser = {
  id: number;
  fullName: string;
  email: string;
  role: UserRole;
  department: string | null;
  token: string;
  avatar?: string | null;
  phoneNumber?: string | null;
  jobTitle?: string | null;
  employeeIdCode?: string | null;
  hireDate?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  emergencyContact?: string | null;
  emergencyPhone?: string | null;
  workMode?: string | null;
  shiftPreference?: string | null;
  bio?: string | null;
};

const STORAGE_KEY = "eams_user";

export function saveUser(user: LoggedInUser) {
  if (typeof window === "undefined") return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function getUser(): LoggedInUser | null {
  if (typeof window === "undefined") return null;

  const value = localStorage.getItem(STORAGE_KEY);

  if (!value) return null;

  try {
    return JSON.parse(value) as LoggedInUser;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function logout() {
  if (typeof window === "undefined") return;

  localStorage.removeItem(STORAGE_KEY);
  window.location.href = "/login";
}

export function getDashboardPath(role: UserRole) {
  switch (role) {
    case "Admin":
      return "/admin";

    case "Manager":
      return "/manager";

    default:
      return "/employee";
  }
}