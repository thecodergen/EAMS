namespace EAMS.Api.Models
{
    public class Shift
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // e.g. Morning, Evening
        public TimeOnly StartTime { get; set; }
        public TimeOnly EndTime { get; set; }
    }
}