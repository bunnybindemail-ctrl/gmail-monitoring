type EmailLike = {
  mailboxEmail?: string | null;
  sender?: string | null;
  snippet?: string | null;
  subject?: string | null;
};

export type EmailCategory = "OTP" | "OTHER";

const OTP_PATTERNS = [
  /\botp\b/i,
  /\bone[- ]time password\b/i,
  /\bverification code\b/i,
  /\bverify(?: your)? (?:email|account|identity|login)\b/i,
  /\bpasscode\b/i,
  /\bsecurity code\b/i,
  /\blogin code\b/i,
  /\bsign[- ]in code\b/i,
  /\b2fa\b/i,
  /\btwo[- ]factor\b/i,
  /\bauthentication code\b/i,
  /\bconfirm(?:ation)? code\b/i,
];

const OTP_CODE_PATTERNS = [
  /\b(?:code|otp|passcode|verification code|security code)[^A-Za-z0-9]{0,8}([A-Z0-9-]{4,10})\b/i,
  /\b([0-9]{4,8})\b/,
];

export function getEmailCategory(email: EmailLike): EmailCategory {
  const haystack = [email.subject, email.snippet, email.sender, email.mailboxEmail]
    .filter(Boolean)
    .join(" ");

  return OTP_PATTERNS.some((pattern) => pattern.test(haystack)) ? "OTP" : "OTHER";
}

export function groupEmailsByCategory<T extends EmailLike>(emails: T[]) {
  return emails.reduce(
    (accumulator, email) => {
      const category = getEmailCategory(email);
      accumulator[category].push(email);
      return accumulator;
    },
    { OTP: [] as T[], OTHER: [] as T[] },
  );
}

export function extractOtpCode(email: EmailLike) {
  const haystack = [email.subject, email.snippet].filter(Boolean).join(" ");

  for (const pattern of OTP_CODE_PATTERNS) {
    const match = haystack.match(pattern);

    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
}
