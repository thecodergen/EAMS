using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EAMS.Api.Data;
using EAMS.Api.Models;
using EAMS.Api.DTOs;

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

        // GET: api/LeaveRequests
        // Get all leave requests
        [HttpGet]
        public async Task<ActionResult<IEnumerable<LeaveRequestDto>>> GetLeaveRequests()
        {
            var requests = await _context.LeaveRequests
                .Include(l => l.Employee)
                .Select(l => new LeaveRequestDto
                {
                    Id = l.Id,

                    EmployeeId = l.EmployeeId,
                    EmployeeName = l.Employee != null
                        ? l.Employee.FullName
                        : string.Empty,

                    LeaveType = l.LeaveType,
                    StartDate = l.StartDate,
                    EndDate = l.EndDate,
                    Reason = l.Reason,
                    Status = l.Status
                })
                .OrderByDescending(l => l.StartDate)
                .ToListAsync();

            return Ok(requests);
        }

        // GET: api/LeaveRequests/employee/1
        // Get leave requests for one employee
        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<LeaveRequestDto>>> GetEmployeeLeaveRequests(
            int employeeId)
        {
            var employeeExists = await _context.Employees
                .AnyAsync(e => e.Id == employeeId);

            if (!employeeExists)
            {
                return NotFound("Employee not found.");
            }

            var requests = await _context.LeaveRequests
                .Where(l => l.EmployeeId == employeeId)
                .Include(l => l.Employee)
                .Select(l => new LeaveRequestDto
                {
                    Id = l.Id,

                    EmployeeId = l.EmployeeId,
                    EmployeeName = l.Employee != null
                        ? l.Employee.FullName
                        : string.Empty,

                    LeaveType = l.LeaveType,
                    StartDate = l.StartDate,
                    EndDate = l.EndDate,
                    Reason = l.Reason,
                    Status = l.Status
                })
                .OrderByDescending(l => l.StartDate)
                .ToListAsync();

            return Ok(requests);
        }

        // GET: api/LeaveRequests/1
        // Get one leave request
        [HttpGet("{id}")]
        public async Task<ActionResult<LeaveRequestDto>> GetLeaveRequest(int id)
        {
            var request = await _context.LeaveRequests
                .Include(l => l.Employee)
                .Where(l => l.Id == id)
                .Select(l => new LeaveRequestDto
                {
                    Id = l.Id,

                    EmployeeId = l.EmployeeId,
                    EmployeeName = l.Employee != null
                        ? l.Employee.FullName
                        : string.Empty,

                    LeaveType = l.LeaveType,
                    StartDate = l.StartDate,
                    EndDate = l.EndDate,
                    Reason = l.Reason,
                    Status = l.Status
                })
                .FirstOrDefaultAsync();

            if (request == null)
            {
                return NotFound("Leave request not found.");
            }

            return Ok(request);
        }

        // POST: api/LeaveRequests
        // Create leave request
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

        // PUT: api/LeaveRequests/1
        // Update leave request
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLeaveRequest(
            int id,
            LeaveRequest request)
        {
            if (id != request.Id)
            {
                return BadRequest(
                    "Leave request ID does not match.");
            }

            var existing = await _context.LeaveRequests
                .FindAsync(id);

            if (existing == null)
            {
                return NotFound(
                    "Leave request not found.");
            }

            // Only pending requests can be edited
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

        // PUT: api/LeaveRequests/1/approve
        // Approve leave request
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

        // PUT: api/LeaveRequests/1/reject
        // Reject leave request
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

        // DELETE: api/LeaveRequests/1
        // Delete leave request
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLeaveRequest(int id)
        {
            var request = await _context.LeaveRequests
                .FindAsync(id);

            if (request == null)
            {
                return NotFound(
                    "Leave request not found.");
            }

            _context.LeaveRequests.Remove(request);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}