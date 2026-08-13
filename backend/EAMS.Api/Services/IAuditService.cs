namespace EAMS.Api.Services
{
    public interface IAuditService
    {
        Task LogAsync(int employeeId, string action);
    }
}