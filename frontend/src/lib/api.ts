const API = "http://localhost:5000/api";

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("eams_user")
      : null;

  let authToken = "";

  if (token) {
    try {
      const user = JSON.parse(token);
      authToken = user.token || "";
    } catch {
      authToken = "";
    }
  }

  const headers = new Headers(options.headers);

  headers.set("Content-Type", "application/json");

  if (authToken) {
    headers.set(
      "Authorization",
      `Bearer ${authToken}`
    );
  }

  const response = await fetch(
    `${API}${endpoint}`,
    {
      ...options,
      headers,
    }
  );

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;

    try {
      const data = await response.json();

      if (data?.message) {
        message = data.message;
      }
    } catch {
      // Ignore JSON parsing errors
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export async function login(
  email: string,
  password: string
) {
  return apiFetch("/Auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
}

export async function sendOtp(
  identifier: string,
  purpose: "login" | "register" = "login"
) {
  return apiFetch("/Auth/send-otp", {
    method: "POST",
    body: JSON.stringify({
      identifier,
      purpose,
    }),
  });
}

export async function loginWithOtp(
  identifier: string,
  otp: string
) {
  return apiFetch("/Auth/login-otp", {
    method: "POST",
    body: JSON.stringify({
      identifier,
      otp,
    }),
  });
}

export async function register(
  username: string,
  fullName: string,
  email: string,
  password: string,
  role: string = "Employee",
  mobileNumber?: string
) {
  return apiFetch("/Auth/register", {
    method: "POST",
    body: JSON.stringify({
      username,
      fullName,
      email,
      mobileNumber: mobileNumber || "",
      password,
      role
    }),
  });
}

export async function registerWithOtp(
  username: string,
  fullName: string,
  email: string,
  password: string,
  otp: string,
  role: string = "Employee",
  mobileNumber?: string
) {
  return apiFetch("/Auth/register-with-otp", {
    method: "POST",
    body: JSON.stringify({
      username,
      fullName,
      email,
      mobileNumber: mobileNumber || "",
      password,
      role,
      otp
    }),
  });
}

export async function getEmployees() {
  return apiFetch("/employees");
}

export async function getEmployee(id: number) {
  return apiFetch(`/employees/${id}`);
}

export async function getAttendance() {
  return apiFetch("/Attendance");
}

export async function getEmployeeAttendance(
  employeeId: number
) {
  return apiFetch(
    `/Attendance/employee/${employeeId}`
  );
}

export async function getLeaveRequests() {
  return apiFetch("/LeaveRequests");
}

export async function getEmployeeLeaveRequests(
  employeeId: number
) {
  return apiFetch(
    `/LeaveRequests/employee/${employeeId}`
  );
}

export async function getNotifications(
  employeeId: number
) {
  return apiFetch(
    `/Notifications/employee/${employeeId}`
  );
}

export async function getUnreadNotificationCount(
  employeeId: number
) {
  return apiFetch(
    `/Notifications/employee/${employeeId}/unread-count`
  );
}

export async function markNotificationRead(
  id: number
) {
  return apiFetch(
    `/Notifications/${id}/read`,
    {
      method: "PUT",
    }
  );
}

export async function approveLeave(id: number) {
  return apiFetch(
    `/LeaveRequests/${id}/approve`,
    {
      method: "PUT",
    }
  );
}

export async function rejectLeave(id: number) {
  return apiFetch(
    `/LeaveRequests/${id}/reject`,
    {
      method: "PUT",
    }
  );
}

export async function getWfhWfoReport() {
  return apiFetch("/reports/wfh-wfo");
}

export async function getTeamPerformance(managerId: number) {
  return apiFetch(`/reports/team/${managerId}`);
}

export function getExportAttendanceUrl() {
  return `${API}/Export/attendance`;
}

export function getExportLeavesUrl() {
  return `${API}/Export/leaves`;
}

export { API };