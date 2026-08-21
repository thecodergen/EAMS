namespace EAMS.Api.DTOs
{
    public class SendOtpRequest
    {
        // Email, Phone Number, or Username
        public string Identifier { get; set; } = string.Empty;

        // "login" or "register"
        public string Purpose { get; set; } = "login";
    }

    public class OtpLoginRequest
    {
        // Email or Phone Number
        public string Identifier { get; set; } = string.Empty;

        // 6-digit OTP code
        public string Otp { get; set; } = string.Empty;
    }

    public class RegisterWithOtpRequest : RegisterRequest
    {
        // 6-digit OTP code verifying email or phone
        public string Otp { get; set; } = string.Empty;
    }
}
