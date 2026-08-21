using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EAMS.Api.Data;
using EAMS.Api.Models;

namespace EAMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NotificationsController(AppDbContext context)
        {
            _context = context;
        }

        // ============================================
        // GET ALL NOTIFICATIONS
        // GET: api/Notifications
        // ============================================
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Notification>>> GetAllNotifications()
        {
            var notifications = await _context.Notifications
                .Include(n => n.Employee)
                .OrderByDescending(n => n.CreatedAt)
                .Take(100)
                .ToListAsync();

            return Ok(notifications);
        }

        // ============================================
        // GET ALL NOTIFICATIONS FOR AN EMPLOYEE
        // GET: api/Notifications/employee/1
        // ============================================

        [HttpGet("employee/{employeeId}")]
        public async Task<ActionResult<IEnumerable<Notification>>> GetEmployeeNotifications(
            int employeeId)
        {
            var employeeExists = await _context.Employees
                .AnyAsync(e => e.Id == employeeId);

            if (!employeeExists)
            {
                return NotFound("Employee does not exist.");
            }

            var notifications = await _context.Notifications
                .Where(n => n.EmployeeId == employeeId)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(notifications);
        }

        // ============================================
        // GET UNREAD NOTIFICATIONS
        // GET: api/Notifications/employee/1/unread
        // ============================================

        [HttpGet("employee/{employeeId}/unread")]
        public async Task<ActionResult<IEnumerable<Notification>>> GetUnreadNotifications(
            int employeeId)
        {
            var notifications = await _context.Notifications
                .Where(n =>
                    n.EmployeeId == employeeId &&
                    !n.IsRead)
                .OrderByDescending(n => n.CreatedAt)
                .ToListAsync();

            return Ok(notifications);
        }

        // ============================================
        // GET UNREAD COUNT
        // GET: api/Notifications/employee/1/unread-count
        // ============================================

        [HttpGet("employee/{employeeId}/unread-count")]
        public async Task<ActionResult<object>> GetUnreadCount(
            int employeeId)
        {
            var count = await _context.Notifications
                .CountAsync(n =>
                    n.EmployeeId == employeeId &&
                    !n.IsRead);

            return Ok(new
            {
                employeeId,
                unreadCount = count
            });
        }

        // ============================================
        // GET SINGLE NOTIFICATION
        // GET: api/Notifications/1
        // ============================================

        [HttpGet("{id}")]
        public async Task<ActionResult<Notification>> GetNotification(
            int id)
        {
            var notification = await _context.Notifications
                .Include(n => n.Employee)
                .FirstOrDefaultAsync(n => n.Id == id);

            if (notification == null)
            {
                return NotFound("Notification not found.");
            }

            return Ok(notification);
        }

        // ============================================
        // MARK ONE AS READ
        // PUT: api/Notifications/1/read
        // ============================================

        [HttpPut("{id}/read")]
        public async Task<IActionResult> MarkAsRead(int id)
        {
            var notification = await _context.Notifications
                .FindAsync(id);

            if (notification == null)
            {
                return NotFound("Notification not found.");
            }

            notification.IsRead = true;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Notification marked as read.",
                id = notification.Id
            });
        }

        // ============================================
        // MARK ALL AS READ
        // PUT: api/Notifications/employee/1/read-all
        // ============================================

        [HttpPut("employee/{employeeId}/read-all")]
        public async Task<IActionResult> MarkAllAsRead(
            int employeeId)
        {
            var notifications = await _context.Notifications
                .Where(n =>
                    n.EmployeeId == employeeId &&
                    !n.IsRead)
                .ToListAsync();

            foreach (var notification in notifications)
            {
                notification.IsRead = true;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "All notifications marked as read.",
                employeeId,
                count = notifications.Count
            });
        }

        // ============================================
        // CREATE NOTIFICATION
        // POST: api/Notifications
        // ============================================

        [HttpPost]
        public async Task<ActionResult<Notification>> CreateNotification(
            Notification notification)
        {
            var employeeExists = await _context.Employees
                .AnyAsync(e => e.Id == notification.EmployeeId);

            if (!employeeExists)
            {
                return BadRequest("Employee does not exist.");
            }

            notification.Id = 0;
            notification.IsRead = false;

            if (notification.CreatedAt == default)
            {
                notification.CreatedAt = DateTime.UtcNow;
            }

            _context.Notifications.Add(notification);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetNotification),
                new { id = notification.Id },
                notification);
        }

        // ============================================
        // DELETE NOTIFICATION
        // DELETE: api/Notifications/1
        // ============================================

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteNotification(int id)
        {
            var notification = await _context.Notifications
                .FindAsync(id);

            if (notification == null)
            {
                return NotFound("Notification not found.");
            }

            _context.Notifications.Remove(notification);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}