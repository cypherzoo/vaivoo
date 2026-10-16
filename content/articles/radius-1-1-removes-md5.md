---
title: "How RADIUS/1.1 removes the MD5 dependency"
slug: radius-1-1-removes-md5
date: "2026-10-16"
category: Vulnerability
summary: "Blast-RADIUS exploited the legacy RADIUS response authenticator. RADIUS/1.1, an Experimental RFC, removes the MD5-dependent fields and delegates packet authentication, integrity, and confidentiality to TLS or DTLS."
author: Chris War
status: published
related: [crypto-hmac]
sources:
  - title: "VU#456537: RADIUS protocol susceptible to forgery attacks"
    publisher: CERT Coordination Center
    url: https://kb.cert.org/vuls/id/456537
  - title: "Blast-RADIUS"
    publisher: UC San Diego and research collaborators
    url: https://www.blastradius.fail/
  - title: "RFC 3579: RADIUS Support for EAP"
    publisher: IETF
    url: https://www.rfc-editor.org/rfc/rfc3579.html
  - title: "RFC 6614: Transport Layer Security (TLS) Encryption for RADIUS"
    publisher: IETF
    url: https://www.rfc-editor.org/rfc/rfc6614.html
  - title: "RFC 9765: RADIUS/1.1: Leveraging Application-Layer Protocol Negotiation (ALPN) to Remove MD5"
    publisher: IETF
    url: https://www.rfc-editor.org/rfc/rfc9765.html
  - title: "RFC 9813: Operational Considerations for Using TLS Pre-Shared Keys (TLS-PSKs) with RADIUS"
    publisher: IETF
    url: https://www.rfc-editor.org/rfc/rfc9813.html
---

On July 9, 2024, CERT/CC disclosed CVE-2024-3596, commonly called Blast-RADIUS. A network-positioned attacker could exploit the MD5-based integrity construction used by legacy RADIUS to forge an authentication response when the Message-Authenticator attribute was not required or enforced. CERT/CC reported that a valid Access-Reject could be transformed into an Access-Accept without knowledge of the shared secret. The vulnerability was in the protocol's response verification, not in a user's password or second factor. [CERT/CC describes the conditions, impact, and affected protocol roles](https://kb.cert.org/vuls/id/456537).

## The response authenticator was not a modern MAC

RADIUS was designed in the 1990s. In the original construction, the server computes a Response Authenticator using MD5 over selected packet fields, attributes, and the shared secret. MD5 collision resistance has been considered inadequate for many years, but exploiting this specific construction required more than producing two arbitrary messages with the same digest.

The researchers developed a chosen-prefix collision that fit the RADIUS packet structure. Their proof-of-concept computations took three to six minutes in the described environment, longer than the 30 to 60 second timeouts commonly used by RADIUS clients; the researchers expect significant speedups with better hardware. That time is a reported experimental result, not a universal attack duration. The attacker also required a suitable network position and a request not already protected by a required Message-Authenticator. [The researchers describe the construction and measured proof-of-concept timing](https://www.blastradius.fail/).

The Message-Authenticator defined for RADIUS/EAP uses HMAC-MD5. HMAC-MD5 is a different construction from a plain MD5 digest with a secret included in the input. CERT/CC recommended that legacy implementations, at a minimum, require Message-Authenticator and enforce TLS or DTLS protection. RADIUS exchanges carrying EAP messages already require the attribute under [RFC 3579 Section 3.2](https://www.rfc-editor.org/rfc/rfc3579.html).

## A protected hop does not imply a protected path

RADIUS can pass through proxies. Each proxy terminates one RADIUS relationship and creates another, so protection is evaluated hop by hop. A TLS-protected connection on one segment does not establish that every later segment uses TLS, requires Message-Authenticator, or rejects legacy behavior.

Authentication and authorization are also separate here. RADIUS authenticates a request and can carry attributes used to assign a role or service. If an attacker can replace a rejection with an acceptance or alter returned attributes, the integrity failure can affect both admission and the authorization context attached to it.

What can reasonably be inferred is that remediation requires a path inventory, not only a server patch. Operators need to identify clients, servers, proxies, transports, shared-secret boundaries, and the policy applied on every hop. A hidden legacy segment can preserve the vulnerable security model after the visible endpoints are updated.

## RADIUS/1.1 removes the old construction

[RFC 9765](https://www.rfc-editor.org/rfc/rfc9765.html), an Experimental RFC published in April 2025, defines RADIUS/1.1, negotiated with Application-Layer Protocol Negotiation over TLS 1.3 or DTLS. It makes no changes to RADIUS/UDP or RADIUS/TCP. In RADIUS/1.1, the legacy Identifier and Request and Response Authenticator fields are no longer used, and operations depending on those fields must not be performed. Packet authentication, secrecy, and security are supplied by the TLS layer, so RADIUS-specific cryptographic primitives are no longer needed.

The Message-Authenticator is also unnecessary inside RADIUS/1.1 and must not be sent on such a connection. This is not because message integrity has become optional. It is because authenticated encryption and peer authentication belong to the transport security protocol instead of being reconstructed inside each RADIUS packet.

Earlier standards already defined RADIUS over TLS and DTLS. [RFC 6614](https://www.rfc-editor.org/rfc/rfc6614.html), also Experimental, requires certificate-based mutual authentication for RADIUS/TLS. [RFC 9813](https://www.rfc-editor.org/rfc/rfc9813.html), a Best Current Practice published in July 2025, gives operational guidance for using TLS pre-shared keys with RADIUS/TLS and RADIUS/DTLS. Its PSKs follow the familiar shared-secret model, which can ease migration from RADIUS/UDP.

## Migration must make downgrade visible

The immediate controls for remaining legacy transport are to apply vendor updates, require Message-Authenticator in Access-Request packets, protect transport with TLS or DTLS, and isolate unprotected RADIUS traffic. Those measures address deployed systems that cannot move directly to RADIUS/1.1.

The more durable design is to remove the obsolete cryptographic fields and require an authenticated secure channel. That change also creates a new operational requirement: endpoints and proxies must know whether a connection negotiated the protected protocol and must not silently fall back to an insecure hop.

Better migration telemetry is still needed. An operator should be able to prove which RADIUS version and transport protected each hop, identify downgrades, and reject a path that violates policy. This is design guidance inferred from the proxy model, not a claim that RFC 9765 defines end-to-end path attestation.

Blast-RADIUS therefore has a constructive result. The repair is not a stronger password or another user factor. It is a clearer protocol boundary: modern transport security protects the exchange, legacy MD5 packet authenticators disappear, and every transition between protected and legacy operation becomes an explicit engineering decision.
