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

        // ============================================================
        // GET ALL LEAVE REQUESTS
        // GET: api/LeaveRequests
        // ============================================================

        [HttpGet]
        public async Task<ActionResult<IEnumerable<LeaveRequest>>> GetLeaveRequests()
        {
            return await _context.LeaveRequests
                .Include(l => l.Employee)
                .OrderByDescending(l => l.StartDate)
                .ToListAsync();
        }

        // ============================================================
        // GET MANAGER'S TEAM PENDING LEAVE REQUESTS
        // GET: api/LeaveRequests/manager/1/pending
        // ============================================================

        [HttpGet("manager/{managerId}/pending")]
        public async Task<ActionResult<IEnumerable<LeaveRequest>>> GetManagerPendingLeaveRequests(
            int managerId)
        {
            var teamLeaveRequests = await _context.LeaveRequests
                .Include(l => l.Employee)
                .Where(l => l.Employee.ManagerId == managerId && l.Status == "Pending")
                .OrderByDescending(l => l.StartDate)
                .ToListAsync();

            return Ok(teamLeaveRequests);
        }

        // ============================================================
        // GET EMPLOYEE LEAVE REQUESTS
        // GET: api/LeaveRequests/employee/1
        // ============================================================

        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<LeaveRequest>>> GetEmployeeLeaveRequests(
            int employeeId)
        {
            var requests = await _context.LeaveRequests
                .Where(l => l.EmployeeId == employeeId)
                .OrderByDescending(l => l.StartDate)
                .ToListAsync();

            return Ok(requests);
        }

        // ============================================================
        // GET SINGLE LEAVE REQUEST
        // GET: api/LeaveRequests/1
        // ============================================================

        [HttpGet("{id}")]
        public async Task<ActionResult<LeaveRequest>> GetLeaveRequest(int id)
        {
            var request = await _context.LeaveRequests
                .Include(l => l.Employee)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (request == null)
            {
                return NotFound("Leave request not found.");
            }

            return Ok(request);
        }

        // ============================================================
        // CREATE LEAVE REQUEST
        // POST: api/LeaveRequests
        // ============================================================

        [HttpPost]
        public async Task<ActionResult<LeaveRequest>> CreateLeaveRequest(
            LeaveRequest request)
        {
            // Validate dates
            if (request.StartDate > request.EndDate)
            {
                return BadRequest(
                    "Start date cannot be after end date.");
            }

            // Do not allow past leave
            if (request.StartDate < DateOnly.FromDateTime(DateTime.Today))
            {
                return BadRequest(
                    "Leave cannot be requested for a past date.");
            }

            // Find employee and manager
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.Id == request.EmployeeId);

            if (employee == null)
            {
                return BadRequest("Employee does not exist.");
            }

            // New request is always Pending
            request.Status = "Pending";

            _context.LeaveRequests.Add(request);

            await _context.SaveChangesAsync();

            // ========================================================
            // NOTIFY MANAGER
            // ========================================================

            if (employee.ManagerId.HasValue)
            {
                var notification = new Notification
                {
                    EmployeeId = employee.ManagerId.Value,

                    Title = "New Leave Request",

                    Message =
                        $"{employee.FullName} has submitted a new " +
                        $"{request.LeaveType} request from " +
                        $"{request.StartDate:dd MMM yyyy} to " +
                        $"{request.EndDate:dd MMM yyyy}.",

                    IsRead = false,

                    CreatedAt = DateTime.UtcNow
                };

                _context.Notifications.Add(notification);

                await _context.SaveChangesAsync();
            }

            return CreatedAtAction(
                nameof(GetLeaveRequest),
                new { id = request.Id },
                request);
        }

        // ============================================================
        // UPDATE LEAVE REQUEST
        // PUT: api/LeaveRequests/1
        // ============================================================

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateLeaveRequest(
            int id,
            LeaveRequest request)
        {
            if (id != request.Id)
            {
                return BadRequest("ID mismatch.");
            }

            var existing = await _context.LeaveRequests
                .FindAsync(id);

            if (existing == null)
            {
                return NotFound("Leave request not found.");
            }

            // Do not allow editing approved/rejected requests
            if (existing.Status != "Pending")
            {
                return BadRequest(
                    "Only pending leave requests can be updated.");
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

        // ============================================================
        // APPROVE LEAVE REQUEST
        // PUT: api/LeaveRequests/1/approve
        // ============================================================

        [HttpPut("{id}/approve")]
        public async Task<IActionResult> ApproveLeaveRequest(int id)
        {
            var request = await _context.LeaveRequests
                .Include(l => l.Employee)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (request == null)
            {
                return NotFound("Leave request not found.");
            }

            if (request.Status != "Pending")
            {
                return BadRequest(
                    "Only pending leave requests can be approved.");
            }

            // Change status
            request.Status = "Approved";

            // ========================================================
            // NOTIFY EMPLOYEE
            // ========================================================

            var notification = new Notification
            {
                EmployeeId = request.EmployeeId,

                Title = "Leave Approved",

                Message =
                    $"Your {request.LeaveType} request from " +
                    $"{request.StartDate:dd MMM yyyy} to " +
                    $"{request.EndDate:dd MMM yyyy} has been approved.",

                IsRead = false,

                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Leave request approved successfully.",
                id = request.Id,
                status = request.Status
            });
        }

        // ============================================================
        // REJECT LEAVE REQUEST
        // PUT: api/LeaveRequests/1/reject
        // ============================================================

        [HttpPut("{id}/reject")]
        public async Task<IActionResult> RejectLeaveRequest(int id)
        {
            var request = await _context.LeaveRequests
                .Include(l => l.Employee)
                .FirstOrDefaultAsync(l => l.Id == id);

            if (request == null)
            {
                return NotFound("Leave request not found.");
            }

            if (request.Status != "Pending")
            {
                return BadRequest(
                    "Only pending leave requests can be rejected.");
            }

            // Change status
            request.Status = "Rejected";

            // ========================================================
            // NOTIFY EMPLOYEE
            // ========================================================

            var notification = new Notification
            {
                EmployeeId = request.EmployeeId,

                Title = "Leave Rejected",

                Message =
                    $"Your {request.LeaveType} request from " +
                    $"{request.StartDate:dd MMM yyyy} to " +
                    $"{request.EndDate:dd MMM yyyy} has been rejected.",

                IsRead = false,

                CreatedAt = DateTime.UtcNow
            };

            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Leave request rejected successfully.",
                id = request.Id,
                status = request.Status
            });
        }

        // ============================================================
        // DELETE LEAVE REQUEST
        // DELETE: api/LeaveRequests/1
        // ============================================================

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLeaveRequest(int id)
        {
            var request = await _context.LeaveRequests
                .FindAsync(id);

            if (request == null)
            {
                return NotFound("Leave request not found.");
            }

            if (request.Status != "Pending")
            {
                return BadRequest(
                    "Only pending leave requests can be deleted.");
            }

            _context.LeaveRequests.Remove(request);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}