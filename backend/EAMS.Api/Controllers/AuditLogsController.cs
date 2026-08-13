using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EAMS.Api.Data;
using EAMS.Api.Models;

namespace EAMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuditLogsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AuditLogsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/auditlogs
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetAuditLogs()
        {
            var logs = await _context.AuditLogs
                .OrderByDescending(a => a.Timestamp)
                .ToListAsync();

            return Ok(logs);
        }

        // GET: api/auditlogs/1
        [HttpGet("{id}")]
        public async Task<ActionResult<AuditLog>> GetAuditLog(int id)
        {
            var log = await _context.AuditLogs
                .FirstOrDefaultAsync(a => a.Id == id);

            if (log == null)
            {
                return NotFound("Audit log not found.");
            }

            return Ok(log);
        }

        // GET: api/auditlogs/employee/1
        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<AuditLog>>> GetEmployeeAuditLogs(
            int employeeId)
        {
            var employeeExists = await _context.Employees
                .AnyAsync(e => e.Id == employeeId);

            if (!employeeExists)
            {
                return NotFound("Employee not found.");
            }

            var logs = await _context.AuditLogs
                .Where(a => a.EmployeeId == employeeId)
                .OrderByDescending(a => a.Timestamp)
                .ToListAsync();

            return Ok(logs);
        }

        // POST: api/auditlogs
        [HttpPost]
        public async Task<ActionResult<AuditLog>> CreateAuditLog(
            AuditLog auditLog)
        {
            var employeeExists = await _context.Employees
                .AnyAsync(e => e.Id == auditLog.EmployeeId);

            if (!employeeExists)
            {
                return BadRequest("Employee does not exist.");
            }

            auditLog.Timestamp = DateTime.UtcNow;

            _context.AuditLogs.Add(auditLog);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetAuditLog),
                new { id = auditLog.Id },
                auditLog);
        }

        // DELETE: api/auditlogs/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAuditLog(int id)
        {
            var log = await _context.AuditLogs
                .FindAsync(id);

            if (log == null)
            {
                return NotFound("Audit log not found.");
            }

            _context.AuditLogs.Remove(log);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}