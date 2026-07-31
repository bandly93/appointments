-- Drop the code-based verification fields from BookingRequest: the emailed
-- access token is now the sole proof of email ownership, so a separate
-- guessable code (and its attempt counter) is no longer needed.
ALTER TABLE "BookingRequest" DROP COLUMN "verificationCodeHash";
ALTER TABLE "BookingRequest" DROP COLUMN "verificationAttempts";
