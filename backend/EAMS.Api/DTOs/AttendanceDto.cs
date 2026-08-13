namespace EAMS.Api.DTOs
{
    public class AttendanceDto
    {
        public int Id { get; set; }
        public DateOnly Date { get; set; }
        public string? Remarks { get; set; }

        public int EmployeeId { get; set; }
        public string EmployeeName { get; set; } = string.Empty;

        public int StatusId { get; set; }
        public string Status { get; set; } = string.Empty;

        public int? LocationId { get; set; }
        public string? Location { get; set; }

        public int? ShiftId { get; set; }
        public string? Shift { get; set; }
    }
}