namespace EAMS.Api.Services
{
    public interface IEmailService
    {
        Task<bool> SendOtpEmailAsync(string recipientEmail, string otpCode, string purpose);
    }
}
