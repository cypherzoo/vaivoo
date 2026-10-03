---
title: "What MFA does, and doesn't, establish"
slug: what-mfa-establishes
summary: "Multi-factor authentication raises the bar, but it does not by itself stop phishing, replay or account-recovery attacks. Which combination you use, and how it is configured, matters more than the label."
status: draft
order: 2
owner: Chris War
last_reviewed_at: null
---

"Turn on MFA" is good advice, but MFA is a category, not a guarantee. This guide uses NIST SP 800-63B-4 as the yardstick, because it states precisely what each combination achieves.

## What MFA means in NIST's terms

A password on its own is a single "something you know" factor and reaches only NIST's lowest level, AAL1 [↗](/methods/password/#claim-password-max-aal-alone). AAL2 requires either a multi-factor authenticator, or a physical authenticator combined with a password or biometric comparison [↗](/methods/totp/#claim-totp-mfa-qualification). A password plus a hardware security key is one such permitted combination [↗](/profiles/security-key-second-factor/#claim-sk2f-mfa).

The configuration matters. A security key that only checks for a touch counts as single-factor if no activation factor was used [↗](/profiles/security-key-second-factor/#claim-sk2f-user-presence-only). A synced passkey counts as multi-factor only when the user-verification flag shows a PIN or biometric was used [↗](/profiles/synced-passkey-uv/#claim-synced-passkey-uv-mfa).

## MFA is not the same as phishing resistance

Passwords are not phishing-resistant [↗](/methods/password/#claim-password-phishing-resistance). Neither are TOTP codes [↗](/methods/totp/#claim-totp-phishing-resistance) nor SMS codes [↗](/methods/sms-otp/#claim-sms-otp-phishing-resistance): the user types the code by hand, and nothing binds it to the real website, so a fake site can relay it while it is still valid. Password + TOTP and password + SMS are therefore MFA, but not phishing-resistant MFA.

NIST names WebAuthn as a way to achieve phishing resistance through verifier name binding [↗](/standards/webauthn/#claim-webauthn-nist-verifier-name-binding). In a password + security key setup, the key's step is bound to the website's domain even though the password step can still be phished [↗](/profiles/security-key-second-factor/#claim-sk2f-phishing-resistance). Passkeys get the same protection, as long as the website checks the origin and RP ID correctly [↗](/profiles/synced-passkey-uv/#claim-synced-passkey-uv-phishing-resistance).

## SMS is a special case

NIST treats SMS codes as a restricted authenticator. A service that accepts them must offer an unrestricted alternative, warn users about the risks and plan to migrate away [↗](/methods/sms-otp/#claim-sms-otp-restricted).

## The highest assurance level needs more than two factors

NIST's top level, AAL3, requires a cryptographic authenticator with a non-exportable key that is phishing-resistant. TOTP [↗](/methods/totp/#claim-totp-aal3-eligible) and SMS codes [↗](/methods/sms-otp/#claim-sms-otp-aal3-eligible) cannot be used there. Synced passkeys stop at AAL2, because their keys can be exported [↗](/profiles/synced-passkey-uv/#claim-synced-passkey-uv-max-nist-aal). Device-bound passkeys [↗](/profiles/device-bound-passkey-uv/#claim-device-bound-passkey-uv-max-nist-aal) and password + security key [↗](/profiles/security-key-second-factor/#claim-sk2f-max-nist-aal) can reach AAL3, but only when the key is genuinely non-exportable and the other AAL3 conditions are met.

## Replay and stored secrets

A password is the same every time, so it is not replay-resistant [↗](/methods/password/#claim-password-replay-resistance). A TOTP code resists replay only if the service refuses a code that has already been accepted [↗](/methods/totp/#claim-totp-replay-resistance).

What the service stores also differs. A TOTP verifier holds a copy of each user's shared secret, so a stolen key store can produce valid codes [↗](/methods/totp/#claim-totp-shared-secret-server-side). With passkeys, the service stores only a public key [↗](/credentials/passkey/#claim-passkey-no-server-side-secret).

## MFA does not fix recovery

Every setup is only as strong as its fallback. If a security key is lost, the user depends on another registered authenticator or on account recovery [↗](/profiles/security-key-second-factor/#claim-sk2f-recovery-dependency). Device-bound passkeys have the same dependency [↗](/profiles/device-bound-passkey-uv/#claim-device-bound-passkey-uv-recovery-dependency). Synced passkeys move the dependency to the passkey provider's account and its recovery process [↗](/profiles/synced-passkey-uv/#claim-synced-passkey-uv-recovery-dependency).

## Questions to ask about any "MFA" setup

*Vaivoo's checklist, derived from the claims above:*

1. Which factor categories are actually combined, and is user verification required?
2. Is the step that matters bound to the website's domain, or can it be relayed?
3. Can the service's database leak something that signs in?
4. What happens when the user loses the authenticator, and is that path as strong as the sign-in itself?
5. Is a weaker method (for example SMS) still offered as a fallback?
