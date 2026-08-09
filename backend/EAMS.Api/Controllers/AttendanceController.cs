using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EAMS.Api.Data;
using EAMS.Api.Models;

namespace EAMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AttendanceController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/attendance
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Attendance>>> GetAttendance()
        {
            return await _context.Attendances
                .Include(a => a.Employee)
                .Include(a => a.Status)
                .Include(a => a.Location)
                .Include(a => a.Shift)
                .ToListAsync();
        }

        // GET: api/attendance/employee/5
        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<Attendance>>> GetAttendanceByEmployee(int employeeId)
        {
            var records = await _context.Attendances
                .Where(a => a.EmployeeId == employeeId)
                .Include(a => a.Status)
                .Include(a => a.Location)
                .Include(a => a.Shift)
                .OrderByDescending(a => a.Date)
                .ToListAsync();

            return records;
        }

        // GET: api/attendance/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Attendance>> GetAttendanceRecord(int id)
        {
            var record = await _context.Attendances
                .Include(a => a.Employee)
                .Include(a => a.Status)
                .Include(a => a.Location)
                .Include(a => a.Shift)
                .FirstOrDefaultAsync(a => a.Id == id);

            if (record == null)
            {
                return NotFound();
            }

            return record;
        }

        // POST: api/attendance  — this is the "Submit Attendance" endpoint from your diagram
        [HttpPost]
        public async Task<ActionResult<Attendance>> SubmitAttendance(Attendance attendance)
        {
            // Prevent duplicate attendance for the same employee on the same date
            bool alreadyExists = await _context.Attendances
                .AnyAsync(a => a.EmployeeId == attendance.EmployeeId && a.Date == attendance.Date);

            if (alreadyExists)
            {
                return Conflict("Attendance for this employee on this date has already been submitted.");
            }

            // Prevent future-dated attendance (failure handling from your diagram)
            if (attendance.Date > DateOnly.FromDateTime(DateTime.Today))
            {
                return BadRequest("Cannot submit attendance for a future date.");
            }

            _context.Attendances.Add(attendance);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAttendanceRecord), new { id = attendance.Id }, attendance);
        }

        // PUT: api/attendance/5
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateAttendance(int id, Attendance attendance)
        {
            if (id != attendance.Id)
            {
                return BadRequest();
            }

            _context.Entry(attendance).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Attendances.Any(a => a.Id == id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/attendance/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAttendance(int id)
        {
            var record = await _context.Attendances.FindAsync(id);
            if (record == null)
            {
                return NotFound();
            }

            _context.Attendances.Remove(record);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}