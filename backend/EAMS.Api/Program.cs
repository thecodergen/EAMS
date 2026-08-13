using Microsoft.EntityFrameworkCore;
using EAMS.Api.Data;
using EAMS.Api.Models;
using EAMS.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// ============================================
// CONTROLLERS + JSON
// ============================================

builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

// ============================================
// DATABASE
// ============================================

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")
    ));

// ============================================
// SERVICES
// ============================================

// Audit Service
builder.Services.AddScoped<IAuditService, AuditService>();

// ============================================
// CORS
// ============================================

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
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

// ============================================
// OPENAPI
// ============================================

builder.Services.AddOpenApi();

var app = builder.Build();

// ============================================
// OPENAPI
// ============================================

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

// ============================================
// MIDDLEWARE
// ============================================

app.UseCors("AllowFrontend");

// Keep HTTP API working on localhost:5000.
// HTTPS redirection can cause issues when no HTTPS
// port is configured in development.
app.UseAuthorization();

app.MapControllers();

// ============================================
// EAMS MASTER DATA SEEDING
// ============================================

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider
        .GetRequiredService<AppDbContext>();

    // ========================================
    // ATTENDANCE STATUSES
    // ========================================

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

    // ========================================
    // WORK LOCATIONS
    // ========================================

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

    // ========================================
    // SHIFTS
    // ========================================

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

    // ========================================
    // SAVE MASTER DATA
    // ========================================

    await context.SaveChangesAsync();
}

// ============================================
// START APPLICATION
// ============================================

app.Run();