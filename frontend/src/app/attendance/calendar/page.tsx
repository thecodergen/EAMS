"use client";

import { useEffect, useState } from "react";

type Attendance = {
  id: number;
  date: string;
  remarks: string | null;
  employeeId: number;
  status: {
    id: number;
    name: string;
  } | null;
  location: {
    id: number;
    name: string;
  } | null;
  shift: {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
  } | null;
};

type Status = {
  id: number;
  name: string;
};

type Location = {
  id: number;
  name: string;
};

type Shift = {
  id: number;
  name: string;
  startTime: string;
  endTime: string;
};

export default function AttendanceCalendar() {
  const employeeId = 1;

  const [currentMonth, setCurrentMonth] = useState(
    new Date(2026, 7, 1)
  );

  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState("");

  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  // ============================================
  // LOAD DATA
  // ============================================

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        attendanceResponse,
        statusResponse,
        locationResponse,
        shiftResponse,
      ] = await Promise.all([
        fetch("http://localhost:5000/api/Attendance"),
        fetch("http://localhost:5000/api/AttendanceStatuses"),
        fetch("http://localhost:5000/api/WorkLocations"),
        fetch("http://localhost:5000/api/Shifts"),
      ]);

      if (
        !attendanceResponse.ok ||
        !statusResponse.ok ||
        !locationResponse.ok ||
        !shiftResponse.ok
      ) {
        throw new Error("Failed to load EAMS data");
      }

      const attendanceData = await attendanceResponse.json();
      const statusData = await statusResponse.json();
      const locationData = await locationResponse.json();
      const shiftData = await shiftResponse.json();

      setAttendance(attendanceData);
      setStatuses(statusData);
      setLocations(locationData);
      setShifts(shiftData);
    } catch (error) {
      console.error(error);
      setMessage("Unable to connect to EAMS backend.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ============================================
  // CALENDAR
  // ============================================

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const monthName = currentMonth.toLocaleString("default", {
    month: "long",
  });

  const previousMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const getAttendanceForDate = (day: number) => {
    const date =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
      )}`;

    return attendance.find(
      (item) =>
        item.employeeId === employeeId &&
        item.date.startsWith(date)
    );
  };

  const getAttendanceCode = (record: Attendance) => {
    if (record.status?.name === "Sick Leave") {
      return "Sick Leave";
    }

    if (record.status?.name === "Vacation") {
      return "Vacation";
    }

    if (
      record.location?.name === "Office" &&
      record.shift?.name === "Morning"
    ) {
      return "WFO-MS";
    }

    if (
      record.location?.name === "Office" &&
      record.shift?.name === "Afternoon"
    ) {
      return "WFO-AS";
    }

    if (
      record.location?.name === "Office" &&
      record.shift?.name === "Night"
    ) {
      return "WFO-NS";
    }

    if (
      record.location?.name === "Home" &&
      record.shift?.name === "Morning"
    ) {
      return "WFH-MS";
    }

    if (
      record.location?.name === "Home" &&
      record.shift?.name === "Afternoon"
    ) {
      return "WFH-AS";
    }

    if (
      record.location?.name === "Home" &&
      record.shift?.name === "Night"
    ) {
      return "WFH-NS";
    }

    return record.status?.name ?? "";
  };

  const calendarDays: (number | null)[] = [];

  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  // ============================================
  // SELECT DATE
  // ============================================

  const handleDateClick = (day: number) => {
    const date =
      `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(
        2,
        "0"
      )}`;

    setSelectedDate(date);
    setMessage("");

    const existingRecord = attendance.find(
      (item) =>
        item.employeeId === employeeId &&
        item.date.startsWith(date)
    );

    if (existingRecord) {
      setSelectedOption(getAttendanceCode(existingRecord));
      setRemarks(existingRecord.remarks ?? "");
    } else {
      setSelectedOption("");
      setRemarks("");
    }
  };

  // ============================================
  // SUBMIT ATTENDANCE
  // ============================================

  const submitAttendance = async () => {
    if (!selectedDate) {
      setMessage("Please select a date.");
      return;
    }

    if (!selectedOption) {
      setMessage("Please select a shift status.");
      return;
    }

    const existingRecord = attendance.find(
      (item) =>
        item.employeeId === employeeId &&
        item.date.startsWith(selectedDate)
    );

    if (existingRecord) {
      setMessage(
        "Attendance already exists for this date. Use another date."
      );
      return;
    }

    let statusId: number | null = null;
    let locationId: number | null = null;
    let shiftId: number | null = null;

    // ----------------------------
    // Sick Leave
    // ----------------------------

    if (selectedOption === "Sick Leave") {
      const status = statuses.find(
        (s) => s.name === "Sick Leave"
      );

      statusId = status?.id ?? null;
    }

    // ----------------------------
    // Vacation
    // ----------------------------

    else if (selectedOption === "Vacation") {
      const status = statuses.find(
        (s) => s.name === "Vacation"
      );

      statusId = status?.id ?? null;
    }

    // ----------------------------
    // WFO / WFH
    // ----------------------------

    else {
      const isOffice = selectedOption.startsWith("WFO");

      const location = locations.find(
        (l) =>
          l.name === (isOffice ? "Office" : "Home")
      );

      locationId = location?.id ?? null;

      let shiftName = "Morning";

      if (
        selectedOption.endsWith("AS")
      ) {
        shiftName = "Afternoon";
      }

      if (
        selectedOption.endsWith("NS")
      ) {
        shiftName = "Night";
      }

      const shift = shifts.find(
        (s) => s.name === shiftName
      );

      shiftId = shift?.id ?? null;

      const presentStatus = statuses.find(
        (s) => s.name === "Present"
      );

      statusId = presentStatus?.id ?? null;
    }

    if (!statusId) {
      setMessage("Attendance status was not found.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/Attendance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            date: selectedDate,
            remarks: remarks || null,
            employeeId,
            statusId,
            locationId,
            shiftId,
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();

        setMessage(
          errorText || "Failed to submit attendance."
        );

        return;
      }

      setMessage("Attendance submitted successfully.");

      await loadData();

      setSelectedOption("");
      setRemarks("");
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to connect to EAMS backend."
      );
    }
  };

  // ============================================
  // UI
  // ============================================

  return (
    <main
      style={{
        padding: "40px",
        fontFamily: "sans-serif",
        maxWidth: "1200px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: "30px",
          fontWeight: "bold",
          marginBottom: "10px",
        }}
      >
        Attendance Calendar
      </h1>

      <p
        style={{
          color: "#666",
          marginBottom: "30px",
        }}
      >
        View and manage employee attendance.
      </p>

      {loading && (
        <p>Loading EAMS attendance...</p>
      )}

      {!loading && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "1fr 320px",
            gap: "25px",
          }}
        >
          {/* ================================= */}
          {/* CALENDAR */}
          {/* ================================= */}

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "25px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: "25px",
              }}
            >
              <h2
                style={{
                  fontSize: "22px",
                }}
              >
                {monthName} {year}
              </h2>

              <div>
                <button
                  onClick={previousMonth}
                  style={{
                    padding: "8px 14px",
                    marginRight: "8px",
                    cursor: "pointer",
                  }}
                >
                  ←
                </button>

                <button
                  onClick={nextMonth}
                  style={{
                    padding: "8px 14px",
                    cursor: "pointer",
                  }}
                >
                  →
                </button>
              </div>
            </div>

            {/* Week days */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(7, 1fr)",
                gap: "8px",
                marginBottom: "8px",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              <div>Sun</div>
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div>Sat</div>
            </div>

            {/* Days */}

            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(7, 1fr)",
                gap: "8px",
              }}
            >
              {calendarDays.map(
                (day, index) => {
                  const record = day
                    ? getAttendanceForDate(day)
                    : undefined;

                  const dateString = day
                    ? `${year}-${String(
                        month + 1
                      ).padStart(
                        2,
                        "0"
                      )}-${String(
                        day
                      ).padStart(
                        2,
                        "0"
                      )}`
                    : "";

                  const selected =
                    selectedDate ===
                    dateString;

                  return (
                    <div
                      key={index}
                      onClick={() =>
                        day &&
                        handleDateClick(day)
                      }
                      style={{
                        minHeight: "90px",
                        border:
                          selected
                            ? "2px solid #2563eb"
                            : "1px solid #ddd",
                        borderRadius: "8px",
                        padding: "10px",
                        cursor: day
                          ? "pointer"
                          : "default",
                        backgroundColor:
                          selected
                            ? "#eff6ff"
                            : day
                            ? "#fff"
                            : "#f8f8f8",
                      }}
                    >
                      {day && (
                        <>
                          <div
                            style={{
                              fontWeight:
                                "bold",
                              marginBottom:
                                "10px",
                            }}
                          >
                            {day}
                          </div>

                          {record && (
                            <>
                              <div
                                style={{
                                  fontSize:
                                    "12px",
                                  fontWeight:
                                    "bold",
                                  color:
                                    "#2563eb",
                                }}
                              >
                                {getAttendanceCode(
                                  record
                                )}
                              </div>

                              <div
                                style={{
                                  fontSize:
                                    "11px",
                                  color:
                                    "#555",
                                }}
                              >
                                {
                                  record.location
                                    ?.name
                                }
                              </div>

                              <div
                                style={{
                                  fontSize:
                                    "11px",
                                  color:
                                    "#777",
                                }}
                              >
                                {
                                  record.shift
                                    ?.name
                                }
                              </div>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  );
                }
              )}
            </div>
          </div>

          {/* ================================= */}
          {/* LOG SHIFT STATUS */}
          {/* ================================= */}

          <div
            style={{
              border: "1px solid #ddd",
              borderRadius: "12px",
              padding: "25px",
              height: "fit-content",
            }}
          >
            <h2
              style={{
                fontSize: "20px",
                fontWeight: "bold",
                marginBottom: "8px",
              }}
            >
              Log Shift Status
            </h2>

            <p
              style={{
                color: "#666",
                fontSize: "14px",
                marginBottom: "20px",
              }}
            >
              {selectedDate
                ? `Selected: ${selectedDate}`
                : "Select a date from the calendar"}
            </p>

            {[
              "WFO-MS",
              "WFO-AS",
              "WFO-NS",
              "WFH-MS",
              "WFH-AS",
              "WFH-NS",
              "Sick Leave",
              "Vacation",
            ].map((option) => (
              <label
                key={option}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "12px",
                  cursor: "pointer",
                }}
              >
                <input
                  type="radio"
                  name="attendance"
                  value={option}
                  checked={
                    selectedOption ===
                    option
                  }
                  onChange={(e) =>
                    setSelectedOption(
                      e.target.value
                    )
                  }
                />

                <span>{option}</span>
              </label>
            ))}

            <textarea
              placeholder="Remarks"
              value={remarks}
              onChange={(e) =>
                setRemarks(e.target.value)
              }
              style={{
                width: "100%",
                minHeight: "80px",
                padding: "10px",
                marginTop: "10px",
                marginBottom: "15px",
                border:
                  "1px solid #ddd",
                borderRadius: "8px",
                resize: "vertical",
              }}
            />

            <button
              onClick={submitAttendance}
              disabled={!selectedDate}
              style={{
                width: "100%",
                padding: "12px",
                border: "none",
                borderRadius: "8px",
                backgroundColor:
                  selectedDate
                    ? "#2563eb"
                    : "#aaa",
                color: "white",
                fontWeight: "bold",
                cursor: selectedDate
                  ? "pointer"
                  : "not-allowed",
              }}
            >
              Submit Shift Log
            </button>

            {message && (
              <p
                style={{
                  marginTop: "15px",
                  fontSize: "14px",
                }}
              >
                {message}
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}