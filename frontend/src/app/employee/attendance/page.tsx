"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import EamsShell from "@/components/EamsShell";

const API = "http://localhost:5000/api";

type Employee = {
  id: number;
  fullName: string;
  email: string;
  role: string;
  department?: string;
};

type AttendanceStatus = {
  id: number;
  name: string;
};

type WorkLocation = {
  id: number;
  name: string;
};

type Shift = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
};

type AttendanceRecord = {
  id: number;
  employeeId: number;
  date: string;
  remarks?: string | null;

  // The API may return either nested objects or only foreign-key IDs.
  statusId?: number | null;
  locationId?: number | null;
  shiftId?: number | null;

  status?: {
    id: number;
    name: string;
  } | null;

  location?: {
    id: number;
    name: string;
  } | null;

  shift?: {
    id: number;
    name: string;
    startTime?: string;
    endTime?: string;
  } | null;
};

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseLocalDate(dateString: string) {
  const parts = dateString.substring(0, 10).split("-");

  return new Date(
    Number(parts[0]),
    Number(parts[1]) - 1,
    Number(parts[2])
  );
}

function getMonthDays(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days: (Date | null)[] = [];

  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null);
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day));
  }

  return days;
}

function getStatusId(record?: AttendanceRecord) {
  return record?.status?.id ?? record?.statusId ?? null;
}

function getStatusName(record?: AttendanceRecord) {
  return record?.status?.name ?? "";
}

function getLocationId(record?: AttendanceRecord) {
  return record?.location?.id ?? record?.locationId ?? null;
}

function getLocationName(record?: AttendanceRecord) {
  return record?.location?.name ?? "";
}

function getShiftId(record?: AttendanceRecord) {
  return record?.shift?.id ?? record?.shiftId ?? null;
}

function getShiftName(record?: AttendanceRecord) {
  return record?.shift?.name ?? "";
}

function getLocationLabel(record?: AttendanceRecord) {
  const statusName = getStatusName(record);
  const locationName = getLocationName(record);

  if (!statusName) {
    return "Not marked";
  }

  if (statusName === "Present") {
    if (locationName === "Office") {
      return "WFO";
    }

    if (locationName === "Home") {
      return "WFH";
    }

    if (locationName === "Client Site") {
      return "Client";
    }
  }

  return statusName;
}

function getStatusClass(record?: AttendanceRecord) {
  const statusName = getStatusName(record);

  // Never call toLowerCase() on an undefined value.
  if (!statusName) {
    return "not-marked";
  }

  const status = statusName.toLowerCase();
  const locationName = getLocationName(record);

  if (status === "present") {
    if (locationName === "Home") {
      return "wfh";
    }

    if (locationName === "Client Site") {
      return "client";
    }

    return "wfo";
  }

  if (status === "sick leave") {
    return "sick";
  }

  if (status === "vacation") {
    return "vacation";
  }

  if (status === "absent") {
    return "absent";
  }

  return "other";
}

export default function EmployeeAttendancePage() {
  const router = useRouter();

  const today = new Date();
  const todayString = formatDate(today);

  const [employee, setEmployee] =
    useState<Employee | null>(null);

  const [attendance, setAttendance] =
    useState<AttendanceRecord[]>([]);

  const [statuses, setStatuses] =
    useState<AttendanceStatus[]>([]);

  const [locations, setLocations] =
    useState<WorkLocation[]>([]);

  const [shifts, setShifts] =
    useState<Shift[]>([]);

  const [currentMonth, setCurrentMonth] =
    useState(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

  const [selectedDate, setSelectedDate] =
    useState<string | null>(null);

  const [statusId, setStatusId] =
    useState("");

  const [locationId, setLocationId] =
    useState("");

  const [shiftId, setShiftId] =
    useState("");

  const [remarks, setRemarks] =
    useState("");

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [showEditor, setShowEditor] =
    useState(false);

  const [showMonthsModal, setShowMonthsModal] =
    useState(false);

  useEffect(() => {
    const stored =
      localStorage.getItem("eams_user");

    if (!stored) {
      router.replace("/login");
      return;
    }

    try {
      const parsed = JSON.parse(stored);

      setEmployee(parsed);
      loadData(parsed.id);
    } catch {
      localStorage.removeItem(
        "eams_user"
      );

      localStorage.removeItem(
        "eams_token"
      );

      router.replace("/login");
    }
  }, [router]);

  async function loadData(
    employeeId: number
  ) {
    try {
      setLoading(true);
      setError("");

      const token =
        localStorage.getItem("eams_token");

      const headers: HeadersInit = token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {};

      const [
        attendanceResponse,
        statusesResponse,
        locationsResponse,
        shiftsResponse,
      ] = await Promise.all([
        fetch(
          `${API}/Attendance/employee/${employeeId}`,
          {
            headers,
          }
        ),

        fetch(
          `${API}/AttendanceStatuses`,
          {
            headers,
          }
        ),

        fetch(
          `${API}/WorkLocations`,
          {
            headers,
          }
        ),

        fetch(
          `${API}/Shifts`,
          {
            headers,
          }
        ),
      ]);

      if (
        !attendanceResponse.ok ||
        !statusesResponse.ok ||
        !locationsResponse.ok ||
        !shiftsResponse.ok
      ) {
        throw new Error(
          "Failed to load attendance data."
        );
      }

      const [
        attendanceData,
        statusesData,
        locationsData,
        shiftsData,
      ] = await Promise.all([
        attendanceResponse.json(),
        statusesResponse.json(),
        locationsResponse.json(),
        shiftsResponse.json(),
      ]);

      const normalizedAttendance: AttendanceRecord[] =
        Array.isArray(attendanceData)
          ? attendanceData.map((raw: any) => {
              const statusId =
                raw.status?.id ??
                raw.statusId ??
                raw.StatusId ??
                null;

              const statusName =
                raw.status?.name ??
                raw.statusName ??
                raw.StatusName ??
                "";

              const locationId =
                raw.location?.id ??
                raw.locationId ??
                raw.LocationId ??
                null;

              const locationName =
                raw.location?.name ??
                raw.locationName ??
                raw.LocationName ??
                "";

              const shiftId =
                raw.shift?.id ??
                raw.shiftId ??
                raw.ShiftId ??
                null;

              const shiftName =
                raw.shift?.name ??
                raw.shiftName ??
                raw.ShiftName ??
                "";

              const status =
                statusId != null || statusName
                  ? {
                      id: Number(
                        statusId ??
                          statusesData.find(
                            (s: AttendanceStatus) =>
                              s.name === statusName
                          )?.id ??
                          0
                      ),
                      name:
                        String(statusName) ||
                        String(
                          statusesData.find(
                            (s: AttendanceStatus) =>
                              Number(s.id) === Number(statusId)
                          )?.name ?? ""
                        ),
                    }
                  : null;

              const location =
                locationId != null || locationName
                  ? {
                      id: Number(
                        locationId ??
                          locationsData.find(
                            (l: WorkLocation) =>
                              l.name === locationName
                          )?.id ??
                          0
                      ),
                      name:
                        String(locationName) ||
                        String(
                          locationsData.find(
                            (l: WorkLocation) =>
                              Number(l.id) === Number(locationId)
                          )?.name ?? ""
                        ),
                    }
                  : null;

              const shift =
                shiftId != null || shiftName
                  ? {
                      id: Number(
                        shiftId ??
                          shiftsData.find(
                            (s: Shift) =>
                              s.name === shiftName
                          )?.id ??
                          0
                      ),
                      name:
                        String(shiftName) ||
                        String(
                          shiftsData.find(
                            (s: Shift) =>
                              Number(s.id) === Number(shiftId)
                          )?.name ?? ""
                        ),
                      startTime:
                        raw.shift?.startTime ??
                        shiftsData.find(
                          (s: Shift) =>
                            Number(s.id) === Number(shiftId)
                        )?.startTime,
                      endTime:
                        raw.shift?.endTime ??
                        shiftsData.find(
                          (s: Shift) =>
                            Number(s.id) === Number(shiftId)
                        )?.endTime,
                    }
                  : null;

              return {
                id: Number(raw.id),
                employeeId: Number(raw.employeeId),
                date: String(raw.date),
                remarks: raw.remarks ?? null,
                statusId: statusId != null ? Number(statusId) : null,
                locationId: locationId != null ? Number(locationId) : null,
                shiftId: shiftId != null ? Number(shiftId) : null,
                status,
                location,
                shift,
              };
            })
          : [];

      setAttendance(normalizedAttendance);

      setStatuses(
        Array.isArray(statusesData)
          ? statusesData
          : []
      );

      setLocations(
        Array.isArray(locationsData)
          ? locationsData
          : []
      );

      setShifts(
        Array.isArray(shiftsData)
          ? shiftsData
          : []
      );
    } catch (err) {
      console.error(err);

      setError(
        "Unable to load attendance data."
      );
    } finally {
      setLoading(false);
    }
  }

  const monthDays = useMemo(
    () =>
      getMonthDays(
        currentMonth.getFullYear(),
        currentMonth.getMonth()
      ),
    [currentMonth]
  );

  const monthName =
    currentMonth.toLocaleDateString(
      "en-US",
      {
        month: "long",
        year: "numeric",
      }
    );

  const monthRecords =
    attendance.filter((record) => {
      const date = parseLocalDate(record.date);

      return (
        date.getFullYear() ===
          currentMonth.getFullYear() &&
        date.getMonth() ===
          currentMonth.getMonth()
      );
    });

  function getRecordForDate(
    dateString: string
  ) {
    return attendance.find(
      (record) =>
        record.date.substring(0, 10) ===
        dateString
    );
  }

  function openDate(dateString: string) {
    const existing =
      getRecordForDate(dateString);

    setSelectedDate(dateString);

    if (existing) {
      setEditingId(existing.id);

      const existingStatusId = getStatusId(existing);
      const existingLocationId = getLocationId(existing);
      const existingShiftId = getShiftId(existing);

      setStatusId(
        existingStatusId != null
          ? String(existingStatusId)
          : ""
      );

      setLocationId(
        existingLocationId != null
          ? String(existingLocationId)
          : ""
      );

      setShiftId(
        existingShiftId != null
          ? String(existingShiftId)
          : ""
      );

      setRemarks(
        existing.remarks || ""
      );
    } else {
      setEditingId(null);
      setStatusId("");
      setLocationId("");
      setShiftId("");
      setRemarks("");
    }

    setShowEditor(true);
    setError("");
    setMessage("");
  }

  function closeEditor() {
    setShowEditor(false);
    setSelectedDate(null);
    setEditingId(null);
    setStatusId("");
    setLocationId("");
    setShiftId("");
    setRemarks("");
  }

  function previousMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() - 1,
        1
      )
    );

    closeEditor();
  }

  function nextMonth() {
    setCurrentMonth(
      new Date(
        currentMonth.getFullYear(),
        currentMonth.getMonth() + 1,
        1
      )
    );

    closeEditor();
  }

  function currentMonthButton() {
    setCurrentMonth(
      new Date(
        today.getFullYear(),
        today.getMonth(),
        1
      )
    );

    openDate(todayString);
  }

  function handleStatusChange(
    value: string
  ) {
    setStatusId(value);

    const selectedStatus =
      statuses.find(
        (status) =>
          String(status.id) === value
      );

    if (
      selectedStatus &&
      selectedStatus.name !== "Present"
    ) {
      setLocationId("");
      setShiftId("");
    }
  }

  async function saveAttendance() {
    if (!employee || !selectedDate) {
      return;
    }

    if (!statusId) {
      setError(
        "Please select an attendance status."
      );
      return;
    }

    const selectedStatus =
      statuses.find(
        (status) =>
          status.id === Number(statusId)
      );

    if (
      selectedStatus?.name === "Present" &&
      !locationId
    ) {
      setError(
        "Please select your work location."
      );
      return;
    }

    if (
      selectedStatus?.name === "Present" &&
      !shiftId
    ) {
      setError(
        "Please select your shift."
      );
      return;
    }

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const token =
        localStorage.getItem("eams_token");

      const payload = {
        employeeId: employee.id,
        date: selectedDate,
        statusId: Number(statusId),
        locationId: locationId
          ? Number(locationId)
          : null,
        shiftId: shiftId
          ? Number(shiftId)
          : null,
        remarks:
          remarks.trim() || null,
      };

      const response = await fetch(
        `${API}/Attendance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(
          responseText || "Unable to save attendance."
        );
      }

      setMessage(
        editingId
          ? "Attendance updated successfully."
          : "Attendance saved successfully."
      );

      await loadData(employee.id);

      setTimeout(() => {
        setMessage("");
      }, 2500);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to save attendance."
      );
    } finally {
      setSaving(false);
    }
  }

  const summary = {
    present: monthRecords.filter(
      (r) => getStatusName(r) === "Present"
    ).length,

    wfo: monthRecords.filter(
      (r) =>
        getStatusName(r) === "Present" &&
        getLocationName(r) === "Office"
    ).length,

    wfh: monthRecords.filter(
      (r) =>
        getStatusName(r) === "Present" &&
        getLocationName(r) === "Home"
    ).length,

    client: monthRecords.filter(
      (r) =>
        getStatusName(r) === "Present" &&
        getLocationName(r) === "Client Site"
    ).length,

    sick: monthRecords.filter(
      (r) => getStatusName(r) === "Sick Leave"
    ).length,

    vacation: monthRecords.filter(
      (r) => getStatusName(r) === "Vacation"
    ).length,

    absent: monthRecords.filter(
      (r) => getStatusName(r) === "Absent"
    ).length,
  };

  if (loading) {
    return (
      <EamsShell role="Employee">
        <div className="attendance-loading">
          <div className="loading-spinner" />
          <p>
            Loading your attendance...
          </p>
        </div>
      </EamsShell>
    );
  }

  return (
    <EamsShell role="Employee">
      <div className="professional-attendance">

        {/* HEADER */}

        <div className="attendance-top">

          <div>
            <div className="attendance-breadcrumb">
              Employee Portal / Attendance
            </div>

            <h1>
              My Attendance
            </h1>

            <p>
              Manage and review your monthly
              attendance, work location and shifts.
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() => setShowMonthsModal(true)}
              title="All Months Overview"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: "10px",
                width: "42px",
                height: "42px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.25rem",
                transition: "background 0.2s",
                color: "inherit",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.3)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.08)")}
            >
              ⚙️
            </button>

            <button
              className="attendance-today-btn"
              onClick={currentMonthButton}
            >
              <span>Today</span>
            </button>
          </div>

        </div>

        {/* ALERTS */}

        {error && (
          <div className="attendance-alert error">
            <span>!</span>
            <div>
              {error}
            </div>
            <button
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>
          </div>
        )}

        {message && (
          <div className="attendance-alert success">
            <span>✓</span>
            <div>
              {message}
            </div>
            <button
              onClick={() =>
                setMessage("")
              }
            >
              ×
            </button>
          </div>
        )}

        {/* SUMMARY */}

        <div className="attendance-summary-grid">

          <div className="attendance-summary-card total">
            <div className="summary-card-icon">
              ✓
            </div>

            <div>
              <span>
                Present
              </span>

              <strong>
                {summary.present}
              </strong>

              <small>
                Days this month
              </small>
            </div>
          </div>

          <div className="attendance-summary-card wfo">
            <div className="summary-card-icon">
              🏢
            </div>

            <div>
              <span>
                WFO
              </span>

              <strong>
                {summary.wfo}
              </strong>

              <small>
                Office days
              </small>
            </div>
          </div>

          <div className="attendance-summary-card wfh">
            <div className="summary-card-icon">
              🏠
            </div>

            <div>
              <span>
                WFH
              </span>

              <strong>
                {summary.wfh}
              </strong>

              <small>
                Home days
              </small>
            </div>
          </div>

          <div className="attendance-summary-card leave">
            <div className="summary-card-icon">
              +
            </div>

            <div>
              <span>
                Leave
              </span>

              <strong>
                {summary.sick +
                  summary.vacation}
              </strong>

              <small>
                Leave days
              </small>
            </div>
          </div>

          <div className="attendance-summary-card absent">
            <div className="summary-card-icon">
              !
            </div>

            <div>
              <span>
                Absent
              </span>

              <strong>
                {summary.absent}
              </strong>

              <small>
                Days
              </small>
            </div>
          </div>

        </div>

        {/* MAIN AREA */}

        <div className="attendance-main-grid">

          {/* CALENDAR */}

          <section className="attendance-calendar-card">

            <div className="calendar-toolbar">

              <div>
                <h2>
                  {monthName}
                </h2>

                <p>
                  Click a date to view or edit
                  attendance.
                </p>
              </div>

              <div className="calendar-navigation">

                <button
                  onClick={previousMonth}
                  aria-label="Previous month"
                >
                  ‹
                </button>

                <button
                  className="calendar-current"
                  onClick={() => {
                    setCurrentMonth(
                      new Date(
                        today.getFullYear(),
                        today.getMonth(),
                        1
                      )
                    );
                  }}
                >
                  Current Month
                </button>

                <button
                  onClick={nextMonth}
                  aria-label="Next month"
                >
                  ›
                </button>

              </div>

            </div>

            {/* LEGEND */}

            <div className="attendance-legend">

              <span>
                <i className="legend-dot wfo-dot" />
                WFO
              </span>

              <span>
                <i className="legend-dot wfh-dot" />
                WFH
              </span>

              <span>
                <i className="legend-dot client-dot" />
                Client
              </span>

              <span>
                <i className="legend-dot sick-dot" />
                Sick Leave
              </span>

              <span>
                <i className="legend-dot vacation-dot" />
                Vacation
              </span>

              <span>
                <i className="legend-dot absent-dot" />
                Absent
              </span>

            </div>

            {/* WEEKDAYS */}

            <div className="calendar-weekdays">

              {[
                "Sun",
                "Mon",
                "Tue",
                "Wed",
                "Thu",
                "Fri",
                "Sat",
              ].map((day) => (
                <div key={day}>
                  {day}
                </div>
              ))}

            </div>

            {/* CALENDAR DAYS */}

            <div className="calendar-days-grid">

              {monthDays.map(
                (date, index) => {

                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="calendar-empty"
                      />
                    );
                  }

                  const dateString =
                    formatDate(date);

                  const record =
                    getRecordForDate(
                      dateString
                    );

                  const isToday =
                    dateString ===
                    todayString;

                  const isSelected =
                    selectedDate ===
                    dateString;

                  const statusClass =
                    getStatusClass(
                      record
                    );

                  return (
                    <button
                      key={dateString}
                      className={`calendar-date-cell ${
                        isToday
                          ? "calendar-today"
                          : ""
                      } ${
                        isSelected
                          ? "calendar-selected"
                          : ""
                      }`}
                      onClick={() =>
                        openDate(
                          dateString
                        )
                      }
                    >

                      <div className="calendar-date-number">
                        {date.getDate()}
                      </div>

                      {record ? (
                        <>

                          <div
                            className={`calendar-status ${statusClass}`}
                          >
                            {getLocationLabel(
                              record
                            )}
                          </div>

                          {getShiftName(record) && (
                            <div className="calendar-shift">
                              {getShiftName(record)}
                            </div>
                          )}

                        </>
                      ) : (
                        <div className="calendar-not-marked">
                          Not marked
                        </div>
                      )}

                    </button>
                  );
                }
              )}

            </div>

          </section>

          {/* EDITOR */}

          <aside className="attendance-editor-card">

            {!showEditor ? (
              <div className="editor-placeholder">

                <div className="editor-calendar-icon">
                  📅
                </div>

                <h3>
                  Select a date
                </h3>

                <p>
                  Choose any date from the calendar
                  to view or manage attendance.
                </p>

                <div className="editor-tip">
                  <strong>
                    Tip
                  </strong>

                  <span>
                    You can edit an existing
                    attendance record by clicking
                    its date.
                  </span>
                </div>

              </div>
            ) : (
              <>

                <div className="editor-title-row">

                  <div>
                    <span>
                      Attendance Date
                    </span>

                    <h3>
                      {selectedDate
                        ? parseLocalDate(
                            selectedDate
                          ).toLocaleDateString(
                            "en-US",
                            {
                              weekday:
                                "long",
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )
                        : ""}
                    </h3>
                  </div>

                  <button
                    className="editor-close"
                    onClick={closeEditor}
                  >
                    ×
                  </button>

                </div>

                <div style={{
                  background: "rgba(37,99,235,0.08)",
                  border: "1px solid rgba(37,99,235,0.25)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}>
                  <span style={{ fontSize: "1.1rem" }}>🗓️</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.82rem", color: "#2563eb", marginBottom: "2px" }}>
                      {editingId ? "Update Schedule / Attendance" : "Schedule / Mark Attendance"}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", lineHeight: 1.3 }}>
                      Mark Present (P) or Absent (A). All changes update directly to your monthly plan.
                    </div>
                  </div>
                </div>

                <div className="editor-divider" />

                {/* STATUS */}

                <div className="editor-group">

                  <label>
                    Attendance Status
                  </label>

                  <div className="editor-status-grid">

                    {statuses.map(
                      (status) => {

                        const active =
                          statusId ===
                          String(
                            status.id
                          );

                        return (
                          <button
                            key={status.id}
                            className={`editor-status-option ${
                              active
                                ? "active"
                                : ""
                            }`}
                            onClick={() =>
                              handleStatusChange(
                                String(
                                  status.id
                                )
                              )
                            }
                          >

                            <span
                              className={`status-symbol ${
                                status.name
                                  .toLowerCase()
                                  .replace(
                                    /\s/g,
                                    "-"
                                  )
                              }`}
                            >
                              {active
                                ? "✓"
                                : ""}
                            </span>

                            <span>
                              {status.name}
                            </span>

                          </button>
                        );
                      }
                    )}

                  </div>

                </div>

                {/* LOCATION */}

                {statusId &&
                  statuses.find(
                    (status) =>
                      status.id ===
                      Number(statusId)
                  )?.name ===
                    "Present" && (
                    <>

                      <div className="editor-group">

                        <label>
                          Work Location
                        </label>

                        <div className="editor-location-grid">

                          {locations.map(
                            (location) => {

                              const active =
                                locationId ===
                                String(
                                  location.id
                                );

                              return (
                                <button
                                  key={
                                    location.id
                                  }
                                  className={`editor-location-option ${
                                    active
                                      ? "active"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    setLocationId(
                                      String(
                                        location.id
                                      )
                                    )
                                  }
                                >

                                  <span className="location-icon">
                                    {location.name ===
                                    "Office"
                                      ? "🏢"
                                      : location.name ===
                                        "Home"
                                      ? "🏠"
                                      : "📍"}
                                  </span>

                                  <div>
                                    <strong>
                                      {
                                        location.name
                                      }
                                    </strong>

                                    <small>
                                      {location.name ===
                                      "Office"
                                        ? "Work from office"
                                        : location.name ===
                                          "Home"
                                        ? "Work from home"
                                        : "External location"}
                                    </small>
                                  </div>

                                  {active && (
                                    <span className="selected-check">
                                      ✓
                                    </span>
                                  )}

                                </button>
                              );
                            }
                          )}

                        </div>

                      </div>

                      {/* SHIFT */}

                      <div className="editor-group">

                        <label>
                          Shift
                        </label>

                        <div className="editor-shift-grid">

                          {shifts.map(
                            (shift) => {

                              const active =
                                shiftId ===
                                String(
                                  shift.id
                                );

                              return (
                                <button
                                  key={shift.id}
                                  className={`editor-shift-option ${
                                    active
                                      ? "active"
                                      : ""
                                  }`}
                                  onClick={() =>
                                    setShiftId(
                                      String(
                                        shift.id
                                      )
                                    )
                                  }
                                >

                                  <div>
                                    <strong>
                                      {shift.name}
                                    </strong>

                                    <small>
                                      {
                                        shift.startTime
                                      }{" "}
                                      -
                                      {
                                        shift.endTime
                                      }
                                    </small>
                                  </div>

                                  {active && (
                                    <span>
                                      ✓
                                    </span>
                                  )}

                                </button>
                              );
                            }
                          )}

                        </div>

                      </div>

                    </>
                  )}

                {/* REMARKS */}

                <div className="editor-group">

                  <label>
                    Remarks
                    <span>
                      Optional
                    </span>
                  </label>

                  <textarea
                    value={remarks}
                    onChange={(e) =>
                      setRemarks(
                        e.target.value
                      )
                    }
                    placeholder="Add a note about this attendance..."
                    rows={3}
                  />

                </div>

                <button
                  className="save-attendance-button"
                  onClick={saveAttendance}
                  disabled={saving}
                  style={editingId ? {
                    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                  } : {}}
                >
                  {saving
                    ? (editingId ? "Submitting Request..." : "Saving...")
                    : editingId
                    ? "Submit Correction Request"
                    : "Save Attendance"}
                </button>

                <p className="editor-policy">
                  {editingId
                    ? "Correction requests require manager approval before changes take effect."
                    : "Attendance changes are recorded in the EAMS system."}
                </p>

              </>
            )}

          </aside>

        </div>

        {/* MONTHLY TABLE */}

        <section className="attendance-history-card">

          <div className="history-header">

            <div>
              <h2>
                Monthly Attendance History
              </h2>

              <p>
                Attendance records for{" "}
                {monthName}
              </p>
            </div>

            <button
              className="history-refresh"
              onClick={() =>
                employee &&
                loadData(employee.id)
              }
            >
              ↻ Refresh
            </button>

          </div>

          <div className="history-table-wrap">

            <table className="attendance-history-table">

              <thead>
                <tr>
                  <th>
                    Date
                  </th>

                  <th>
                    Status
                  </th>

                  <th>
                    Location
                  </th>

                  <th>
                    Shift
                  </th>

                  <th>
                    Remarks
                  </th>

                  <th>
                    Action
                  </th>
                </tr>
              </thead>

              <tbody>

                {[
                  ...monthRecords,
                ]
                  .sort(
                    (a, b) =>
                      parseLocalDate(
                        b.date
                      ).getTime() -
                      parseLocalDate(
                        a.date
                      ).getTime()
                  )
                  .map((record) => (
                    <tr key={record.id}>

                      <td>
                        <strong>
                          {parseLocalDate(
                            record.date
                          ).toLocaleDateString(
                            "en-US",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </strong>
                      </td>

                      <td>
                        <span
                          className={`history-status ${getStatusClass(
                            record
                          )}`}
                        >
                          {getStatusName(record) ||
                            "—"}
                        </span>
                      </td>

                      <td>
                        {getLocationName(record) ||
                          "—"}
                      </td>

                      <td>
                        {getShiftName(record) ||
                          "—"}
                      </td>

                      <td>
                        {record.remarks ||
                          "—"}
                      </td>

                      <td>
                        <button
                          className="history-edit"
                          onClick={() =>
                            openDate(
                              record.date.substring(
                                0,
                                10
                              )
                            )
                          }
                        >
                          Edit
                        </button>
                      </td>

                    </tr>
                  ))}

                {monthRecords.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="history-empty"
                    >
                      No attendance records
                      found for this month.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </section>

      </div>

      {/* ALL MONTHS MODAL */}
      {showMonthsModal && (
        <AllMonthsModal
          attendance={attendance}
          onClose={() => setShowMonthsModal(false)}
        />
      )}

    </EamsShell>
  );
}

// ============================================================
// ALL MONTHS OVERVIEW MODAL
// ============================================================

const MONTH_NAMES = [
  "January", "February", "March", "April",
  "May", "June", "July", "August",
  "September", "October", "November", "December",
];

function AllMonthsModal({
  attendance,
  onClose,
}: {
  attendance: { date: string; status?: { name: string } | null; location?: { name: string } | null }[];
  onClose: () => void;
}) {
  const year = new Date().getFullYear();

  const monthStats = MONTH_NAMES.map((name, idx) => {
    const recs = attendance.filter((r) => {
      const d = new Date(r.date);
      return d.getFullYear() === year && d.getMonth() === idx;
    });
    const present = recs.filter((r) => r.status?.name === "Present").length;
    const absent  = recs.filter((r) => r.status?.name === "Absent").length;
    const leave   = recs.filter((r) =>
      r.status?.name === "Sick Leave" || r.status?.name === "Vacation"
    ).length;
    const wfo = recs.filter((r) => r.status?.name === "Present" && r.location?.name === "Office").length;
    const wfh = recs.filter((r) => r.status?.name === "Present" && r.location?.name === "Home").length;
    return { name, idx, total: recs.length, present, absent, leave, wfo, wfh };
  });

  const currentMonth = new Date().getMonth();

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.75)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#151926",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "820px",
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 32px 80px rgba(0,0,0,0.6)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px 28px 20px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 700 }}>
              ⚙️ All Months Schedule — {year}
            </h2>
            <p style={{ margin: "4px 0 0", fontSize: "0.8rem", color: "#9ca3af" }}>
              Full year attendance overview
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "8px",
              color: "#fff",
              cursor: "pointer",
              fontSize: "1.2rem",
              width: "36px",
              height: "36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Grid */}
        <div
          style={{
            padding: "20px 28px",
            overflowY: "auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: "12px",
          }}
        >
          {monthStats.map((m) => {
            const isCurrent = m.idx === currentMonth;
            const hasData = m.total > 0;
            return (
              <div
                key={m.idx}
                style={{
                  background: isCurrent
                    ? "rgba(99,102,241,0.15)"
                    : hasData
                    ? "rgba(255,255,255,0.05)"
                    : "rgba(255,255,255,0.02)",
                  border: isCurrent
                    ? "1px solid rgba(99,102,241,0.5)"
                    : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "14px",
                  padding: "16px",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {isCurrent && (
                  <div
                    style={{
                      position: "absolute",
                      top: "10px",
                      right: "10px",
                      background: "#6366f1",
                      borderRadius: "5px",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: "#fff",
                      padding: "2px 6px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    NOW
                  </div>
                )}

                <div
                  style={{
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: isCurrent ? "#a5b4fc" : "#9ca3af",
                    textTransform: "uppercase",
                    letterSpacing: "0.07em",
                    marginBottom: "10px",
                  }}
                >
                  {m.name}
                </div>

                {!hasData ? (
                  <div style={{ fontSize: "0.75rem", color: "#4b5563", fontStyle: "italic" }}>
                    No records
                  </div>
                ) : (
                  <>
                    {/* Progress bar */}
                    <div
                      style={{
                        background: "rgba(255,255,255,0.08)",
                        borderRadius: "4px",
                        height: "6px",
                        marginBottom: "10px",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.round((m.present / m.total) * 100)}%`,
                          height: "100%",
                          background: "linear-gradient(90deg, #6366f1, #22d3ee)",
                          borderRadius: "4px",
                          transition: "width 0.4s",
                        }}
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <StatRow icon="✓" label="Present" value={m.present} color="#34d399" />
                      <StatRow icon="🏢" label="WFO" value={m.wfo} color="#60a5fa" />
                      <StatRow icon="🏠" label="WFH" value={m.wfh} color="#a78bfa" />
                      {m.leave > 0 && <StatRow icon="📋" label="Leave" value={m.leave} color="#fbbf24" />}
                      {m.absent > 0 && <StatRow icon="✗" label="Absent" value={m.absent} color="#f87171" />}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StatRow({
  icon, label, value, color
}: { icon: string; label: string; value: number; color: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontSize: "0.73rem",
      }}
    >
      <span style={{ color: "#9ca3af" }}>{icon} {label}</span>
      <span style={{ color, fontWeight: 700 }}>{value}</span>
    </div>
  );
}