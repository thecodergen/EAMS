using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

using EAMS.Api.Data;
using EAMS.Api.Models;
using EAMS.Api.Services;
using EAMS.Api.Authorization;

var builder = WebApplication.CreateBuilder(args);

// ============================================================
// CONTROLLERS + JSON
// ============================================================

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// ============================================================
// JWT AUTHENTICATION
// ============================================================

var jwtKey = builder.Configuration["Jwt:Key"];

if (string.IsNullOrWhiteSpace(jwtKey))
{
    throw new InvalidOperationException(
        "JWT key is not configured.");
}

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,

                ValidateAudience = true,

                ValidateLifetime = true,

                ValidateIssuerSigningKey = true,

                ValidIssuer =
                    builder.Configuration["Jwt:Issuer"],

                ValidAudience =
                    builder.Configuration["Jwt:Audience"],

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(jwtKey)),

                RoleClaimType =
                    System.Security.Claims.ClaimTypes.Role,

                NameClaimType =
                    System.Security.Claims.ClaimTypes.Name
            };
    });

// ============================================================
// ROLE-BASED AUTHORIZATION
// ============================================================

builder.Services.AddAuthorization(options =>
{
    // --------------------------------------------------------
    // Employee-level access
    // Employee + Manager + Admin
    // --------------------------------------------------------

    options.AddPolicy(
        Policies.EmployeeOnly,
        policy =>
            policy.RequireRole(
                RoleNames.Employee,
                RoleNames.Manager,
                RoleNames.Admin));

    // --------------------------------------------------------
    // Manager-level access
    // Manager + Admin
    // --------------------------------------------------------

    options.AddPolicy(
        Policies.ManagerOnly,
        policy =>
            policy.RequireRole(
                RoleNames.Manager,
                RoleNames.Admin));

    // --------------------------------------------------------
    // Admin-level access
    // Admin only
    // --------------------------------------------------------

    options.AddPolicy(
        Policies.AdminOnly,
        policy =>
            policy.RequireRole(
                RoleNames.Admin));
});

// ============================================================
// DATABASE - SQL SERVER
// ============================================================

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString(
            "DefaultConnection")
    ));

// ============================================================
// SERVICES
// ============================================================

builder.Services.AddScoped<
    IAuditService,
    AuditService>();

builder.Services.AddSingleton<
    IOtpService,
    OtpService>();

builder.Services.AddScoped<
    IEmailService,
    EmailService>();

// ============================================================
// CORS
// ============================================================

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "AllowFrontend",
        policy =>
        {
            policy
                .WithOrigins(
                    "http://localhost:3000",
                    "http://localhost:3001"
                )
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
});

// ============================================================
// OPENAPI
// ============================================================

builder.Services.AddOpenApi();

var app = builder.Build();

// ============================================================
// OPENAPI
// ============================================================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// ============================================================
// MIDDLEWARE
// ============================================================

// Allow Next.js frontend to call ASP.NET Core API

app.UseCors("AllowFrontend");

// Authentication MUST come before Authorization

app.UseAuthentication();

app.UseAuthorization();

// Map API controllers

app.MapControllers();

// ============================================================
// DATABASE MIGRATION + EAMS MASTER DATA
// ============================================================

using (var scope = app.Services.CreateScope())
{
    var context =
        scope.ServiceProvider
            .GetRequiredService<AppDbContext>();

    // ========================================================
    // APPLY DATABASE MIGRATIONS
    // ========================================================

    await context.Database.MigrateAsync();

    // ========================================================
    // ATTENDANCE STATUSES
    // ========================================================

    if (!await context.AttendanceStatuses
        .AnyAsync(s => s.Name == "Present"))
    {
        context.AttendanceStatuses.Add(
            new AttendanceStatus
            {
                Name = "Present"
            });
    }

    if (!await context.AttendanceStatuses
        .AnyAsync(s => s.Name == "Absent"))
    {
        context.AttendanceStatuses.Add(
            new AttendanceStatus
            {
                Name = "Absent"
            });
    }

    if (!await context.AttendanceStatuses
        .AnyAsync(s => s.Name == "Sick Leave"))
    {
        context.AttendanceStatuses.Add(
            new AttendanceStatus
            {
                Name = "Sick Leave"
            });
    }

    if (!await context.AttendanceStatuses
        .AnyAsync(s => s.Name == "Vacation"))
    {
        context.AttendanceStatuses.Add(
            new AttendanceStatus
            {
                Name = "Vacation"
            });
    }

    // ========================================================
    // WORK LOCATIONS
    // ========================================================

    if (!await context.WorkLocations
        .AnyAsync(l => l.Name == "Office"))
    {
        context.WorkLocations.Add(
            new WorkLocation
            {
                Name = "Office"
            });
    }

    if (!await context.WorkLocations
        .AnyAsync(l => l.Name == "Home"))
    {
        context.WorkLocations.Add(
            new WorkLocation
            {
                Name = "Home"
            });
    }

    if (!await context.WorkLocations
        .AnyAsync(l => l.Name == "Client Site"))
    {
        context.WorkLocations.Add(
            new WorkLocation
            {
                Name = "Client Site"
            });
    }

    // ========================================================
    // SHIFTS
    // ========================================================

    if (!await context.Shifts
        .AnyAsync(s => s.Name == "Morning"))
    {
        context.Shifts.Add(
            new Shift
            {
                Name = "Morning",
                StartTime = new TimeOnly(9, 0),
                EndTime = new TimeOnly(17, 0)
            });
    }

    if (!await context.Shifts
        .AnyAsync(s => s.Name == "Afternoon"))
    {
        context.Shifts.Add(
            new Shift
            {
                Name = "Afternoon",
                StartTime = new TimeOnly(13, 0),
                EndTime = new TimeOnly(21, 0)
            });
    }

    if (!await context.Shifts
        .AnyAsync(s => s.Name == "Night"))
    {
        context.Shifts.Add(
            new Shift
            {
                Name = "Night",
                StartTime = new TimeOnly(21, 0),
                EndTime = new TimeOnly(5, 0)
            });
    }

    // ========================================================
    // ROLES
    // ========================================================

    if (!await context.Roles
        .AnyAsync(r => r.Name == "Admin"))
    {
        context.Roles.Add(
            new Role
            {
                Name = "Admin"
            });
    }

    if (!await context.Roles
        .AnyAsync(r => r.Name == "Manager"))
    {
        context.Roles.Add(
            new Role
            {
                Name = "Manager"
            });
    }

    if (!await context.Roles
        .AnyAsync(r => r.Name == "Employee"))
    {
        context.Roles.Add(
            new Role
            {
                Name = "Employee"
            });
    }

    // ========================================================
    // DEPARTMENTS
    // ========================================================

    if (!await context.Departments
        .AnyAsync(d => d.Name == "Engineering"))
    {
        context.Departments.Add(
            new Department
            {
                Name = "Engineering"
            });
    }

    if (!await context.Departments
        .AnyAsync(d => d.Name == "Human Resources"))
    {
        context.Departments.Add(
            new Department
            {
                Name = "Human Resources"
            });
    }

    if (!await context.Departments
        .AnyAsync(d => d.Name == "Operations"))
    {
        context.Departments.Add(
            new Department
            {
                Name = "Operations"
            });
    }

    // Save master data first

    await context.SaveChangesAsync();

    // ========================================================
    // DEMO USERS
    // ========================================================

    var adminRole =
        await context.Roles
            .FirstAsync(r => r.Name == "Admin");

    var managerRole =
        await context.Roles
            .FirstAsync(r => r.Name == "Manager");

    var employeeRole =
        await context.Roles
            .FirstAsync(r => r.Name == "Employee");

    var engDept =
        await context.Departments
            .FirstAsync(d => d.Name == "Engineering");

    var hasher =
        new Microsoft.AspNetCore.Identity
            .PasswordHasher<Employee>();

    // ========================================================
    // ADMIN
    // Username: admin
    // Password: Eams@123
    // ========================================================

    if (!await context.Employees
        .AnyAsync(e => e.Username == "admin"))
    {
        var admin = new Employee
        {
            Username = "admin",

            FullName = "System Admin",

            Email = "admin@eams.com",

            DepartmentId = engDept.Id,

            RoleId = adminRole.Id,

            IsActive = true,

            CreatedDate = DateTime.UtcNow
        };

        admin.PasswordHash =
            hasher.HashPassword(
                admin,
                "Eams@123");

        context.Employees.Add(admin);

        await context.SaveChangesAsync();
    }

    // ========================================================
    // MANAGER
    // Username: rahul
    // Password: Eams@123
    // ========================================================

    if (!await context.Employees
        .AnyAsync(e => e.Username == "rahul"))
    {
        var manager = new Employee
        {
            Username = "rahul",

            FullName = "Rahul",

            Email = "rahul@eams.com",

            DepartmentId = engDept.Id,

            RoleId = managerRole.Id,

            IsActive = true,

            CreatedDate = DateTime.UtcNow
        };

        manager.PasswordHash =
            hasher.HashPassword(
                manager,
                "Eams@123");

        context.Employees.Add(manager);

        await context.SaveChangesAsync();
    }

    // ========================================================
    // EMPLOYEE
    // Username: om
    // Password: Eams@123
    // ========================================================

    var managerEmployee =
        await context.Employees
            .FirstOrDefaultAsync(
                e => e.Username == "rahul");

    if (managerEmployee != null)
    {
        if (!await context.Employees
            .AnyAsync(e => e.Username == "om"))
        {
            var employee = new Employee
            {
                Username = "om",

                FullName = "Om Prakash",

                Email = "om@example.com",

                DepartmentId = engDept.Id,

                RoleId = employeeRole.Id,

                ManagerId =
                    managerEmployee.Id,

                IsActive = true,

                CreatedDate = DateTime.UtcNow
            };

            employee.PasswordHash =
                hasher.HashPassword(
                    employee,
                    "Eams@123");

            context.Employees.Add(employee);
        }

        // ====================================================
        // SECOND EMPLOYEE
        // Username: alice
        // Password: Eams@123
        // ====================================================

        if (!await context.Employees
            .AnyAsync(e => e.Username == "alice"))
        {
            var employee2 = new Employee
            {
                Username = "alice",

                FullName = "Alice Smith",

                Email = "alice@eams.com",

                DepartmentId = engDept.Id,

                RoleId = employeeRole.Id,

                ManagerId =
                    managerEmployee.Id,

                IsActive = true,

                CreatedDate = DateTime.UtcNow
            };

            employee2.PasswordHash =
                hasher.HashPassword(
                    employee2,
                    "Eams@123");

            context.Employees.Add(employee2);
        }

        await context.SaveChangesAsync();
    }
}

// ============================================================
// START APPLICATION
// ============================================================

app.Run();