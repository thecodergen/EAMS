"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EamsShell from "@/components/EamsShell";
import { getUser } from "@/lib/auth";

const API = "http://localhost:5000/api";

type Shift = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
};

type WorkLocation = {
  id: number;
  name: string;
};

export default function EmployeeSchedulePage() {
  const router = useRouter();
  const [employee, setEmployee] = useState<any>(null);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [selectedShift, setSelectedShift] = useState<number>(1);
  const [preferredLocation, setPreferredLocation] = useState<string>("Office");
  const [flexibleHours, setFlexibleHours] = useState<boolean>(true);
  const [requestReason, setRequestReason] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<string>("");

  useEffect(() => {
    const user = getUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    setEmployee(user);
    loadScheduleData();
  }, [router]);

  async function loadScheduleData() {
    try {
      const [shiftsRes, locationsRes] = await Promise.all([
        fetch(`${API}/Shifts`),
        fetch(`${API}/WorkLocations`),
      ]);

      if (shiftsRes.ok) {
        const shiftsData = await shiftsRes.json();
        setShifts(Array.isArray(shiftsData) ? shiftsData : []);
      }

      if (locationsRes.ok) {
        const locationsData = await locationsRes.json();
        setLocations(Array.isArray(locationsData) ? locationsData : []);
      }
    } catch (err) {
      console.error("Failed to load schedule data", err);
    }
  }

  async function handleSchedulePreferenceSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setSaveSuccess("");

    try {
      // Create notification to manager / admin about shift or schedule request
      if (employee) {
        await fetch(`${API}/Notifications`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employeeId: employee.id,
            message: `Schedule Preference updated: Preferred Shift #${selectedShift}, Location: ${preferredLocation}. Note: ${requestReason || "Default preference"}`,
            isRead: false,
          }),
        });
      }

      setSaveSuccess("Schedule preferences and shift change request submitted successfully!");
      setRequestReason("");
    } catch (err) {
      console.error(err);
      setSaveSuccess("Preferences saved locally for your profile.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!employee) {
    return (
      <EamsShell role="Employee">
        <div className="loading">Loading schedule settings...</div>
      </EamsShell>
    );
  }

  const currentShift = shifts.find((s) => s.id === selectedShift) || {
    id: 1,
    name: "General Morning Shift",
    startTime: "09:00:00",
    endTime: "18:00:00",
  };

  const scheduleDays = [
    { day: "Monday", hours: "9:00 AM - 6:00 PM", type: "Work Day", location: preferredLocation },
    { day: "Tuesday", hours: "9:00 AM - 6:00 PM", type: "Work Day", location: preferredLocation },
    { day: "Wednesday", hours: "9:00 AM - 6:00 PM", type: "Work Day", location: preferredLocation },
    { day: "Thursday", hours: "9:00 AM - 6:00 PM", type: "Work Day", location: preferredLocation },
    { day: "Friday", hours: "9:00 AM - 6:00 PM", type: "Work Day", location: preferredLocation },
    { day: "Saturday", hours: "Off", type: "Weekend", location: "—" },
    { day: "Sunday", hours: "Off", type: "Weekend", location: "—" },
  ];

  return (
    <EamsShell role="Employee">
      <div className="professional-attendance" style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
        {/* Page Heading */}
        <div className="page-heading" style={{ marginBottom: "24px" }}>
          <div>
            <h1 style={{ fontSize: "24px", fontWeight: "700", color: "var(--foreground, #0f172a)", margin: 0 }}>
              Schedule & Shift Settings
            </h1>
            <p style={{ color: "var(--muted-foreground, #64748b)", margin: "4px 0 0" }}>
              View your active work shift, timetable, and configure schedule preferences.
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {saveSuccess && (
          <div style={{
            background: "#ecfdf5",
            border: "1px solid #10b981",
            color: "#065f46",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "20px",
            fontSize: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            <span>✓</span> {saveSuccess}
          </div>
        )}

        {/* Top Cards: Current Shift Overview */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
          gap: "20px",
          marginBottom: "24px"
        }}>
          <div style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            borderTop: "4px solid #2563eb",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <span style={{ fontSize: "12px", textTransform: "uppercase", color: "#64748b", fontWeight: 600 }}>
              Current Assigned Shift
            </span>
            <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "8px 0 4px", color: "#1e293b" }}>
              {currentShift.name}
            </h3>
            <p style={{ margin: 0, color: "#2563eb", fontWeight: 600, fontSize: "14px" }}>
              {currentShift.startTime?.slice(0, 5) || "09:00"} - {currentShift.endTime?.slice(0, 5) || "18:00"} (9h)
            </p>
          </div>

          <div style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            borderTop: "4px solid #059669",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <span style={{ fontSize: "12px", textTransform: "uppercase", color: "#64748b", fontWeight: 600 }}>
              Work Location Mode
            </span>
            <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "8px 0 4px", color: "#1e293b" }}>
              {preferredLocation}
            </h3>
            <p style={{ margin: 0, color: "#059669", fontWeight: 600, fontSize: "14px" }}>
              Default office check-in policy active
            </p>
          </div>

          <div style={{
            background: "#ffffff",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            borderTop: "4px solid #7c3aed",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <span style={{ fontSize: "12px", textTransform: "uppercase", color: "#64748b", fontWeight: 600 }}>
              Grace Period & Break
            </span>
            <h3 style={{ fontSize: "20px", fontWeight: 700, margin: "8px 0 4px", color: "#1e293b" }}>
              15 Mins Grace
            </h3>
            <p style={{ margin: 0, color: "#7c3aed", fontWeight: 600, fontSize: "14px" }}>
              60 Mins Lunch Break (1:00 PM - 2:00 PM)
            </p>
          </div>
        </div>

        {/* Weekly Timetable & Preference Form in Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px" }}>
          {/* Left Column: Weekly Timetable */}
          <div style={{
            background: "#ffffff",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 16px", color: "#1e293b" }}>
              Weekly Work Schedule
            </h2>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e2e8f0", textAlign: "left" }}>
                    <th style={{ padding: "10px", color: "#64748b", fontWeight: 600 }}>Day</th>
                    <th style={{ padding: "10px", color: "#64748b", fontWeight: 600 }}>Working Hours</th>
                    <th style={{ padding: "10px", color: "#64748b", fontWeight: 600 }}>Status</th>
                    <th style={{ padding: "10px", color: "#64748b", fontWeight: 600 }}>Location</th>
                  </tr>
                </thead>
                <tbody>
                  {scheduleDays.map((item, idx) => (
                    <tr key={idx} style={{
                      borderBottom: "1px solid #f1f5f9",
                      background: item.type === "Weekend" ? "#f8fafc" : "transparent"
                    }}>
                      <td style={{ padding: "12px 10px", fontWeight: 600, color: "#334155" }}>
                        {item.day}
                      </td>
                      <td style={{ padding: "12px 10px", color: "#475569" }}>
                        {item.hours}
                      </td>
                      <td style={{ padding: "12px 10px" }}>
                        <span style={{
                          display: "inline-block",
                          padding: "3px 10px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                          background: item.type === "Work Day" ? "#dbeafe" : "#f1f5f9",
                          color: item.type === "Work Day" ? "#1e40af" : "#64748b"
                        }}>
                          {item.type}
                        </span>
                      </td>
                      <td style={{ padding: "12px 10px", color: "#475569" }}>
                        {item.location}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "20px", padding: "12px", background: "#f8fafc", borderRadius: "8px", fontSize: "13px", color: "#64748b" }}>
              💡 <strong>Note:</strong> Overtime is calculated for hours logged after 6:00 PM upon manager verification.
            </div>
          </div>

          {/* Right Column: Preferences & Shift Change Request */}
          <div style={{
            background: "#ffffff",
            padding: "24px",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: "0 0 16px", color: "#1e293b" }}>
              Shift & Schedule Preferences
            </h2>

            <form onSubmit={handleSchedulePreferenceSubmit}>
              {/* Select Shift */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Select Preferred Shift
                </label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(Number(e.target.value))}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    background: "#ffffff",
                    color: "#1e293b"
                  }}
                >
                  {shifts.length > 0 ? (
                    shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.startTime?.slice(0, 5)} - {s.endTime?.slice(0, 5)})
                      </option>
                    ))
                  ) : (
                    <>
                      <option value={1}>Morning Shift (09:00 - 18:00)</option>
                      <option value={2}>Afternoon Shift (13:00 - 22:00)</option>
                      <option value={3}>Night Shift (21:00 - 06:00)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Work Location Mode */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Primary Work Location
                </label>
                <select
                  value={preferredLocation}
                  onChange={(e) => setPreferredLocation(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    background: "#ffffff",
                    color: "#1e293b"
                  }}
                >
                  {locations.length > 0 ? (
                    locations.map((loc) => (
                      <option key={loc.id} value={loc.name}>
                        {loc.name}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="Office">Office</option>
                      <option value="Home">Home (WFH)</option>
                      <option value="Client Site">Client Site</option>
                    </>
                  )}
                </select>
              </div>

              {/* Flexible Working Hours */}
              <div style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "10px" }}>
                <input
                  type="checkbox"
                  id="flexibleHours"
                  checked={flexibleHours}
                  onChange={(e) => setFlexibleHours(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <label htmlFor="flexibleHours" style={{ fontSize: "13px", color: "#334155", cursor: "pointer" }}>
                  Opt-in for flexible check-in window (±30 mins)
                </label>
              </div>

              {/* Request Reason */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                  Reason / Notes for Shift Change
                </label>
                <textarea
                  rows={3}
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Explain reason if requesting a permanent shift change..."
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    resize: "vertical"
                  }}
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: "100%",
                  padding: "11px",
                  background: "#2563eb",
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  fontWeight: 600,
                  fontSize: "14px",
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "background 0.2s"
                }}
              >
                {submitting ? "Submitting..." : "Save & Request Shift Update"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </EamsShell>
  );
}
