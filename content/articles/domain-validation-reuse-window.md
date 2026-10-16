---
title: "Domain validation proves control of a name, at one moment"
slug: domain-validation-reuse-window
date: "2026-10-08"
category: Breach
summary: "The .gh, .sl and .as registry hijacks produced certificates that were correctly validated and still unauthorized. The interesting variable is not the CA but time: how long a single successful validation keeps paying out."
author: Chris War
status: published
sources:
  - title: "Chrome's Response to Recent ccTLD Registry Hijacks"
    publisher: Google, Chrome Secure Web and Networking Team
    url: https://blog.google/security/chromes-response-to-recent-cctld-registry-hijacks/
  - title: "Ballot SC081v3: Introduce Schedule of Reducing Validity and Data Reuse Periods"
    publisher: CA/Browser Forum
    url: https://cabforum.org/2025/04/11/ballot-sc081v3-introduce-schedule-of-reducing-validity-and-data-reuse-periods/
  - title: "RFC 8659: DNS Certification Authority Authorization (CAA) Resource Record"
    publisher: IETF
    url: https://datatracker.ietf.org/doc/html/rfc8659
  - title: "RFC 8657: CAA Record Extensions for Account URI and ACME Method Binding"
    publisher: IETF
    url: https://www.rfc-editor.org/info/rfc8657/
  - title: "How Certificate Transparency works"
    publisher: certificate.transparency.dev
    url: https://certificate.transparency.dev/howctworks/
---

Google reports that attackers compromised the operators of three country-code top-level domains, **.gh**, **.sl** and **.as**, modified authoritative DNS records, and obtained HTTPS certificates for several Google domains and for domains of other organizations. Google states that its own systems were not compromised and that it has no reason to believe the issuing certificate authorities did anything wrong.

Both statements can be true at once, and that is the point worth studying.

## What a DV certificate actually asserts

Domain-validated issuance is a challenge–response protocol. The CA issues a random value; the applicant demonstrates control of the name by making that value appear where only the name's controller should be able to place it, for example in a DNS TXT record. The certificate then binds a public key to the name.

Formally, the CA's evidence is a statement of the form *"at time t, the authoritative DNS for name N returned value v"*. It is not a statement about who owns N. When the authority above N (here the registry) is compromised, the attacker can make that statement true. The protocol's output is then correct with respect to its inputs and wrong with respect to intent.

## Time is the amplifier

Two parameters in the Web PKI decide how long one moment of DNS control stays useful:

- **Certificate validity**: how long the issued certificate is accepted.
- **Validation data reuse**: how long a CA may rely on a completed domain-control check for *new* issuance without validating again.

The CA/Browser Forum's ballot SC081v3 sets a schedule, from March 2026 to March 2029, that reduces maximum TLS certificate validity from 398 to **47 days** and reuse of domain validation data from 398 to **10 days**. Read as attack economics: under the old values, a brief hijack could be converted into many months of impersonation capability; at the end of the schedule, the same hijack buys weeks.

Google makes the same observation operationally: because CAs may cache and reuse completed validation, a restrictive **CAA** record (RFC 8659), ideally bound to specific ACME accounts and validation methods (RFC 8657), matters *after* the owner regains DNS control. It prevents the attacker from minting further certificates from validation state they earned during the hijack. CAA cannot stop issuance while the attacker controls DNS; it limits the tail.

## Detection is a property of the log, not the CA

Every certificate that Chrome trusts by default must be logged in public Certificate Transparency logs, which are append-only and cryptographically verifiable. That changes the problem from *prevention*, which DNS compromise defeats, to *detection*, which it does not. Google used CT data to find additional affected organizations after its initial response, and notes it cannot guarantee that every affected domain was found and that Chrome's blocking does not protect other clients.

A domain owner who monitors CT for every name they hold, including parked and regional ccTLD names, observes misissuance at the same moment as everyone else. One who does not, learns about it from someone else.

## Implications for authentication

Phishing-resistant authenticators such as WebAuthn credentials bind a signature to the relying party's name. That binding is only as strong as the binding between the name and its legitimate operator. A compromise above the name sits outside the authenticator's threat model; the defenses are the ones above: short validity, short reuse, account-bound CAA, and continuous CT monitoring.

Google has not said how the registries were compromised, by whom, or when it began. Any statement about initial access would be speculation.
