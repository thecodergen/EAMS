namespace EAMS.Api.Models
{
    public class Role
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty; // e.g. Employee, Manager, Admin

        public ICollection<Employee> Employees { get; set; } = new List<Employee>();
    }
}