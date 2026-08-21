namespace EAMS.Api.Models
{
    public class Employee
    {
        public int Id { get; set; }

        // Login username
        public string Username { get; set; } = string.Empty;

        // Employee full name
        public string FullName { get; set; } = string.Empty;

        // Employee email
        public string Email { get; set; } = string.Empty;

        // Employee mobile number
        public string MobileNumber { get; set; } = string.Empty;

        // Secure password hash
        public string PasswordHash { get; set; } = string.Empty;

        // Role
        public int RoleId { get; set; }

        public Role? Role { get; set; }

        // Department
        public int DepartmentId { get; set; }

        public Department? Department { get; set; }

        // Manager
        public int? ManagerId { get; set; }

        public Employee? Manager { get; set; }

        // Account status
        public bool IsActive { get; set; } = true;

        // Registration date
        public DateTime CreatedDate { get; set; } = DateTime.UtcNow;

        // Last successful login
        public DateTime? LastLoginDate { get; set; }

        // Attendance records
        public ICollection<Attendance> AttendanceRecords { get; set; }
            = new List<Attendance>();
    }
}