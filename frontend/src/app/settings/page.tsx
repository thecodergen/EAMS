"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function SettingsPage() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [attendanceReminders, setAttendanceReminders] = useState(true);
  const [leaveNotifications, setLeaveNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const settings = localStorage.getItem("eams-settings");

    if (settings) {
      const data = JSON.parse(settings);

      setEmailNotifications(data.emailNotifications ?? true);
      setAttendanceReminders(data.attendanceReminders ?? true);
      setLeaveNotifications(data.leaveNotifications ?? true);
      setDarkMode(data.darkMode ?? false);
    }
  }, []);

  const saveSettings = () => {
    const settings = {
      emailNotifications,
      attendanceReminders,
      leaveNotifications,
      darkMode,
    };

    localStorage.setItem(
      "eams-settings",
      JSON.stringify(settings)
    );

    setMessage("Settings saved successfully.");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  const resetSettings = () => {
    setEmailNotifications(true);
    setAttendanceReminders(true);
    setLeaveNotifications(true);
    setDarkMode(false);

    localStorage.removeItem("eams-settings");

    setMessage("Settings reset successfully.");

    setTimeout(() => {
      setMessage("");
    }, 3000);
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#f7f8fc",
        fontFamily: "Arial, sans-serif",
        display: "flex",
      }}
    >
      {/* SIDEBAR */}

      <aside
        style={{
          width: "240px",
          minHeight: "100vh",
          background: "#ffffff",
          borderRight: "1px solid #e5e7eb",
          padding: "25px 18px",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontSize: "22px",
            fontWeight: "bold",
            marginBottom: "35px",
          }}
        >
          📅 EAMS
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          <Link href="/" style={navStyle(false)}>
            🏠 Dashboard
          </Link>

          <Link
            href="/attendance/calendar"
            style={navStyle(false)}
          >
            📅 Attendance Calendar
          </Link>

          <Link
            href="/employees"
            style={navStyle(false)}
          >
            👥 Team Overview
          </Link>

          <Link
            href="/leave-requests"
            style={navStyle(false)}
          >
            📋 Leave Requests
          </Link>

          <Link
            href="/reports"
            style={navStyle(false)}
          >
            📊 Reports & Analytics
          </Link>

          <Link
            href="/settings"
            style={navStyle(true)}
          >
            ⚙️ Settings
          </Link>
        </nav>

        {/* USER */}

        <div
          style={{
            position: "absolute",
            bottom: "25px",
            left: "18px",
            right: "18px",
            borderTop: "1px solid #e5e7eb",
            paddingTop: "18px",
          }}
        >
          <strong>Om Prakash</strong>

          <div
            style={{
              color: "#6b7280",
              fontSize: "13px",
              marginTop: "4px",
            }}
          >
            Employee
          </div>
        </div>
      </aside>

      {/* MAIN */}

      <section
        style={{
          flex: 1,
          padding: "35px",
          maxWidth: "1100px",
        }}
      >
        <div style={{ marginBottom: "30px" }}>
          <h1
            style={{
              fontSize: "30px",
              margin: 0,
              marginBottom: "8px",
            }}
          >
            Settings
          </h1>

          <p
            style={{
              margin: 0,
              color: "#6b7280",
            }}
          >
            Manage your EAMS preferences and notifications.
          </p>
        </div>

        {/* PROFILE */}

        <div style={cardStyle}>
          <h2 style={headingStyle}>
            👤 Profile
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            <div>
              <label style={labelStyle}>
                Full Name
              </label>

              <input
                value="Om Prakash"
                readOnly
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Email
              </label>

              <input
                value="om@example.com"
                readOnly
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Department
              </label>

              <input
                value="Engineering"
                readOnly
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>
                Role
              </label>

              <input
                value="Employee"
                readOnly
                style={inputStyle}
              />
            </div>
          </div>
        </div>

        {/* NOTIFICATIONS */}

        <div style={cardStyle}>
          <h2 style={headingStyle}>
            🔔 Notifications
          </h2>

          <SettingRow
            title="Email Notifications"
            description="Receive important EAMS updates by email."
            checked={emailNotifications}
            onChange={setEmailNotifications}
          />

          <SettingRow
            title="Attendance Reminders"
            description="Receive reminders to submit your daily attendance."
            checked={attendanceReminders}
            onChange={setAttendanceReminders}
          />

          <SettingRow
            title="Leave Notifications"
            description="Receive notifications when your leave request changes."
            checked={leaveNotifications}
            onChange={setLeaveNotifications}
          />
        </div>

        {/* APPEARANCE */}

        <div style={cardStyle}>
          <h2 style={headingStyle}>
            🎨 Appearance
          </h2>

          <SettingRow
            title="Dark Mode"
            description="Use dark appearance for the EAMS interface."
            checked={darkMode}
            onChange={setDarkMode}
          />
        </div>

        {/* SYSTEM */}

        <div style={cardStyle}>
          <h2 style={headingStyle}>
            ℹ️ System Information
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(2, 1fr)",
              gap: "15px",
            }}
          >
            <InfoBox
              title="Application"
              value="EAMS"
            />

            <InfoBox
              title="Backend"
              value="ASP.NET Core 9"
            />

            <InfoBox
              title="Frontend"
              value="Next.js 16"
            />

            <InfoBox
              title="Database"
              value="SQL Server 2022"
            />
          </div>
        </div>

        {/* MESSAGE */}

        {message && (
          <div
            style={{
              background: "#f0fdf4",
              border: "1px solid #bbf7d0",
              color: "#166534",
              padding: "13px",
              borderRadius: "8px",
              marginBottom: "18px",
            }}
          >
            {message}
          </div>
        )}

        {/* BUTTONS */}

        <div
          style={{
            display: "flex",
            gap: "12px",
          }}
        >
          <button
            onClick={saveSettings}
            style={{
              background: "#2563eb",
              color: "#ffffff",
              border: "none",
              padding: "12px 22px",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Save Settings
          </button>

          <button
            onClick={resetSettings}
            style={{
              background: "#ffffff",
              color: "#374151",
              border: "1px solid #d1d5db",
              padding: "12px 22px",
              borderRadius: "8px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            Reset
          </button>
        </div>
      </section>
    </main>
  );
}

function SettingRow({
  title,
  description,
  checked,
  onChange,
}: {
  title: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "18px 0",
        borderBottom: "1px solid #f0f0f0",
      }}
    >
      <div>
        <div
          style={{
            fontWeight: "bold",
            marginBottom: "5px",
          }}
        >
          {title}
        </div>

        <div
          style={{
            color: "#6b7280",
            fontSize: "13px",
          }}
        >
          {description}
        </div>
      </div>

      <button
        onClick={() => onChange(!checked)}
        aria-label={title}
        style={{
          width: "48px",
          height: "26px",
          border: "none",
          borderRadius: "20px",
          background: checked
            ? "#2563eb"
            : "#d1d5db",
          position: "relative",
          cursor: "pointer",
          transition: "0.2s",
        }}
      >
        <span
          style={{
            position: "absolute",
            top: "3px",
            left: checked ? "25px" : "3px",
            width: "20px",
            height: "20px",
            background: "#ffffff",
            borderRadius: "50%",
            transition: "0.2s",
          }}
        />
      </button>
    </div>
  );
}

function InfoBox({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div
      style={{
        background: "#f8fafc",
        border: "1px solid #e5e7eb",
        borderRadius: "8px",
        padding: "15px",
      }}
    >
      <div
        style={{
          color: "#6b7280",
          fontSize: "12px",
          marginBottom: "5px",
        }}
      >
        {title}
      </div>

      <strong>{value}</strong>
    </div>
  );
}

function navStyle(active: boolean) {
  return {
    display: "block",
    padding: "11px 13px",
    borderRadius: "8px",
    textDecoration: "none",
    color: active ? "#2563eb" : "#374151",
    background: active ? "#eff6ff" : "transparent",
    fontSize: "14px",
    fontWeight: active ? "bold" : "normal",
  };
}

const cardStyle = {
  background: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "14px",
  padding: "25px",
  marginBottom: "20px",
};

const headingStyle = {
  marginTop: 0,
  marginBottom: "20px",
  fontSize: "20px",
};

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  fontSize: "14px",
  fontWeight: "bold",
};

const inputStyle = {
  width: "100%",
  padding: "11px",
  border: "1px solid #d1d5db",
  borderRadius: "7px",
  boxSizing: "border-box" as const,
  fontSize: "14px",
  background: "#f8fafc",
};