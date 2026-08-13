using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EAMS.Api.Data;
using EAMS.Api.Models;

namespace EAMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class HolidaysController : ControllerBase
    {
        private readonly AppDbContext _context;

        public HolidaysController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/holidays
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Holiday>>> GetHolidays()
        {
            var holidays = await _context.Holidays
                .OrderBy(h => h.Date)
                .ToListAsync();

            return Ok(holidays);
        }

        // GET: api/holidays/1
        [HttpGet("{id}")]
        public async Task<ActionResult<Holiday>> GetHoliday(int id)
        {
            var holiday = await _context.Holidays
                .FirstOrDefaultAsync(h => h.Id == id);

            if (holiday == null)
            {
                return NotFound("Holiday not found.");
            }

            return Ok(holiday);
        }

        // POST: api/holidays
        [HttpPost]
        public async Task<ActionResult<Holiday>> CreateHoliday(
            Holiday holiday)
        {
            var alreadyExists = await _context.Holidays
                .AnyAsync(h => h.Date == holiday.Date);

            if (alreadyExists)
            {
                return Conflict(
                    "A holiday already exists for this date.");
            }

            _context.Holidays.Add(holiday);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetHoliday),
                new { id = holiday.Id },
                holiday);
        }

        // PUT: api/holidays/1
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateHoliday(
            int id,
            Holiday holiday)
        {
            if (id != holiday.Id)
            {
                return BadRequest(
                    "Holiday ID does not match.");
            }

            var existing = await _context.Holidays
                .FindAsync(id);

            if (existing == null)
            {
                return NotFound("Holiday not found.");
            }

            existing.Date = holiday.Date;
            existing.Name = holiday.Name;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/holidays/1
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteHoliday(int id)
        {
            var holiday = await _context.Holidays
                .FindAsync(id);

            if (holiday == null)
            {
                return NotFound("Holiday not found.");
            }

            _context.Holidays.Remove(holiday);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}