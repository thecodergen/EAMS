using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EAMS.Api.Data;
using EAMS.Api.Models;
using EAMS.Api.DTOs;

namespace EAMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class EmployeesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public EmployeesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/employees
        // Get all employees
        [HttpGet]
        public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetEmployees()
        {
            var employees = await _context.Employees
                .Include(e => e.Department)
                .Include(e => e.Role)
                .Include(e => e.Manager)
                .Select(e => new EmployeeDto
                {
                    Id = e.Id,
                    FullName = e.FullName,
                    Email = e.Email,

                    DepartmentId = e.DepartmentId,
                    Department = e.Department != null
                        ? e.Department.Name
                        : string.Empty,

                    RoleId = e.RoleId,
                    Role = e.Role != null
                        ? e.Role.Name
                        : string.Empty,

                    ManagerId = e.ManagerId,
                    Manager = e.Manager != null
                        ? e.Manager.FullName
                        : null
                })
                .ToListAsync();

            return Ok(employees);
        }

        // GET: api/employees/5
        // Get one employee
        [HttpGet("{id}")]
        public async Task<ActionResult<EmployeeDto>> GetEmployee(int id)
        {
            var employee = await _context.Employees
                .Include(e => e.Department)
                .Include(e => e.Role)
                .Include(e => e.Manager)
                .Where(e => e.Id == id)
                .Select(e => new EmployeeDto
                {
                    Id = e.Id,
                    FullName = e.FullName,
                    Email = e.Email,

                    DepartmentId = e.DepartmentId,
                    Department = e.Department != null
                        ? e.Department.Name
                        : string.Empty,

                    RoleId = e.RoleId,
                    Role = e.Role != null
                        ? e.Role.Name
                        : string.Empty,

                    ManagerId = e.ManagerId,
                    Manager = e.Manager != null
                        ? e.Manager.FullName
                        : null
                })
                .FirstOrDefaultAsync();

            if (employee == null)
            {
                return NotFound("Employee not found.");
            }

            return Ok(employee);
        }

        // GET: api/employees/manager/1/team
        // Get all employees working under a manager
        [HttpGet("manager/{managerId}/team")]
        public async Task<ActionResult<IEnumerable<EmployeeDto>>> GetManagerTeam(int managerId)
        {
            var managerExists = await _context.Employees
                .AnyAsync(e => e.Id == managerId);

            if (!managerExists)
            {
                return NotFound("Manager not found.");
            }

            var team = await _context.Employees
                .Where(e => e.ManagerId == managerId)
                .Include(e => e.Department)
                .Include(e => e.Role)
                .Include(e => e.Manager)
                .Select(e => new EmployeeDto
                {
                    Id = e.Id,
                    FullName = e.FullName,
                    Email = e.Email,

                    DepartmentId = e.DepartmentId,
                    Department = e.Department != null
                        ? e.Department.Name
                        : string.Empty,

                    RoleId = e.RoleId,
                    Role = e.Role != null
                        ? e.Role.Name
                        : string.Empty,

                    ManagerId = e.ManagerId,
                    Manager = e.Manager != null
                        ? e.Manager.FullName
                        : null
                })
                .ToListAsync();

            return Ok(team);
        }

        // GET: api/employees/manager/1
        // Get manager information with team
        [HttpGet("manager/{managerId}")]
        public async Task<ActionResult<object>> GetManagerWithTeam(int managerId)
        {
            var manager = await _context.Employees
                .Include(e => e.Department)
                .Include(e => e.Role)
                .Where(e => e.Id == managerId)
                .Select(e => new EmployeeDto
                {
                    Id = e.Id,
                    FullName = e.FullName,
                    Email = e.Email,

                    DepartmentId = e.DepartmentId,
                    Department = e.Department != null
                        ? e.Department.Name
                        : string.Empty,

                    RoleId = e.RoleId,
                    Role = e.Role != null
                        ? e.Role.Name
                        : string.Empty,

                    ManagerId = e.ManagerId,
                    Manager = e.Manager != null
                        ? e.Manager.FullName
                        : null
                })
                .FirstOrDefaultAsync();

            if (manager == null)
            {
                return NotFound("Manager not found.");
            }

            var team = await _context.Employees
                .Where(e => e.ManagerId == managerId)
                .Include(e => e.Department)
                .Include(e => e.Role)
                .Select(e => new EmployeeDto
                {
                    Id = e.Id,
                    FullName = e.FullName,
                    Email = e.Email,

                    DepartmentId = e.DepartmentId,
                    Department = e.Department != null
                        ? e.Department.Name
                        : string.Empty,

                    RoleId = e.RoleId,
                    Role = e.Role != null
                        ? e.Role.Name
                        : string.Empty,

                    ManagerId = e.ManagerId,
                    Manager = e.Manager != null
                        ? e.Manager.FullName
                        : null
                })
                .ToListAsync();

            return Ok(new
            {
                manager = manager,
                team = team,
                teamCount = team.Count
            });
        }

        // POST: api/employees
        // Create employee
        [HttpPost]
        public async Task<ActionResult<Employee>> CreateEmployee(Employee employee)
        {
            // Check department
            var departmentExists = await _context.Departments
                .AnyAsync(d => d.Id == employee.DepartmentId);

            if (!departmentExists)
            {
                return BadRequest("Department does not exist.");
            }

            // Check role
            var roleExists = await _context.Roles
                .AnyAsync(r => r.Id == employee.RoleId);

            if (!roleExists)
            {
                return BadRequest("Role does not exist.");
            }

            // Check manager if provided
            if (employee.ManagerId.HasValue)
            {
                var managerExists = await _context.Employees
                    .AnyAsync(e => e.Id == employee.ManagerId.Value);

                if (!managerExists)
                {
                    return BadRequest("Manager does not exist.");
                }

                // Prevent employee from being their own manager
                if (employee.ManagerId.Value == employee.Id)
                {
                    return BadRequest(
                        "An employee cannot be their own manager.");
                }
            }

            _context.Employees.Add(employee);

            await _context.SaveChangesAsync();

            return CreatedAtAction(
                nameof(GetEmployee),
                new { id = employee.Id },
                employee
            );
        }

        // PUT: api/employees/5
        // Update employee
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateEmployee(
            int id,
            Employee employee)
        {
            if (id != employee.Id)
            {
                return BadRequest("Employee ID does not match.");
            }

            // Check employee exists
            var existingEmployee = await _context.Employees
                .AsNoTracking()
                .FirstOrDefaultAsync(e => e.Id == id);

            if (existingEmployee == null)
            {
                return NotFound("Employee not found.");
            }

            // Check department
            var departmentExists = await _context.Departments
                .AnyAsync(d => d.Id == employee.DepartmentId);

            if (!departmentExists)
            {
                return BadRequest("Department does not exist.");
            }

            // Check role
            var roleExists = await _context.Roles
                .AnyAsync(r => r.Id == employee.RoleId);

            if (!roleExists)
            {
                return BadRequest("Role does not exist.");
            }

            // Check manager
            if (employee.ManagerId.HasValue)
            {
                // Employee cannot be their own manager
                if (employee.ManagerId.Value == employee.Id)
                {
                    return BadRequest(
                        "An employee cannot be their own manager.");
                }

                var managerExists = await _context.Employees
                    .AnyAsync(e => e.Id == employee.ManagerId.Value);

                if (!managerExists)
                {
                    return BadRequest("Manager does not exist.");
                }
            }

            _context.Entry(employee).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!await _context.Employees.AnyAsync(e => e.Id == id))
                {
                    return NotFound("Employee not found.");
                }

                throw;
            }

            return NoContent();
        }

        // PUT: api/employees/5/manager/2
        // Assign manager to employee
        [HttpPut("{employeeId}/manager/{managerId}")]
        public async Task<IActionResult> AssignManager(
            int employeeId,
            int managerId)
        {
            if (employeeId == managerId)
            {
                return BadRequest(
                    "An employee cannot be their own manager.");
            }

            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.Id == employeeId);

            if (employee == null)
            {
                return NotFound("Employee not found.");
            }

            var manager = await _context.Employees
                .FirstOrDefaultAsync(e => e.Id == managerId);

            if (manager == null)
            {
                return NotFound("Manager not found.");
            }

            employee.ManagerId = managerId;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Manager assigned successfully.",
                employeeId = employeeId,
                managerId = managerId
            });
        }

        // DELETE: api/employees/5/manager
        // Remove manager from employee
        [HttpDelete("{employeeId}/manager")]
        public async Task<IActionResult> RemoveManager(int employeeId)
        {
            var employee = await _context.Employees
                .FirstOrDefaultAsync(e => e.Id == employeeId);

            if (employee == null)
            {
                return NotFound("Employee not found.");
            }

            employee.ManagerId = null;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Manager removed successfully.",
                employeeId = employeeId
            });
        }

        // DELETE: api/employees/5
        // Delete employee
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            var employee = await _context.Employees
                .FindAsync(id);

            if (employee == null)
            {
                return NotFound("Employee not found.");
            }

            _context.Employees.Remove(employee);

            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}