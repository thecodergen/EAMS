"use client";

import { useEffect, useState } from "react";

type Employee = {
  id: number;
  fullName: string;
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

export default function AttendancePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [statuses, setStatuses] = useState<AttendanceStatus[]>([]);
  const [locations, setLocations] = useState<WorkLocation[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState("");
  const [statusId, setStatusId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [remarks, setRemarks] = useState("");

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [
          employeesResponse,
          statusesResponse,
          locationsResponse,
          shiftsResponse,
        ] = await Promise.all([
          fetch("http://localhost:5000/api/Employees"),
          fetch("http://localhost:5000/api/AttendanceStatuses"),
          fetch("http://localhost:5000/api/WorkLocations"),
          fetch("http://localhost:5000/api/Shifts"),
        ]);

        if (
          !employeesResponse.ok ||
          !statusesResponse.ok ||
          !locationsResponse.ok ||
          !shiftsResponse.ok
        ) {
          throw new Error("Failed to load attendance data");
        }

        const employeesData = await employeesResponse.json();
        const statusesData = await statusesResponse.json();
        const locationsData = await locationsResponse.json();
        const shiftsData = await shiftsResponse.json();

        setEmployees(employeesData);
        setStatuses(statusesData);
        setLocations(locationsData);
        setShifts(shiftsData);

        setLoading(false);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong"
        );
        setLoading(false);
      }
    }

    loadData();
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setMessage("");
    setError("");

    const attendanceData = {
      employeeId: Number(employeeId),
      date,
      statusId: Number(statusId),
      locationId: locationId ? Number(locationId) : null,
      shiftId: shiftId ? Number(shiftId) : null,
      remarks: remarks || null,
    };

    try {
      const response = await fetch(
        "http://localhost:5000/api/Attendance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(attendanceData),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || "Failed to submit attendance"
        );
      }

      setMessage("Attendance submitted successfully.");

      setEmployeeId("");
      setDate("");
      setStatusId("");
      setLocationId("");
      setShiftId("");
      setRemarks("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to submit attendance"
      );
    }
  }

  if (loading) {
    return <main style={{ padding: "40px" }}>Loading...</main>;
  }

  return (
    <main
      style={{
        padding: "40px",
        fontFamily: "sans-serif",
        maxWidth: "700px",
        margin: "0 auto",
      }}
    >
      <h1
        style={{
          fontSize: "28px",
          fontWeight: "bold",
          marginBottom: "25px",
        }}
      >
        Submit Attendance
      </h1>

      {message && (
        <p style={{ color: "green", marginBottom: "15px" }}>
          {message}
        </p>
      )}

      {error && (
        <p style={{ color: "red", marginBottom: "15px" }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "15px" }}>
          <label>Employee</label>
          <br />

          <select
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
            style={{ width: "100%", padding: "10px" }}
          >
            <option value="">Select Employee</option>

            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.fullName}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Date</label>
          <br />

          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Status</label>
          <br />

          <select
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
            required
            style={{ width: "100%", padding: "10px" }}
          >
            <option value="">Select Status</option>

            {statuses.map((status) => (
              <option key={status.id} value={status.id}>
                {status.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Work Location</label>
          <br />

          <select
            value={locationId}
            onChange={(e) => setLocationId(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
          >
            <option value="">Select Location</option>

            {locations.map((location) => (
              <option key={location.id} value={location.id}>
                {location.name}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Shift</label>
          <br />

          <select
            value={shiftId}
            onChange={(e) => setShiftId(e.target.value)}
            style={{ width: "100%", padding: "10px" }}
          >
            <option value="">Select Shift</option>

            {shifts.map((shift) => (
              <option key={shift.id} value={shift.id}>
                {shift.name} ({shift.startTime} - {shift.endTime})
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label>Remarks</label>
          <br />

          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional remarks"
            rows={4}
            style={{ width: "100%", padding: "10px" }}
          />
        </div>

        <button
          type="submit"
          style={{
            padding: "12px 20px",
            cursor: "pointer",
          }}
        >
          Submit Attendance
        </button>
      </form>
    </main>
  );
}