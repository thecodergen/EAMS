using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EAMS.Api.Data;

namespace EAMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ReportsController(AppDbContext context)
        {
            _context = context;
        }

        // ============================================
        // 1. ATTENDANCE SUMMARY
        // GET: api/reports/attendance-summary
        // ============================================

        [HttpGet("attendance-summary")]
        public async Task<IActionResult> GetAttendanceSummary()
        {
            var totalAttendance =
                await _context.Attendances.CountAsync();

            var present =
                await _context.Attendances
                    .CountAsync(a =>
                        a.Status != null &&
                        a.Status.Name == "Present");

            var absent =
                await _context.Attendances
                    .CountAsync(a =>
                        a.Status != null &&
                        a.Status.Name == "Absent");

            var attendancePercentage =
                totalAttendance == 0
                    ? 0
                    : Math.Round(
                        (double)present / totalAttendance * 100,
                        2);

            return Ok(new
            {
                totalRecords = totalAttendance,
                present,
                absent,
                attendancePercentage
            });
        }

        // ============================================
        // 2. WFH / WFO REPORT
        // GET: api/reports/wfh-wfo
        // ============================================

        [HttpGet("wfh-wfo")]
        public async Task<IActionResult> GetWfhWfoReport()
        {
            var office =
                await _context.Attendances
                    .CountAsync(a =>
                        a.Location != null &&
                        a.Location.Name == "Office");

            var home =
                await _context.Attendances
                    .CountAsync(a =>
                        a.Location != null &&
                        a.Location.Name == "Home");

            return Ok(new
            {
                workFromOffice = office,
                workFromHome = home,
                total = office + home
            });
        }

        // ============================================
        // 3. LEAVE SUMMARY
        // GET: api/reports/leave-summary
        // ============================================

        [HttpGet("leave-summary")]
        public async Task<IActionResult> GetLeaveSummary()
        {
            var total =
                await _context.LeaveRequests.CountAsync();

            var pending =
                await _context.LeaveRequests
                    .CountAsync(l => l.Status == "Pending");

            var approved =
                await _context.LeaveRequests
                    .CountAsync(l => l.Status == "Approved");

            var rejected =
                await _context.LeaveRequests
                    .CountAsync(l => l.Status == "Rejected");

            return Ok(new
            {
                total,
                pending,
                approved,
                rejected
            });
        }

        // ============================================
        // 4. DEPARTMENT-WISE REPORT
        // GET: api/reports/department
        // ============================================

        [HttpGet("department")]
        public async Task<IActionResult> GetDepartmentReport()
        {
            var report =
                await _context.Employees
                    .Include(e => e.Department)
                    .GroupBy(e =>
                        e.Department != null
                            ? e.Department.Name
                            : "Unknown")
                    .Select(g => new
                    {
                        department = g.Key,
                        employeeCount = g.Count()
                    })
                    .OrderByDescending(x => x.employeeCount)
                    .ToListAsync();

            return Ok(report);
        }

        // ============================================
        // 5. MONTHLY ATTENDANCE REPORT
        // GET: api/reports/monthly?year=2026&month=8
        // ============================================

        [HttpGet("monthly")]
        public async Task<IActionResult> GetMonthlyReport(
            [FromQuery] int year,
            [FromQuery] int month)
        {
            if (month < 1 || month > 12)
            {
                return BadRequest(
                    "Month must be between 1 and 12.");
            }

            var records =
                await _context.Attendances
                    .Where(a =>
                        a.Date.Year == year &&
                        a.Date.Month == month)
                    .Include(a => a.Status)
                    .Include(a => a.Location)
                    .ToListAsync();

            var total = records.Count;

            var present =
                records.Count(a =>
                    a.Status != null &&
                    a.Status.Name == "Present");

            var absent =
                records.Count(a =>
                    a.Status != null &&
                    a.Status.Name == "Absent");

            var office =
                records.Count(a =>
                    a.Location != null &&
                    a.Location.Name == "Office");

            var home =
                records.Count(a =>
                    a.Location != null &&
                    a.Location.Name == "Home");

            var attendancePercentage =
                total == 0
                    ? 0
                    : Math.Round(
                        (double)present / total * 100,
                        2);

            return Ok(new
            {
                year,
                month,
                totalRecords = total,
                present,
                absent,
                workFromOffice = office,
                workFromHome = home,
                attendancePercentage
            });
        }

        // ============================================
        // 6. TEAM PERFORMANCE METRICS
        // GET: api/reports/team/{managerId}
        // ============================================

        [HttpGet("team/{managerId}")]
        public async Task<IActionResult> GetTeamPerformance(int managerId)
        {
            var teamMembers = await _context.Employees
                .Where(e => e.ManagerId == managerId)
                .ToListAsync();

            var teamIds = teamMembers.Select(e => e.Id).ToList();

            var attendances = await _context.Attendances
                .Where(a => teamIds.Contains(a.EmployeeId))
                .Include(a => a.Status)
                .ToListAsync();

            var leaves = await _context.LeaveRequests
                .Where(l => teamIds.Contains(l.EmployeeId))
                .ToListAsync();

            var report = teamMembers.Select(e =>
            {
                var empAttendances = attendances.Where(a => a.EmployeeId == e.Id).ToList();
                var empLeaves = leaves.Where(l => l.EmployeeId == e.Id).ToList();

                var totalAtt = empAttendances.Count;
                var present = empAttendances.Count(a => a.Status?.Name == "Present");
                var attRate = totalAtt > 0 ? Math.Round((double)present / totalAtt * 100, 2) : 0;

                return new
                {
                    employeeId = e.Id,
                    name = e.FullName,
                    attendanceRate = attRate,
                    totalLeavesTaken = empLeaves.Count(l => l.Status == "Approved"),
                    pendingLeaves = empLeaves.Count(l => l.Status == "Pending")
                };
            }).ToList();

            return Ok(report);
        }

        // ============================================
        // 7. POWER BI DATASET
        // GET: api/reports/powerbi/dataset
        // ============================================

        [HttpGet("powerbi/dataset")]
        public async Task<IActionResult> GetPowerBiDataset()
        {
            // Flat, comprehensive dataset designed for easy PowerBI ingestion
            var records = await _context.Attendances
                .Include(a => a.Employee)
                    .ThenInclude(e => e.Department)
                .Include(a => a.Status)
                .Include(a => a.Location)
                .Select(a => new
                {
                    Date = a.Date.ToString("yyyy-MM-dd"),
                    EmployeeId = a.EmployeeId,
                    EmployeeName = a.Employee!.FullName,
                    Department = a.Employee.Department!.Name,
                    Status = a.Status!.Name,
                    Location = a.Location != null ? a.Location.Name : "N/A"
                })
                .ToListAsync();

            return Ok(records);
        }
    }
}
