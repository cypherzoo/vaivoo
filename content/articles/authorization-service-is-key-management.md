---
title: "An authorization service is a key-management system"
slug: authorization-service-is-key-management
date: "2026-10-04"
category: Vulnerability
summary: "Dell's advisory for Container Storage Modules lists missing authentication, hard-coded credentials, insufficient randomness and improper certificate validation in one product. Read together, they describe a key-management problem."
author: Chris War
status: published
sources:
  - title: "DSA-2026-448: Security Update for Dell Container Storage Modules Multiple Vulnerabilities"
    publisher: Dell
    url: https://www.dell.com/support/kbdoc/en-us/000515771/dsa-2026-448-security-update-for-dell-container-storage-modules-multiple-vulnerabilities
  - title: "RFC 8725: JSON Web Token Best Current Practices"
    publisher: IETF
    url: https://datatracker.ietf.org/doc/html/rfc8725
  - title: "RFC 7518: JSON Web Algorithms (JWA)"
    publisher: IETF
    url: https://datatracker.ietf.org/doc/html/rfc7518
---

On 1 October Dell published advisory **DSA-2026-448** for Container Storage Modules (CSM), the software that connects Kubernetes clusters to Dell storage arrays. The advisory has since been revised twice (5 and 6 October). All proprietary issues are fixed in **version 1.18.0**; versions before it are affected.

## What the advisory lists

Grouped by the kind of failure, the proprietary CVEs are:

**Missing authentication for a critical function**
- `CVE-2026-63688` (10.0): in the csm-authorization-storage gRPC server; an unauthenticated remote attacker could obtain storage-backend administrator credentials for all registered arrays.
- `CVE-2026-63692` (10.0): an unauthenticated remote attacker could elevate privileges.
- `CVE-2026-70411` (7.1): in the tenant gRPC service; adjacent network, allowing creation of tenants, cross-tenant role injection and changes to storage access-control flags.
- `CVE-2026-63690` (5.4): in several CSI drivers.

**Hard-coded credentials**
- `CVE-2026-61421` (9.8): in CSM Authorization, leading to elevation of privileges.
- `CVE-2026-54472` (9.8): in csm-docs, leading to information disclosure.

**Insufficiently random values**
- `CVE-2026-76105` (7.7): local, leading to information tampering.

**Improper certificate validation**
- `CVE-2026-67270` (8.2): in the proxy server; an adjacent attacker could obtain storage administrator credentials.

There are also privilege-management, template-injection and log-exposure issues. The bundled third-party components include the Go JWT library (`golang-jwt/jwt/v4`).

## One problem, four symptoms

An authorization service does three cryptographic things: it **holds** secrets (backend credentials, signing keys), it **issues** proofs of authority (tokens), and it **verifies** who it is talking to (TLS peers, token signatures). Each CVE class above breaks one of those:

- Missing authentication: verification skipped entirely.
- Hard-coded credentials: a secret that is identical in every deployment, so it is not a secret.
- Insufficient randomness: secrets or nonces that can be predicted or reproduced.
- Improper certificate validation: the channel to the backend is not bound to the backend's identity, so credentials can be read in transit.

That is why the product reads better as a key-management system than as a policy engine. Its security reduces to the quality of its keys and the strictness of its verification.

## What the token standards already say

The advisory does not name the token algorithm used, so the following is general guidance, not a claim about CSM's internals. For HMAC-signed JSON Web Tokens, RFC 7518 requires a key at least as long as the hash output (256 bits for HS256). RFC 8725 adds that human-memorable passwords must not be used directly as keys for algorithms such as HS256, and that keys must have sufficient entropy. A key that appears in documentation or source code satisfies neither requirement, however long it is.

## Practical consequences

- Upgrade to **1.18.0 or later**; Dell lists no workaround.
- After upgrading, **rotate every secret the old version could have exposed**: token signing keys and the storage-backend administrator credentials. A patch closes the door; it does not change keys that may already have been read.
- Inventory every component that can issue privileged tokens or hold backend credentials, and test it as you would test a certificate authority: for key generation, key storage and verification strictness.

Dell's advisory does not state that the vulnerabilities are being exploited.
