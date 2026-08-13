using EAMS.Api.Data;
using EAMS.Api.Models;

namespace EAMS.Api.Services
{
    public class AuditService : IAuditService
    {
        private readonly AppDbContext _context;

        public AuditService(AppDbContext context)
        {
            _context = context;
        }

        public async Task LogAsync(int employeeId, string action)
        {
            var auditLog = new AuditLog
            {
                EmployeeId = employeeId,
                Action = action,
                Timestamp = DateTime.UtcNow
            };

            _context.AuditLogs.Add(auditLog);

            await _context.SaveChangesAsync();
        }
    }
}