namespace EAMS.Api.Services
{
    public interface IOtpService
    {
        string GenerateOtp(string identifier, string purpose);
        bool ValidateOtp(string identifier, string purpose, string otp);
        void ClearOtp(string identifier, string purpose);
    }
}
