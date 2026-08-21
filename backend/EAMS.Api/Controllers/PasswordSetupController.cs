using EAMS.Api.Data;
using EAMS.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EAMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PasswordSetupController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly PasswordHasher<Employee> _passwordHasher;

        public PasswordSetupController(AppDbContext context)
        {
            _context = context;
            _passwordHasher = new PasswordHasher<Employee>();
        }

        [HttpPut("{employeeId}")]
        public async Task<IActionResult> SetPassword(
            int employeeId,
            [FromBody] SetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    message = "Password is required."
                });
            }

            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.Id == employeeId);

            if (employee == null)
            {
                return NotFound(new
                {
                    message = "Employee not found."
                });
            }

            employee.PasswordHash =
                _passwordHasher.HashPassword(
                    employee,
                    request.Password);

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Password configured successfully.",
                employeeId = employee.Id,
                email = employee.Email
            });
        }
    }

    public class SetPasswordRequest
    {
        public string Password { get; set; } = string.Empty;
    }
}