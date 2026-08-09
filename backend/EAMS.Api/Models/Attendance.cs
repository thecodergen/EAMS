namespace EAMS.Api.Models
{
    public class Attendance
    {
        public int Id { get; set; }
        public DateOnly Date { get; set; }
        public string? Remarks { get; set; }

        public int EmployeeId { get; set; }
        public Employee? Employee { get; set; }

        public int StatusId { get; set; }
        public AttendanceStatus? Status { get; set; }

        public int? LocationId { get; set; }
        public WorkLocation? Location { get; set; }

        public int? ShiftId { get; set; }
        public Shift? Shift { get; set; }
    }
}