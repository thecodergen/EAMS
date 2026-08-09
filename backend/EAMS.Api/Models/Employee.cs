namespace EAMS.Api.Models
{
    public class Employee
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        public int DepartmentId { get; set; }
        public Department? Department { get; set; }

        public int RoleId { get; set; }
        public Role? Role { get; set; }

        public int? ManagerId { get; set; } // self-referencing: employee's manager is also an employee
        public Employee? Manager { get; set; }

        public ICollection<Attendance> AttendanceRecords { get; set; } = new List<Attendance>();
    }
}