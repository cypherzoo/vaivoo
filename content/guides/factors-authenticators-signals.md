---
title: "Factors, authenticators and signals: three different things"
slug: factors-authenticators-signals
summary: "A factor is a category of evidence, an authenticator is the thing you use, and a signal is context the service observes. Mixing them up leads to wrong conclusions about how strong a sign-in is."
status: draft
order: 1
owner: Christian
last_reviewed_at: null
---

Security discussions often say "factor" when they mean the app, the phone or the code. This guide separates three ideas that are easy to blur: **factors**, **authenticators** and **signals**, and adds a fourth that is often confused with them: **protocols**.

## Factors are categories of evidence

NIST SP 800-63B-4 sorts authentication evidence into categories. A password is "something you know" [↗](/methods/password/#claim-password-max-aal-alone). A one-time code generator with no unlock step, such as a TOTP app or token, is "something you have" [↗](/methods/totp/#claim-totp-mfa-qualification). So is a phone that receives an SMS code [↗](/methods/sms-otp/#claim-sms-otp-mfa-qualification), and so is a hardware security key used as a single-factor cryptographic authenticator [↗](/profiles/security-key-second-factor/#claim-sk2f-mfa).

Biometrics usually enter the picture differently. In a passkey with required user verification, a fingerprint, face or PIN *activates* a key that lives on the device. NIST then treats the combination of key possession and that activation factor as a multi-factor cryptographic authenticator [↗](/profiles/synced-passkey-uv/#claim-synced-passkey-uv-mfa) [↗](/profiles/device-bound-passkey-uv/#claim-device-bound-passkey-uv-mfa).

## Authenticators are the things you use

An authenticator is the concrete thing: an app, a code device, a security key, a passkey. The same kind of authenticator can count as one factor or two depending on how it is used.

A security key that only checks for a touch performs a test of user presence, not user verification. If the response shows that no activation factor was used, NIST says the authentication is single-factor [↗](/profiles/security-key-second-factor/#claim-sk2f-user-presence-only). The same family of key used with a PIN can act as a multi-factor authenticator [↗](/profiles/device-bound-passkey-uv/#claim-device-bound-passkey-uv-mfa).

National schemes make this concrete. Denmark's MitID operator describes its app as multi-factor in itself (a PIN plus device-bound keys), while its code display, audio code reader, chip and password are single-factor means that must be combined [↗](/identity-systems/mitid/#claim-mitid-app-security-design). That is the operator's own description, not an independent evaluation.

## Signals are context, not proof

A signal is something the service observes about the situation. NIST tells verifiers to consider signals such as a recent SIM change, number porting or a device swap before sending a code over the phone network [↗](/methods/sms-otp/#claim-sms-otp-sim-swap-porting-risk).

*Vaivoo's reading:* signals help a service decide how much to trust a sign-in, or whether to ask for more. They are not themselves something the user knows, has or is, so they do not add a factor.

## Protocols carry the result

OpenID Connect is often mentioned alongside authentication methods, but it does not specify how the user is authenticated. The identity provider authenticates the user by whatever means it chooses, and OpenID Connect conveys the result in a signed ID Token [↗](/protocols/openid-connect/#claim-oidc-authentication-method-out-of-scope). Optional `acr` and `amr` values can tell the website which assurance class or methods were used, if both sides agree on their meaning [↗](/protocols/openid-connect/#claim-oidc-acr-amr).

Norwegian BankID illustrates why those labels matter. Its identity-provider documentation distinguishes the code device, the BankID app and the typed password through `amr` values, and warns that these are indications rather than a security mechanism [↗](/identity-systems/norwegian-bankid/#claim-norwegian-bankid-authenticator-forms). The operator also rates its "BankID with biometrics" login at a lower assurance level than "BankID High" [↗](/identity-systems/norwegian-bankid/#claim-norwegian-bankid-biometric-webauthn).

## What to take away

- Ask which **factor categories** are involved, not how many steps the user goes through.
- Ask how the **authenticator** is configured: presence only, or user verification?
- Treat **signals** as risk input, not as extra factors.
- Remember that a **protocol** like OpenID Connect reports the result; the strength comes from the authenticator the identity provider actually used.
