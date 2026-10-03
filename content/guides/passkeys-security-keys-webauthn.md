---
title: "Passkeys, security keys and WebAuthn: related but different"
slug: passkeys-security-keys-webauthn
summary: "WebAuthn is the standard, a passkey is a kind of credential, and a security key is one kind of device that can hold credentials. Synced and device-bound passkeys share the same protocol but differ in assurance and recovery."
status: draft
order: 3
owner: Christian
last_reviewed_at: null
---

The words passkey, security key, FIDO2 and WebAuthn are often used interchangeably. They describe different layers of the same system.

## WebAuthn is the standard

Web Authentication (WebAuthn) is a W3C specification; Level 3 is a W3C Recommendation dated 25 August 2026 [↗](/standards/webauthn/#claim-webauthn-l3-publication-status). It defines an API for websites to create and use public-key credentials, each scoped to one website, identified by its RP ID [↗](/standards/webauthn/#claim-webauthn-scoped-public-key-credentials).

The website's server must check, at registration and at every sign-in, that the response came from an origin it expects and that it carries the hash of its own RP ID [↗](/standards/webauthn/#claim-webauthn-rp-verifies-origin-and-rpid). That check is what NIST calls verifier name binding, and it is why WebAuthn can be phishing-resistant [↗](/standards/webauthn/#claim-webauthn-nist-verifier-name-binding).

## A passkey is a kind of credential

WebAuthn Level 3 lists "passkey" as a term for a discoverable credential: one the website can request without first knowing who the user is [↗](/credentials/passkey/#claim-passkey-webauthn-discoverable-credential). The website stores only the public key [↗](/credentials/passkey/#claim-passkey-no-server-side-secret).

The FIDO Alliance distinguishes **synced passkeys**, copied to a user's other devices through a cloud service, from **device-bound passkeys**, which never leave one device [↗](/credentials/passkey/#claim-passkey-fido-synced-vs-device-bound). The authenticator reports which kind it is: a synced passkey is backup-eligible (BE flag set) [↗](/profiles/synced-passkey-uv/#claim-synced-passkey-uv-synchronised), while a device-bound one is a single-device credential (BE = 0) [↗](/profiles/device-bound-passkey-uv/#claim-device-bound-passkey-uv-single-device).

## A security key is a device

A hardware security key is a roaming authenticator: separate from the computer or phone and reached over USB, NFC or Bluetooth [↗](/profiles/security-key-second-factor/#claim-sk2f-roaming-transport). It can hold device-bound credentials whose private keys are generated and used inside the key [↗](/profiles/security-key-second-factor/#claim-sk2f-device-bound). It can be used as a second factor after a password, where a touch only proves presence [↗](/profiles/security-key-second-factor/#claim-sk2f-user-presence-only), or with a PIN or biometric so that the key itself is multi-factor [↗](/profiles/device-bound-passkey-uv/#claim-device-bound-passkey-uv-mfa).

## User verification changes the meaning

When a website sets user verification to "required", the authenticator must verify the user locally, and the server rejects responses without the UV flag [↗](/profiles/synced-passkey-uv/#claim-synced-passkey-uv-uv-required). Only then does NIST treat the passkey as multi-factor [↗](/profiles/synced-passkey-uv/#claim-synced-passkey-uv-mfa).

## Synced and device-bound differ in assurance and recovery

Because synced keys can be exported, synced passkeys reach at most NIST AAL2 [↗](/profiles/synced-passkey-uv/#claim-synced-passkey-uv-max-nist-aal), and their security is bounded by the passkey provider's account recovery [↗](/profiles/synced-passkey-uv/#claim-synced-passkey-uv-recovery-dependency). Device-bound passkeys can reach AAL3, but only if the key is held in genuinely isolated hardware; the BE flag alone does not prove that [↗](/profiles/device-bound-passkey-uv/#claim-device-bound-passkey-uv-max-nist-aal). Losing the device means losing the credential, so a second authenticator or a recovery process is needed [↗](/profiles/device-bound-passkey-uv/#claim-device-bound-passkey-uv-recovery-dependency).

## Cryptography under the hood

WebAuthn names algorithms by COSE identifiers. ECDSA on P-256 has long been signalled as ES256 (-7) and Ed25519 as EdDSA (-8). RFC 9864 (October 2025) adds fully specified identifiers and marks those two COSE registrations as deprecated [↗](/crypto/ecdsa-p256/#claim-ecdsa-p256-cose-identifiers) [↗](/crypto/ed25519/#claim-ed25519-cose-identifiers). Both algorithms would be broken by a large enough quantum computer [↗](/crypto/ecdsa-p256/#claim-ecdsa-p256-quantum-vulnerable). NIST's post-quantum signature standard ML-DSA is not yet confirmed for COSE or WebAuthn [↗](/crypto/ml-dsa/#claim-ml-dsa-cose-webauthn-support).

## In one sentence each

- **WebAuthn**: the W3C standard for domain-bound public-key sign-in.
- **Passkey**: a discoverable WebAuthn credential; synced or device-bound.
- **Security key**: a separate hardware device that can hold device-bound credentials.
