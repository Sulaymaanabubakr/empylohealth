import {
  assert,
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  createSalt,
  generateOtpCode,
  hashOtp,
  isOtpExpired,
  isOtpLocked,
  signVerificationToken,
  verifyVerificationToken,
} from "./otp.ts";

Deno.test("otp helpers hash and verify token payload", async () => {
  const code = generateOtpCode();
  const salt = createSalt();
  const hash = await hashOtp(code, salt);
  assert(hash.length > 10);

  const token = await signVerificationToken({ email: "test@example.com", purpose: "SIGNUP_VERIFY" }, 60);
  const payload = await verifyVerificationToken(token);
  assertEquals(payload.email, "test@example.com");
});

Deno.test("otp expiry and lock helpers behave as expected", () => {
  assert(isOtpExpired(new Date(Date.now() - 1000)));
  assert(!isOtpExpired(new Date(Date.now() + 60_000)));
  assert(isOtpLocked(5, 5));
  assert(!isOtpLocked(4, 5));
});

Deno.test("verification token rejects malformed payloads", async () => {
  await assertRejects(() => verifyVerificationToken("bad.token"));
});
