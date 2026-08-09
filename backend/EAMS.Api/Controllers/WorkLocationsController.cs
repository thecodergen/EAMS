using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EAMS.Api.Data;
using EAMS.Api.Models;

namespace EAMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WorkLocationsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WorkLocationsController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<WorkLocation>>> GetWorkLocations()
        {
            return await _context.WorkLocations.ToListAsync();
        }

        [HttpPost]
        public async Task<ActionResult<WorkLocation>> CreateWorkLocation(WorkLocation location)
        {
            _context.WorkLocations.Add(location);
            await _context.SaveChangesAsync();
            return CreatedAtAction(nameof(GetWorkLocations), new { id = location.Id }, location);
        }
    }
}