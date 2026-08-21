using System.Collections.Concurrent;
using System.Security.Cryptography;

namespace EAMS.Api.Services
{
    public class OtpService : IOtpService
    {
        private class OtpEntry
        {
            public string Code { get; set; } = string.Empty;
            public DateTime ExpiresAt { get; set; }
            public int Attempts { get; set; }
        }

        // Thread-safe dictionary: key = $"{purpose}:{normalizedIdentifier}"
        private readonly ConcurrentDictionary<string, OtpEntry> _otpStore = new();
        private readonly TimeSpan _otpValidity = TimeSpan.FromMinutes(5);

        public string GenerateOtp(string identifier, string purpose)
        {
            var key = GetKey(identifier, purpose);
            
            // Generate a secure 6-digit OTP code
            var code = RandomNumberGenerator.GetInt32(100000, 1000000).ToString();

            var entry = new OtpEntry
            {
                Code = code,
                ExpiresAt = DateTime.UtcNow.Add(_otpValidity),
                Attempts = 0
            };

            _otpStore.AddOrUpdate(key, entry, (_, _) => entry);
            return code;
        }

        public bool ValidateOtp(string identifier, string purpose, string otp)
        {
            if (string.IsNullOrWhiteSpace(otp)) return false;

            var key = GetKey(identifier, purpose);
            if (!_otpStore.TryGetValue(key, out var entry))
            {
                return false;
            }

            if (DateTime.UtcNow > entry.ExpiresAt)
            {
                _otpStore.TryRemove(key, out _);
                return false;
            }

            entry.Attempts++;
            if (entry.Attempts > 5)
            {
                _otpStore.TryRemove(key, out _);
                return false;
            }

            if (entry.Code == otp.Trim())
            {
                _otpStore.TryRemove(key, out _);
                return true;
            }

            return false;
        }

        public void ClearOtp(string identifier, string purpose)
        {
            var key = GetKey(identifier, purpose);
            _otpStore.TryRemove(key, out _);
        }

        private static string GetKey(string identifier, string purpose)
        {
            return $"{purpose.Trim().ToLower()}:{identifier.Trim().ToLower()}";
        }
    }
}
