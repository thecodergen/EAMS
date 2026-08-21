using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ClosedXML.Excel;
using EAMS.Api.Data;
using System.IO;

namespace EAMS.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ExportController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExportController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("attendance")]
        public async Task<IActionResult> ExportAttendance()
        {
            var records = await _context.Attendances
                .Include(a => a.Employee)
                .Include(a => a.Status)
                .Include(a => a.Location)
                .OrderByDescending(a => a.Date)
                .ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Attendance");
            var currentRow = 1;

            worksheet.Cell(currentRow, 1).Value = "ID";
            worksheet.Cell(currentRow, 2).Value = "Employee Name";
            worksheet.Cell(currentRow, 3).Value = "Date";
            worksheet.Cell(currentRow, 4).Value = "Status";
            worksheet.Cell(currentRow, 5).Value = "Location";
            worksheet.Cell(currentRow, 6).Value = "Shift";

            foreach (var record in records)
            {
                currentRow++;
                worksheet.Cell(currentRow, 1).Value = record.Id;
                worksheet.Cell(currentRow, 2).Value = record.Employee?.FullName ?? "Unknown";
                worksheet.Cell(currentRow, 3).Value = record.Date.ToString("yyyy-MM-dd");
                worksheet.Cell(currentRow, 4).Value = record.Status?.Name ?? "N/A";
                worksheet.Cell(currentRow, 5).Value = record.Location?.Name ?? "N/A";
                worksheet.Cell(currentRow, 6).Value = "N/A"; 
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            return File(
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Attendance_Report_{DateTime.Now:yyyyMMdd}.xlsx");
        }

        [HttpGet("leaves")]
        public async Task<IActionResult> ExportLeaves()
        {
            var records = await _context.LeaveRequests
                .Include(l => l.Employee)
                .OrderByDescending(l => l.Id)
                .ToListAsync();

            using var workbook = new XLWorkbook();
            var worksheet = workbook.Worksheets.Add("Leave Requests");
            var currentRow = 1;

            worksheet.Cell(currentRow, 1).Value = "ID";
            worksheet.Cell(currentRow, 2).Value = "Employee Name";
            worksheet.Cell(currentRow, 3).Value = "Type";
            worksheet.Cell(currentRow, 4).Value = "Start Date";
            worksheet.Cell(currentRow, 5).Value = "End Date";
            worksheet.Cell(currentRow, 6).Value = "Status";
            worksheet.Cell(currentRow, 7).Value = "Reason";

            foreach (var record in records)
            {
                currentRow++;
                worksheet.Cell(currentRow, 1).Value = record.Id;
                worksheet.Cell(currentRow, 2).Value = record.Employee?.FullName ?? "Unknown";
                worksheet.Cell(currentRow, 3).Value = record.LeaveType;
                worksheet.Cell(currentRow, 4).Value = record.StartDate.ToString("yyyy-MM-dd");
                worksheet.Cell(currentRow, 5).Value = record.EndDate.ToString("yyyy-MM-dd");
                worksheet.Cell(currentRow, 6).Value = record.Status;
                worksheet.Cell(currentRow, 7).Value = record.Reason;
            }

            using var stream = new MemoryStream();
            workbook.SaveAs(stream);
            var content = stream.ToArray();

            return File(
                content,
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                $"Leaves_Report_{DateTime.Now:yyyyMMdd}.xlsx");
        }
    }
}
