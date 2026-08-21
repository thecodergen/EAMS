using System;

namespace EAMS.Api.Models
{
    public class AttendanceCorrection
    {
        public int Id { get; set; }

        public int? AttendanceId { get; set; }
        public Attendance? Attendance { get; set; }

        public int EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        public DateOnly Date { get; set; }

        public int RequestedStatusId { get; set; }
        public AttendanceStatus? RequestedStatus { get; set; }

        public int? RequestedLocationId { get; set; }
        public WorkLocation? RequestedLocation { get; set; }

        public int? RequestedShiftId { get; set; }
        public Shift? RequestedShift { get; set; }

        public string Reason { get; set; } = string.Empty;

        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected

        public int? ActionedByManagerId { get; set; }
        public Employee? ActionedByManager { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        public DateTime? ActionedAt { get; set; }
    }
}
