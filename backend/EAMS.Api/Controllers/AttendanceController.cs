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
    public class AttendanceController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IAuditService _auditService;

        public AttendanceController(
            AppDbContext context,
            IAuditService auditService)
        {
            _context = context;
            _auditService = auditService;
        }

        // ============================================
        // GET: api/attendance
        // Get all attendance records
        // ============================================

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AttendanceDto>>> GetAttendance()
        {
            var records = await _context.Attendances
                .Include(a => a.Employee)
                .Include(a => a.Status)
                .Include(a => a.Location)
                .Include(a => a.Shift)
                .Select(a => new AttendanceDto
                {
                    Id = a.Id,
                    Date = a.Date,
                    Remarks = a.Remarks,

                    EmployeeId = a.EmployeeId,
                    EmployeeName = a.Employee != null
                        ? a.Employee.FullName
                        : string.Empty,

                    StatusId = a.StatusId,
                    Status = a.Status != null
                        ? a.Status.Name
                        : string.Empty,

                    LocationId = a.LocationId,
                    Location = a.Location != null
                        ? a.Location.Name
                        : null,

                    ShiftId = a.ShiftId,
                    Shift = a.Shift != null
                        ? a.Shift.Name
                        : null
                })
                .OrderByDescending(a => a.Date)
                .ToListAsync();

            return Ok(records);
        }

        // ============================================
        // GET: api/attendance/employee/5
        // Get attendance records for one employee
        // ============================================

        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<AttendanceDto>>> GetAttendanceByEmployee(
            int employeeId)
        {
            var employeeExists = await _context.Employees
                .AnyAsync(e => e.Id == employeeId);

            if (!employeeExists)
            {
                return NotFound("Employee not found.");
            }

            var records = await _context.Attendances
                .Where(a => a.EmployeeId == employeeId)
                .Include(a => a.Employee)
                .Include(a => a.Status)
                .Include(a => a.Location)
                .Include(a => a.Shift)
                .Select(a => new AttendanceDto
                {
                    Id = a.Id,
                    Date = a.Date,
                    Remarks = a.Remarks,

                    EmployeeId = a.EmployeeId,
                    EmployeeName = a.Employee != null
                        ? a.Employee.FullName
                        : string.Empty,

                    StatusId = a.StatusId,
                    Status = a.Status != null
                        ? a.Status.Name
                        : string.Empty,

                    LocationId = a.LocationId,
                    Location = a.Location != null
                        ? a.Location.Name
                        : null,

                    ShiftId = a.ShiftId,
                    Shift = a.Shift != null
                        ? a.Shift.Name
                        : null
                })
                .OrderByDescending(a => a.Date)
                .ToListAsync();

            return Ok(records);
        }

        // ============================================
        // GET: api/attendance/5
        // Get one attendance record
        // ============================================

        [HttpGet("{id}")]
        public async Task<ActionResult<AttendanceDto>> GetAttendanceRecord(int id)
        {
            var record = await _context.Attendances
                .Include(a => a.Employee)
                .Include(a => a.Status)
                .Include(a => a.Location)
                .Include(a => a.Shift)
                .Where(a => a.Id == id)
                .Select(a => new AttendanceDto
                {
                    Id = a.Id,
                    Date = a.Date,
                    Remarks = a.Remarks,

                    EmployeeId = a.EmployeeId,
                    EmployeeName = a.Employee != null
                        ? a.Employee.FullName
                        : string.Empty,

                    StatusId = a.StatusId,
                    Status = a.Status != null
                        ? a.Status.Name
                        : string.Empty,

                    LocationId = a.LocationId,
                    Location = a.Location != null
                        ? a.Location.Name
                        : null,

                    ShiftId = a.ShiftId,
                    Shift = a.Shift != null
                        ? a.Shift.Name
                        : null
                })
                .FirstOrDefaultAsync();

            if (record == null)
            {
                return NotFound("Attendance record not found.");
            }

            return Ok(record);
        }

        // ============================================
        // POST: api/attendance
        // Submit attendance
        // ============================================

        [HttpPost]
        public async Task<ActionResult<Attendance>> SubmitAttendance(
            Attendance attendance)
        {
            // ----------------------------------------
            // Check employee
            // ----------------------------------------

            var employeeExists = await _context.Employees
                .AnyAsync(e => e.Id == attendance.EmployeeId);

            if (!employeeExists)
            {
                return BadRequest("Employee does not exist.");
            }

            // ----------------------------------------
            // Check attendance status
            // ----------------------------------------

            var statusExists = await _context.AttendanceStatuses
                .AnyAsync(s => s.Id == attendance.StatusId);

            if (!statusExists)
            {
                return BadRequest("Attendance status does not exist.");
            }

            // ----------------------------------------
            // Check location if provided
            // ----------------------------------------

            if (attendance.LocationId.HasValue)
            {
                var locationExists = await _context.WorkLocations
                    .AnyAsync(l => l.Id == attendance.LocationId.Value);

                if (!locationExists)
                {
                    return BadRequest("Work location does not exist.");
                }
            }

            // ----------------------------------------
            // Check shift if provided
            // ----------------------------------------

            if (attendance.ShiftId.HasValue)
            {
                var shiftExists = await _context.Shifts
                    .AnyAsync(s => s.Id == attendance.ShiftId.Value);

                if (!shiftExists)
                {
                    return BadRequest("Shift does not exist.");
                }
            }

            // ----------------------------------------
            // Prevent duplicate attendance
            // ----------------------------------------

            var alreadyExists = await _context.Attendances
                .AnyAsync(a =>
                    a.EmployeeId == attendance.EmployeeId &&
                    a.Date == attendance.Date);

            if (alreadyExists)
            {
                return Conflict(
                    "Attendance for this employee on this date has already been submitted.");
            }

            // ----------------------------------------
            // Prevent future attendance
            // ----------------------------------------

            if (attendance.Date > DateOnly.FromDateTime(DateTime.Today))
            {
                return BadRequest(
                    "Cannot submit attendance for a future date.");
            }

            // ----------------------------------------
            // Save attendance
            // ----------------------------------------

            _context.Attendances.Add(attendance);

            await _context.SaveChangesAsync();

            // ----------------------------------------
            // AUTOMATIC AUDIT LOG
            // ----------------------------------------

            await _auditService.LogAsync(
                attendance.EmployeeId,
                "Attendance submitted");

            return CreatedAtAction(
                nameof(GetAttendanceRecord),
                new { id = attendance.Id },
                attendance);
        }

        // ============================================
        // PUT: api/attendance/5
        // Update attendance
        // ============================================

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAttendance(
            int id,
            Attendance attendance)
        {
            if (id != attendance.Id)
            {
                return BadRequest(
                    "Attendance ID does not match.");
            }

            var existingRecord = await _context.Attendances
                .AsNoTracking()
                .FirstOrDefaultAsync(a => a.Id == id);

            if (existingRecord == null)
            {
                return NotFound(
                    "Attendance record not found.");
            }

            // ----------------------------------------
            // Check employee
            // ----------------------------------------

            var employeeExists = await _context.Employees
                .AnyAsync(e => e.Id == attendance.EmployeeId);

            if (!employeeExists)
            {
                return BadRequest(
                    "Employee does not exist.");
            }

            // ----------------------------------------
            // Check status
            // ----------------------------------------

            var statusExists = await _context.AttendanceStatuses
                .AnyAsync(s => s.Id == attendance.StatusId);

            if (!statusExists)
            {
                return BadRequest(
                    "Attendance status does not exist.");
            }

            // ----------------------------------------
            // Check location
            // ----------------------------------------

            if (attendance.LocationId.HasValue)
            {
                var locationExists = await _context.WorkLocations
                    .AnyAsync(l =>
                        l.Id == attendance.LocationId.Value);

                if (!locationExists)
                {
                    return BadRequest(
                        "Work location does not exist.");
                }
            }

            // ----------------------------------------
            // Check shift
            // ----------------------------------------

            if (attendance.ShiftId.HasValue)
            {
                var shiftExists = await _context.Shifts
                    .AnyAsync(s =>
                        s.Id == attendance.ShiftId.Value);

                if (!shiftExists)
                {
                    return BadRequest(
                        "Shift does not exist.");
                }
            }

            // ----------------------------------------
            // Update attendance
            // ----------------------------------------

            _context.Entry(attendance).State =
                EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Attendances
                    .AnyAsync(a => a.Id == id))
                {
                    return NotFound(
                        "Attendance record not found.");
                }

                throw;
            }

            // ----------------------------------------
            // AUTOMATIC AUDIT LOG
            // ----------------------------------------

            await _auditService.LogAsync(
                attendance.EmployeeId,
                "Attendance updated");

            return NoContent();
        }

        // ============================================
        // DELETE: api/attendance/5
        // Delete attendance
        // ============================================

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAttendance(int id)
        {
            var record = await _context.Attendances
                .FindAsync(id);

            if (record == null)
            {
                return NotFound(
                    "Attendance record not found.");
            }

            var employeeId = record.EmployeeId;

            _context.Attendances.Remove(record);

            await _context.SaveChangesAsync();

            // ----------------------------------------
            // AUTOMATIC AUDIT LOG
            // ----------------------------------------

            await _auditService.LogAsync(
                employeeId,
                "Attendance deleted");

            return NoContent();
        }
    }
}