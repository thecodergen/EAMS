using Microsoft.EntityFrameworkCore;
using EAMS.Api.Models;

namespace EAMS.Api.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options)
            : base(options)
        {
        }

        // ============================================
        // MASTER DATA
        // ============================================

        public DbSet<Department> Departments { get; set; }

        public DbSet<Role> Roles { get; set; }

        public DbSet<Employee> Employees { get; set; }

        public DbSet<WorkLocation> WorkLocations { get; set; }

        public DbSet<Shift> Shifts { get; set; }

        public DbSet<AttendanceStatus> AttendanceStatuses { get; set; }

        // ============================================
        // ATTENDANCE
        // ============================================

        public DbSet<Attendance> Attendances { get; set; }

        public DbSet<AttendanceCorrection> AttendanceCorrections { get; set; }

        // ============================================
        // LEAVE MANAGEMENT
        // ============================================

        public DbSet<LeaveRequest> LeaveRequests { get; set; }

        // ============================================
        // HOLIDAY MANAGEMENT
        // ============================================

        public DbSet<Holiday> Holidays { get; set; }

        // ============================================
        // AUDIT LOGS
        // ============================================

        public DbSet<AuditLog> AuditLogs { get; set; }

        // ============================================
        // NOTIFICATIONS
        // ============================================

        public DbSet<Notification> Notifications { get; set; }

        // ============================================
        // MODEL CONFIGURATION
        // ============================================

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Employee → Manager relationship
            modelBuilder.Entity<Employee>()
                .HasOne(e => e.Manager)
                .WithMany()
                .HasForeignKey(e => e.ManagerId)
                .OnDelete(DeleteBehavior.Restrict);

            // Username must be unique (enforced at DB level)
            modelBuilder.Entity<Employee>()
                .HasIndex(e => e.Username)
                .IsUnique();


            // Notification → Employee relationship
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Employee)
                .WithMany()
                .HasForeignKey(n => n.EmployeeId)
                .OnDelete(DeleteBehavior.Cascade);

            // Attendance → Employee + Date Unique Constraint
            modelBuilder.Entity<Attendance>()
                .HasIndex(a => new { a.EmployeeId, a.Date })
                .IsUnique();

            // AttendanceCorrection relationships
            modelBuilder.Entity<AttendanceCorrection>()
                .HasOne(c => c.Employee)
                .WithMany()
                .HasForeignKey(c => c.EmployeeId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<AttendanceCorrection>()
                .HasOne(c => c.ActionedByManager)
                .WithMany()
                .HasForeignKey(c => c.ActionedByManagerId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}