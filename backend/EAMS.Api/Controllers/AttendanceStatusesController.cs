using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EAMS.Api.Data;
using EAMS.Api.Models;

namespace EAMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AttendanceStatusesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public AttendanceStatusesController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<AttendanceStatus>>> GetStatuses()
        {
            return await _context.AttendanceStatuses.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<AttendanceStatus>> CreateStatus(AttendanceStatus status)
        {
            _context.AttendanceStatuses.Add(status);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetStatuses), new { id = status.Id }, status);
        }
    }
}