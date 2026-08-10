using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EAMS.Api.Data;
using EAMS.Api.Models;

namespace EAMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LeaveRequestsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LeaveRequestsController(AppDbContext context)
        {
            _context = context;
        }

        // ============================================
        // GET: api/LeaveRequests
        // ============================================

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LeaveRequest>>> GetLeaveRequests()
        {
            return await _context.LeaveRequests
                .Include(l => l.Employee)
                .OrderByDescending(l => l.StartDate)
                .ToListAsync();
        }

        // ============================================
        // GET: api/LeaveRequests/employee/1
        // ============================================

        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<LeaveRequest>>> GetEmployeeLeaveRequests(
            int employeeId)
        {
            return await _context.LeaveRequests
                .Include(l => l.Employee)
                .Where(l => l.EmployeeId == employeeId)
                .OrderByDescending(l => l.StartDate)
                .ToListAsync();
        }

        // ============================================
        // GET: api/LeaveRequests/1
        // ============================================

        [HttpGet("{id}")]
        public async Task<ActionResult<LeaveRequest>> GetLeaveRequest(int id)
        {
            var request = await _context.LeaveRequests
                .Include(l => l.Employee)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (request == null)
            {
                return NotFound();
            }

            return request;
        }

        // ============================================
        // POST: api/LeaveRequests
        // ============================================

        [HttpPost]
        public async Task<ActionResult<LeaveRequest>> CreateLeaveRequest(
            LeaveRequest request)
        {
            if (request.StartDate > request.EndDate)
            {
                return BadRequest(
                    "Start date cannot be after end date.");
            }

            if (request.StartDate < DateOnly.FromDateTime(DateTime.Today))
            {
                return BadRequest(
                    "Leave cannot be requested for a past date.");
            }

            var employeeExists = await _context.Employees
                .AnyAsync(e => e.Id == request.EmployeeId);

            if (!employeeExists)
            {
                return BadRequest(
                    "Employee does not exist.");
            }

            request.Status = "Pending";

            _context.LeaveRequests.Add(request);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetLeaveRequest),
                new { id = request.Id },
                request);
        }

        // ============================================
        // PUT: api/LeaveRequests/1
        // ============================================

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLeaveRequest(
            int id,
            LeaveRequest request)
        {
            if (id != request.Id)
            {
                return BadRequest();
            }

            var existing = await _context.LeaveRequests
                .FindAsync(id);

            if (existing == null)
            {
                return NotFound();
            }

            // Do not allow editing an already
            // approved or rejected request.
            if (existing.Status != "Pending")
            {
                return BadRequest(
                    "Only pending leave requests can be edited.");
            }

            if (request.StartDate > request.EndDate)
            {
                return BadRequest(
                    "Start date cannot be after end date.");
            }

            existing.LeaveType = request.LeaveType;
            existing.StartDate = request.StartDate;
            existing.EndDate = request.EndDate;
            existing.Reason = request.Reason;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // ============================================
        // APPROVE LEAVE REQUEST
        // PUT: api/LeaveRequests/1/approve
        // ============================================

        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveLeaveRequest(int id)
        {
            var request = await _context.LeaveRequests
                .FirstOrDefaultAsync(l => l.Id == id);

            if (request == null)
            {
                return NotFound(
                    "Leave request not found.");
            }

            if (request.Status != "Pending")
            {
                return BadRequest(
                    $"Leave request is already {request.Status}.");
            }

            request.Status = "Approved";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Leave request approved successfully.",
                id = request.Id,
                status = request.Status
            });
        }

        // ============================================
        // REJECT LEAVE REQUEST
        // PUT: api/LeaveRequests/1/reject
        // ============================================

        [HttpPut("{id}/reject")]
        public async Task<IActionResult> RejectLeaveRequest(int id)
        {
            var request = await _context.LeaveRequests
                .FirstOrDefaultAsync(l => l.Id == id);

            if (request == null)
            {
                return NotFound(
                    "Leave request not found.");
            }

            if (request.Status != "Pending")
            {
                return BadRequest(
                    $"Leave request is already {request.Status}.");
            }

            request.Status = "Rejected";

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Leave request rejected successfully.",
                id = request.Id,
                status = request.Status
            });
        }

        // ============================================
        // DELETE: api/LeaveRequests/1
        // ============================================

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLeaveRequest(int id)
        {
            var request = await _context.LeaveRequests
                .FindAsync(id);

            if (request == null)
            {
                return NotFound();
            }

            _context.LeaveRequests.Remove(request);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}