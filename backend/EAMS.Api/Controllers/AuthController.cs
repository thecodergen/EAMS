using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

using EAMS.Api.Data;
using EAMS.Api.DTOs;
using EAMS.Api.Models;
using EAMS.Api.Services;

using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace EAMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly IOtpService _otpService;
        private readonly IEmailService _emailService;
        private readonly PasswordHasher<Employee> _passwordHasher;

        public AuthController(
            AppDbContext context,
            IConfiguration configuration,
            IOtpService otpService,
            IEmailService emailService)
        {
            _context = context;
            _configuration = configuration;
            _otpService = otpService;
            _emailService = emailService;
            _passwordHasher = new PasswordHasher<Employee>();
        }

        // ============================================================
        // SEND OTP (For Login OR Registration)
        // POST: api/Auth/send-otp
        // ============================================================
        [HttpPost("send-otp")]
        public async Task<IActionResult> SendOtp([FromBody] SendOtpRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Identifier))
            {
                return BadRequest(new { message = "Email or Phone Number is required." });
            }

            var identifier = request.Identifier.Trim();
            var purpose = string.IsNullOrWhiteSpace(request.Purpose) ? "login" : request.Purpose.ToLower();
            string? destinationEmail = null;

            if (purpose == "login")
            {
                // Check that the user actually exists in the database
                var employee = await _context.Employees.FirstOrDefaultAsync(e =>
                    e.Email.ToLower() == identifier.ToLower() ||
                    e.MobileNumber == identifier ||
                    e.Username.ToLower() == identifier.ToLower());

                if (employee == null)
                {
                    return NotFound(new { message = "No registered account found with this Email or Phone Number." });
                }

                destinationEmail = employee.Email;
            }
            else if (purpose == "register")
            {
                // Verify identifier is not already registered
                var emailTaken = await _context.Employees.AnyAsync(e => e.Email.ToLower() == identifier.ToLower());
                var phoneTaken = await _context.Employees.AnyAsync(e => e.MobileNumber == identifier && !string.IsNullOrEmpty(e.MobileNumber));

                if (emailTaken || phoneTaken)
                {
                    return Conflict(new { message = "An account with this Email or Phone Number already exists." });
                }

                if (identifier.Contains("@"))
                {
                    destinationEmail = identifier;
                }
            }

            var otp = _otpService.GenerateOtp(identifier, purpose);

            // Send actual email if email destination is available
            var emailDispatched = false;
            if (!string.IsNullOrWhiteSpace(destinationEmail))
            {
                emailDispatched = await _emailService.SendOtpEmailAsync(destinationEmail, otp, purpose);
            }

            return Ok(new
            {
                message = emailDispatched 
                    ? $"Verification code has been sent directly to {destinationEmail}." 
                    : $"OTP generated for {identifier}. Valid for 5 minutes.",
                identifier,
                purpose,
                emailDispatched,
                otp // Returned for easy testing and instant fallback
            });
        }

        // ============================================================
        // LOGIN VIA OTP
        // POST: api/Auth/login-otp
        // ============================================================
        [HttpPost("login-otp")]
        public async Task<IActionResult> LoginWithOtp([FromBody] OtpLoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Identifier) || string.IsNullOrWhiteSpace(request.Otp))
            {
                return BadRequest(new { message = "Email/Phone Number and 6-digit OTP are required." });
            }

            var identifier = request.Identifier.Trim();
            var isValid = _otpService.ValidateOtp(identifier, "login", request.Otp);

            if (!isValid)
            {
                return Unauthorized(new { message = "Invalid or expired OTP. Please try again." });
            }

            // Find employee by Email, MobileNumber, or Username
            var employee = await _context.Employees
                .Include(e => e.Role)
                .Include(e => e.Department)
                .FirstOrDefaultAsync(e =>
                    e.Email.ToLower() == identifier.ToLower() ||
                    e.MobileNumber == identifier ||
                    e.Username.ToLower() == identifier.ToLower());

            if (employee == null)
            {
                return NotFound(new { message = "Account not found." });
            }

            if (!employee.IsActive)
            {
                return Unauthorized(new { message = "Your account is inactive. Please contact administrator." });
            }

            var roleName = employee.Role?.Name ?? "Employee";
            var token = GenerateToken(employee.Id, employee.FullName, employee.Email, roleName);

            employee.LastLoginDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "OTP login successful.",
                token,
                employee = new
                {
                    id = employee.Id,
                    username = employee.Username,
                    fullName = employee.FullName,
                    email = employee.Email,
                    mobileNumber = employee.MobileNumber,
                    role = roleName,
                    department = employee.Department?.Name
                }
            });
        }

        // ============================================================
        // REGISTER WITH OTP VERIFICATION
        // POST: api/Auth/register-with-otp
        // ============================================================
        [HttpPost("register-with-otp")]
        public async Task<IActionResult> RegisterWithOtp([FromBody] RegisterWithOtpRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.FullName) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password) ||
                string.IsNullOrWhiteSpace(request.Otp))
            {
                return BadRequest(new
                {
                    message = "Username, Full Name, Email, Password, and OTP are required."
                });
            }

            // Validate OTP for email or phone
            var otpTarget = !string.IsNullOrWhiteSpace(request.Email) ? request.Email.Trim() : request.MobileNumber.Trim();
            var isOtpValid = _otpService.ValidateOtp(otpTarget, "register", request.Otp);

            // Also allow validating via MobileNumber if provided
            if (!isOtpValid && !string.IsNullOrWhiteSpace(request.MobileNumber))
            {
                isOtpValid = _otpService.ValidateOtp(request.MobileNumber.Trim(), "register", request.Otp);
            }

            if (!isOtpValid)
            {
                return BadRequest(new { message = "Invalid or expired verification OTP." });
            }

            return await ExecuteRegistration(request);
        }

        // ============================================================
        // STANDARD REGISTER (Optional direct registration)
        // POST: api/Auth/register
        // ============================================================
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Username) ||
                string.IsNullOrWhiteSpace(request.FullName) ||
                string.IsNullOrWhiteSpace(request.Email) ||
                string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    message = "Username, Full Name, Email, and Password are required."
                });
            }

            return await ExecuteRegistration(request);
        }

        private async Task<IActionResult> ExecuteRegistration(RegisterRequest request)
        {
            if (request.Password.Length < 6)
            {
                return BadRequest(new
                {
                    message = "Password must be at least 6 characters."
                });
            }

            var username = request.Username.Trim();
            var usernameExists = await _context.Employees
                .AnyAsync(e => e.Username.ToLower() == username.ToLower());

            if (usernameExists)
            {
                return Conflict(new
                {
                    message = "Username already exists. Please choose another username."
                });
            }

            var email = request.Email.Trim().ToLower();
            var emailExists = await _context.Employees
                .AnyAsync(e => e.Email.ToLower() == email);

            if (emailExists)
            {
                return Conflict(new
                {
                    message = "An account with this email already exists."
                });
            }

            var mobile = request.MobileNumber?.Trim() ?? string.Empty;
            if (!string.IsNullOrEmpty(mobile))
            {
                var phoneExists = await _context.Employees
                    .AnyAsync(e => e.MobileNumber == mobile);

                if (phoneExists)
                {
                    return Conflict(new
                    {
                        message = "An account with this phone number already exists."
                    });
                }
            }

            var requestedRoleName = string.IsNullOrWhiteSpace(request.Role) ? "Employee" : request.Role;
            var assignedRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == requestedRoleName);

            if (assignedRole == null)
            {
                assignedRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "Employee");
                if (assignedRole == null)
                {
                    return StatusCode(500, new
                    {
                        message = "Employee role is not configured. Please contact administrator."
                    });
                }
            }

            var defaultDepartment = await _context.Departments.FirstOrDefaultAsync();
            if (defaultDepartment == null)
            {
                return StatusCode(500, new
                {
                    message = "No department is configured. Please contact administrator."
                });
            }

            var employee = new Employee
            {
                Username = username,
                FullName = request.FullName.Trim(),
                Email = email,
                MobileNumber = mobile,
                RoleId = assignedRole.Id,
                DepartmentId = defaultDepartment.Id,
                IsActive = true,
                CreatedDate = DateTime.UtcNow
            };

            employee.PasswordHash = _passwordHasher.HashPassword(employee, request.Password);

            _context.Employees.Add(employee);
            await _context.SaveChangesAsync();

            return StatusCode(201, new
            {
                message = "Registration successful. You can now login.",
                employee = new
                {
                    id = employee.Id,
                    username = employee.Username,
                    fullName = employee.FullName,
                    email = employee.Email,
                    mobileNumber = employee.MobileNumber,
                    role = assignedRole.Name,
                    department = defaultDepartment.Name
                }
            });
        }

        // ============================================================
        // LOGIN (With Password: via Email, Phone Number, or Username)
        // POST: api/Auth/login
        // ============================================================
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
            {
                return BadRequest(new
                {
                    message = "Email/Phone Number/Username and password are required."
                });
            }

            var loginInput = request.Email.Trim().ToLower();
            var rawInput = request.Email.Trim();

            // Match Email, Mobile Number, or Username
            var employee = await _context.Employees
                .Include(e => e.Role)
                .Include(e => e.Department)
                .FirstOrDefaultAsync(e =>
                    e.Email.ToLower() == loginInput ||
                    e.MobileNumber == rawInput ||
                    e.Username.ToLower() == loginInput);

            if (employee == null)
            {
                return Unauthorized(new
                {
                    message = "Invalid Email/Phone/Username or password."
                });
            }

            if (!employee.IsActive)
            {
                return Unauthorized(new
                {
                    message = "Your account is inactive. Please contact administrator."
                });
            }

            if (string.IsNullOrWhiteSpace(employee.PasswordHash))
            {
                return Unauthorized(new
                {
                    message = "Password has not been configured for this account."
                });
            }

            var passwordResult = _passwordHasher.VerifyHashedPassword(
                employee,
                employee.PasswordHash,
                request.Password);

            if (passwordResult == PasswordVerificationResult.Failed)
            {
                return Unauthorized(new
                {
                    message = "Invalid Email/Phone/Username or password."
                });
            }

            var roleName = employee.Role?.Name ?? "Employee";
            var token = GenerateToken(employee.Id, employee.FullName, employee.Email, roleName);

            employee.LastLoginDate = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return Ok(new
            {
                token,
                employee = new
                {
                    id = employee.Id,
                    username = employee.Username,
                    fullName = employee.FullName,
                    email = employee.Email,
                    mobileNumber = employee.MobileNumber,
                    role = roleName,
                    department = employee.Department?.Name
                }
            });
        }

        // ============================================================
        // JWT TOKEN GENERATOR
        // ============================================================
        private string GenerateToken(
            int employeeId,
            string fullName,
            string email,
            string role)
        {
            var jwtKey = _configuration["Jwt:Key"];
            if (string.IsNullOrWhiteSpace(jwtKey))
            {
                throw new InvalidOperationException("JWT key is not configured.");
            }

            var issuer = _configuration["Jwt:Issuer"] ?? "EAMS.Api";
            var audience = _configuration["Jwt:Audience"] ?? "EAMS.Frontend";
            var expiryMinutes = int.TryParse(_configuration["Jwt:ExpiryMinutes"], out var minutes) ? minutes : 60;

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, employeeId.ToString()),
                new Claim(ClaimTypes.NameIdentifier, employeeId.ToString()),
                new Claim(ClaimTypes.Name, fullName),
                new Claim(ClaimTypes.Email, email),
                new Claim(ClaimTypes.Role, role)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: credentials);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}