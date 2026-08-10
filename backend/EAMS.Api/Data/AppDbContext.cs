using Microsoft.EntityFrameworkCore;
using EAMS.Api.Models;

namespace EAMS.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions options) : base(options) { }

        public DbSet<Department> Departments { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Employee> Employees { get; set; }
        public DbSet<WorkLocation> WorkLocations { get; set; }
        public DbSet<Shift> Shifts { get; set; }
        public DbSet<AttendanceStatus> AttendanceStatuses { get; set; }
        public DbSet<Attendance> Attendances { get; set; }

        // Leave Management
        public DbSet<LeaveRequest> LeaveRequests { get; set; }

        public DbSet<Holiday> Holidays { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Manager)
                .WithMany()
                .HasForeignKey(e => e.ManagerId)
                .OnDelete(DeleteBehavior.Restrict);

            base.OnModelCreating(modelBuilder);
        }
    }
}