using System;

namespace EAMS.Api.DTOs
{
    public class AttendanceCorrectionDto
    {
        public int Id { get; set; }
        public int? AttendanceId { get; set; }
        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;
        public string DepartmentName { get; set; } = string.Empty;
        public DateOnly Date { get; set; }
        public int RequestedStatusId { get; set; }
        public string RequestedStatus { get; set; } = string.Empty;
        public int? RequestedLocationId { get; set; }
        public string? RequestedLocation { get; set; }
        public int? RequestedShiftId { get; set; }
        public string? RequestedShift { get; set; }
        public string Reason { get; set; } = string.Empty;
        public string Status { get; set; } = "Pending";
        public int? ActionedByManagerId { get; set; }
        public string? ActionedByManagerName { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? ActionedAt { get; set; }
    }

    public class CreateAttendanceCorrectionDto
    {
        public int? AttendanceId { get; set; }
        public int EmployeeId { get; set; }
        public DateOnly Date { get; set; }
        public int RequestedStatusId { get; set; }
        public int? RequestedLocationId { get; set; }
        public int? RequestedShiftId { get; set; }
        public string? Reason { get; set; }
    }

    public class ActionCorrectionDto
    {
        public int ManagerId { get; set; }
    }
}
