-- Fix database function security by setting proper search_path
ALTER DATABASE postgres SET search_path TO public, extensions;

-- Configure proper OTP expiry settings for better security
UPDATE auth.config SET 
  otp_exp = 3600,  -- 1 hour expiry for OTP codes
  otp_length = 6   -- Standard 6-digit OTP codes
WHERE true;