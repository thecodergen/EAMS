namespace EAMS.Api.Models
{
    public class AttendanceStatus
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // e.g. Present, Absent, Leave, Half-Day
    }
}