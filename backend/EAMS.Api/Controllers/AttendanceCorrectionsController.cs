using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EAMS.Api.Data;
using EAMS.Api.Models;
using EAMS.Api.DTOs;
using EAMS.Api.Services;

namespace EAMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceCorrectionsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAuditService _auditService;

        public AttendanceCorrectionsController(
            AppDbContext context,
            IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        // ============================================
        // GET: api/attendancecorrections
        // ============================================
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AttendanceCorrectionDto>>> GetAllCorrections()
        {
            var corrections = await _context.AttendanceCorrections
                .Include(c => c.Employee)
                    .ThenInclude(e => e!.Department)
                .Include(c => c.RequestedStatus)
                .Include(c => c.RequestedLocation)
                .Include(c => c.RequestedShift)
                .Include(c => c.ActionedByManager)
                .Select(c => new AttendanceCorrectionDto
                {
                    Id = c.Id,
                    AttendanceId = c.AttendanceId,
                    EmployeeId = c.EmployeeId,
                    EmployeeName = c.Employee != null ? c.Employee.FullName : string.Empty,
                    DepartmentName = c.Employee != null && c.Employee.Department != null ? c.Employee.Department.Name : string.Empty,
                    Date = c.Date,
                    RequestedStatusId = c.RequestedStatusId,
                    RequestedStatus = c.RequestedStatus != null ? c.RequestedStatus.Name : string.Empty,
                    RequestedLocationId = c.RequestedLocationId,
                    RequestedLocation = c.RequestedLocation != null ? c.RequestedLocation.Name : null,
                    RequestedShiftId = c.RequestedShiftId,
                    RequestedShift = c.RequestedShift != null ? c.RequestedShift.Name : null,
                    Reason = c.Reason,
                    Status = c.Status,
                    ActionedByManagerId = c.ActionedByManagerId,
                    ActionedByManagerName = c.ActionedByManager != null ? c.ActionedByManager.FullName : null,
                    CreatedAt = c.CreatedAt,
                    ActionedAt = c.ActionedAt
                })
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(corrections);
        }

        // ============================================
        // GET: api/attendancecorrections/pending
        // ============================================
        [HttpGet("pending")]
        public async Task<ActionResult<IEnumerable<AttendanceCorrectionDto>>> GetPendingCorrections()
        {
            var corrections = await _context.AttendanceCorrections
                .Where(c => c.Status == "Pending")
                .Include(c => c.Employee)
                    .ThenInclude(e => e!.Department)
                .Include(c => c.RequestedStatus)
                .Include(c => c.RequestedLocation)
                .Include(c => c.RequestedShift)
                .Include(c => c.ActionedByManager)
                .Select(c => new AttendanceCorrectionDto
                {
                    Id = c.Id,
                    AttendanceId = c.AttendanceId,
                    EmployeeId = c.EmployeeId,
                    EmployeeName = c.Employee != null ? c.Employee.FullName : string.Empty,
                    DepartmentName = c.Employee != null && c.Employee.Department != null ? c.Employee.Department.Name : string.Empty,
                    Date = c.Date,
                    RequestedStatusId = c.RequestedStatusId,
                    RequestedStatus = c.RequestedStatus != null ? c.RequestedStatus.Name : string.Empty,
                    RequestedLocationId = c.RequestedLocationId,
                    RequestedLocation = c.RequestedLocation != null ? c.RequestedLocation.Name : null,
                    RequestedShiftId = c.RequestedShiftId,
                    RequestedShift = c.RequestedShift != null ? c.RequestedShift.Name : null,
                    Reason = c.Reason,
                    Status = c.Status,
                    ActionedByManagerId = c.ActionedByManagerId,
                    ActionedByManagerName = c.ActionedByManager != null ? c.ActionedByManager.FullName : null,
                    CreatedAt = c.CreatedAt,
                    ActionedAt = c.ActionedAt
                })
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(corrections);
        }

        // ============================================
        // GET: api/attendancecorrections/employee/5
        // ============================================
        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<AttendanceCorrectionDto>>> GetEmployeeCorrections(int employeeId)
        {
            var corrections = await _context.AttendanceCorrections
                .Where(c => c.EmployeeId == employeeId)
                .Include(c => c.Employee)
                    .ThenInclude(e => e!.Department)
                .Include(c => c.RequestedStatus)
                .Include(c => c.RequestedLocation)
                .Include(c => c.RequestedShift)
                .Include(c => c.ActionedByManager)
                .Select(c => new AttendanceCorrectionDto
                {
                    Id = c.Id,
                    AttendanceId = c.AttendanceId,
                    EmployeeId = c.EmployeeId,
                    EmployeeName = c.Employee != null ? c.Employee.FullName : string.Empty,
                    DepartmentName = c.Employee != null && c.Employee.Department != null ? c.Employee.Department.Name : string.Empty,
                    Date = c.Date,
                    RequestedStatusId = c.RequestedStatusId,
                    RequestedStatus = c.RequestedStatus != null ? c.RequestedStatus.Name : string.Empty,
                    RequestedLocationId = c.RequestedLocationId,
                    RequestedLocation = c.RequestedLocation != null ? c.RequestedLocation.Name : null,
                    RequestedShiftId = c.RequestedShiftId,
                    RequestedShift = c.RequestedShift != null ? c.RequestedShift.Name : null,
                    Reason = c.Reason,
                    Status = c.Status,
                    ActionedByManagerId = c.ActionedByManagerId,
                    ActionedByManagerName = c.ActionedByManager != null ? c.ActionedByManager.FullName : null,
                    CreatedAt = c.CreatedAt,
                    ActionedAt = c.ActionedAt
                })
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(corrections);
        }

        // ============================================
        // GET: api/attendancecorrections/manager/5
        // ============================================
        [HttpGet("manager/{managerId}")]
        public async Task<ActionResult<IEnumerable<AttendanceCorrectionDto>>> GetManagerPendingCorrections(int managerId)
        {
            // Direct reports of manager
            var teamEmployeeIds = await _context.Employees
                .Where(e => e.ManagerId == managerId)
                .Select(e => e.Id)
                .ToListAsync();

            var corrections = await _context.AttendanceCorrections
                .Where(c => teamEmployeeIds.Contains(c.EmployeeId) || c.ActionedByManagerId == managerId)
                .Include(c => c.Employee)
                    .ThenInclude(e => e!.Department)
                .Include(c => c.RequestedStatus)
                .Include(c => c.RequestedLocation)
                .Include(c => c.RequestedShift)
                .Include(c => c.ActionedByManager)
                .Select(c => new AttendanceCorrectionDto
                {
                    Id = c.Id,
                    AttendanceId = c.AttendanceId,
                    EmployeeId = c.EmployeeId,
                    EmployeeName = c.Employee != null ? c.Employee.FullName : string.Empty,
                    DepartmentName = c.Employee != null && c.Employee.Department != null ? c.Employee.Department.Name : string.Empty,
                    Date = c.Date,
                    RequestedStatusId = c.RequestedStatusId,
                    RequestedStatus = c.RequestedStatus != null ? c.RequestedStatus.Name : string.Empty,
                    RequestedLocationId = c.RequestedLocationId,
                    RequestedLocation = c.RequestedLocation != null ? c.RequestedLocation.Name : null,
                    RequestedShiftId = c.RequestedShiftId,
                    RequestedShift = c.RequestedShift != null ? c.RequestedShift.Name : null,
                    Reason = c.Reason,
                    Status = c.Status,
                    ActionedByManagerId = c.ActionedByManagerId,
                    ActionedByManagerName = c.ActionedByManager != null ? c.ActionedByManager.FullName : null,
                    CreatedAt = c.CreatedAt,
                    ActionedAt = c.ActionedAt
                })
                .OrderByDescending(c => c.CreatedAt)
                .ToListAsync();

            return Ok(corrections);
        }

        // ============================================
        // POST: api/attendancecorrections
        // Submit correction request
        // ============================================
        [HttpPost]
        public async Task<ActionResult<AttendanceCorrectionDto>> SubmitCorrection(CreateAttendanceCorrectionDto dto)
        {
            var employeeExists = await _context.Employees.AnyAsync(e => e.Id == dto.EmployeeId);
            if (!employeeExists)
            {
                return BadRequest("Employee not found.");
            }

            var statusExists = await _context.AttendanceStatuses.AnyAsync(s => s.Id == dto.RequestedStatusId);
            if (!statusExists)
            {
                return BadRequest("Attendance Status not found.");
            }

            var correction = new AttendanceCorrection
            {
                AttendanceId = dto.AttendanceId,
                EmployeeId = dto.EmployeeId,
                Date = dto.Date,
                RequestedStatusId = dto.RequestedStatusId,
                RequestedLocationId = dto.RequestedLocationId,
                RequestedShiftId = dto.RequestedShiftId,
                Reason = dto.Reason ?? string.Empty,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.AttendanceCorrections.Add(correction);
            await _context.SaveChangesAsync();

            await _auditService.LogAsync(dto.EmployeeId, $"Attendance Correction Requested for {dto.Date}");

            return CreatedAtAction(nameof(GetAllCorrections), new { id = correction.Id }, correction);
        }

        // ============================================
        // POST: api/attendancecorrections/{id}/approve
        // ============================================
        [HttpPost("{id}/approve")]
        public async Task<IActionResult> ApproveCorrection(int id, [FromBody] ActionCorrectionDto dto)
        {
            var correction = await _context.AttendanceCorrections.FindAsync(id);
            if (correction == null)
            {
                return NotFound("Correction request not found.");
            }

            if (correction.Status != "Pending")
            {
                return BadRequest($"Request is already {correction.Status}.");
            }

            correction.Status = "Approved";
            correction.ActionedByManagerId = dto.ManagerId;
            correction.ActionedAt = DateTime.UtcNow;

            // Apply update or create actual attendance record
            var existingAttendance = await _context.Attendances
                .FirstOrDefaultAsync(a => a.EmployeeId == correction.EmployeeId && a.Date == correction.Date);

            if (existingAttendance != null)
            {
                existingAttendance.StatusId = correction.RequestedStatusId;
                existingAttendance.LocationId = correction.RequestedLocationId;
                existingAttendance.ShiftId = correction.RequestedShiftId;
                existingAttendance.Remarks = $"Corrected: {correction.Reason}";
            }
            else
            {
                _context.Attendances.Add(new Attendance
                {
                    EmployeeId = correction.EmployeeId,
                    Date = correction.Date,
                    StatusId = correction.RequestedStatusId,
                    LocationId = correction.RequestedLocationId,
                    ShiftId = correction.RequestedShiftId,
                    Remarks = $"Corrected: {correction.Reason}"
                });
            }

            // Create notification for employee
            _context.Notifications.Add(new Notification
            {
                EmployeeId = correction.EmployeeId,
                Message = $"Your attendance correction request for {correction.Date} was APPROVED.",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            });

            await _context.SaveChangesAsync();
            await _auditService.LogAsync(dto.ManagerId, $"Approved attendance correction #{id} for employee {correction.EmployeeId}");

            return Ok(new { message = "Correction request approved and attendance updated." });
        }

        // ============================================
        // POST: api/attendancecorrections/{id}/reject
        // ============================================
        [HttpPost("{id}/reject")]
        public async Task<IActionResult> RejectCorrection(int id, [FromBody] ActionCorrectionDto dto)
        {
            var correction = await _context.AttendanceCorrections.FindAsync(id);
            if (correction == null)
            {
                return NotFound("Correction request not found.");
            }

            if (correction.Status != "Pending")
            {
                return BadRequest($"Request is already {correction.Status}.");
            }

            correction.Status = "Rejected";
            correction.ActionedByManagerId = dto.ManagerId;
            correction.ActionedAt = DateTime.UtcNow;

            // Notification for employee
            _context.Notifications.Add(new Notification
            {
                EmployeeId = correction.EmployeeId,
                Message = $"Your attendance correction request for {correction.Date} was REJECTED.",
                CreatedAt = DateTime.UtcNow,
                IsRead = false
            });

            await _context.SaveChangesAsync();
            await _auditService.LogAsync(dto.ManagerId, $"Rejected attendance correction #{id} for employee {correction.EmployeeId}");

            return Ok(new { message = "Correction request rejected." });
        }
    }
}
