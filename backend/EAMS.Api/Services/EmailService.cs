using System.Net;
using System.Net.Mail;

namespace EAMS.Api.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
        {
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> SendOtpEmailAsync(string recipientEmail, string otpCode, string purpose)
        {
            try
            {
                var smtpHost = _configuration["Smtp:Host"] ?? "smtp.gmail.com";
                var smtpPort = int.TryParse(_configuration["Smtp:Port"], out var port) ? port : 587;
                var smtpUser = _configuration["Smtp:User"] ?? "";
                var smtpPass = _configuration["Smtp:Pass"] ?? "";
                var fromEmail = _configuration["Smtp:FromEmail"] ?? (string.IsNullOrEmpty(smtpUser) ? "no-reply@eams-portal.com" : smtpUser);
                var fromName = _configuration["Smtp:FromName"] ?? "EAMS Security";
                var enableSsl = bool.TryParse(_configuration["Smtp:EnableSsl"], out var ssl) ? ssl : true;

                var subject = purpose.ToLower() == "register"
                    ? $"[EAMS] Your Verification Code: {otpCode}"
                    : $"[EAMS] Your Login OTP: {otpCode}";

                var htmlBody = $@"
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }}
        .container {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #1e293b, #0f172a); color: #ffffff; padding: 24px; text-align: center; }}
        .header h1 {{ margin: 0; font-size: 24px; letter-spacing: 1px; color: #38bdf8; }}
        .header p {{ margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; }}
        .content {{ padding: 32px 24px; text-align: center; color: #334155; }}
        .otp-box {{ background: #f1f5f9; border: 2px dashed #cbd5e1; border-radius: 10px; padding: 18px; margin: 24px 0; }}
        .otp-code {{ font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0284c7; margin: 0; font-family: monospace; }}
        .badge {{ display: inline-block; background: #e0f2fe; color: #0369a1; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 12px; }}
        .footer {{ background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; }}
    </style>
</head>
<body>
    <div class='container'>
        <div class='header'>
            <h1>EAMS PORTAL</h1>
            <p>Employee Attendance Management System</p>
        </div>
        <div class='content'>
            <div class='badge'>{(purpose.ToLower() == "register" ? "Account Registration" : "Sign-in Verification")}</div>
            <h2 style='margin-top:0; color:#0f172a; font-size: 20px;'>Your One-Time Password (OTP)</h2>
            <p style='font-size: 14px; line-height: 1.5; color: #475569;'>
                Use the verification code below to complete your {(purpose.ToLower() == "register" ? "registration" : "login")} on the EAMS portal.
            </p>
            <div class='otp-box'>
                <div class='otp-code'>{otpCode}</div>
            </div>
            <p style='font-size: 13px; color: #ef4444; margin-bottom: 0;'>
                ⏱️ This code will expire in <strong>5 minutes</strong>.
            </p>
            <p style='font-size: 12px; color: #94a3b8;'>
                If you did not request this verification code, please disregard this email.
            </p>
        </div>
        <div class='footer'>
            &copy; {DateTime.UtcNow.Year} Employee Attendance Management System. All rights reserved.
        </div>
    </div>
</body>
</html>";

                // Check if SMTP credentials are provided
                if (!string.IsNullOrWhiteSpace(smtpUser) && !string.IsNullOrWhiteSpace(smtpPass))
                {
                    using var client = new SmtpClient(smtpHost, smtpPort)
                    {
                        Credentials = new NetworkCredential(smtpUser, smtpPass),
                        EnableSsl = enableSsl
                    };

                    using var mail = new MailMessage
                    {
                        From = new MailAddress(fromEmail, fromName),
                        Subject = subject,
                        Body = htmlBody,
                        IsBodyHtml = true
                    };
                    mail.To.Add(recipientEmail);

                    await client.SendMailAsync(mail);
                    _logger.LogInformation("Successfully sent OTP email to {Email}", recipientEmail);
                    return true;
                }
                else
                {
                    _logger.LogInformation("SMTP not configured with credentials. Simulated OTP {Otp} for {Email}", otpCode, recipientEmail);
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send OTP email to {Email}", recipientEmail);
                return false;
            }
        }
    }
}
