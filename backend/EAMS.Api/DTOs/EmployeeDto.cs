namespace EAMS.Api.DTOs
{
    public class EmployeeDto
    {
        public int Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        public int DepartmentId { get; set; }
        public string Department { get; set; } = string.Empty;

        public int RoleId { get; set; }
        public string Role { get; set; } = string.Empty;

        public int? ManagerId { get; set; }
        public string? Manager { get; set; }
    }
}