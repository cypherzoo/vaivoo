---
title: "A valid signature was not complete token validation"
slug: valid-signature-incomplete-validation
date: "2026-10-16"
category: Breach
summary: "Storm-0558 used a real Microsoft consumer signing key to forge tokens accepted by enterprise mail. The case separates signature verification from issuer, audience, token-type, and key-scope validation."
author: Chris War
status: published
related: [protocol-oauth-2, protocol-openid-connect]
sources:
  - title: "Review of the Summer 2023 Microsoft Exchange Online Intrusion"
    publisher: Cyber Safety Review Board / CISA
    url: https://www.cisa.gov/sites/default/files/2024-04/CSRB_Review_of_the_Summer_2023_MEO_Intrusion_Final_508c.pdf
  - title: "Results of Major Technical Investigations for Storm-0558 Key Acquisition"
    publisher: Microsoft Security Response Center
    url: https://www.microsoft.com/en-us/msrc/blog/2023/09/results-of-major-technical-investigations-for-storm-0558-key-acquisition
  - title: "RFC 8725: JSON Web Token Best Current Practices"
    publisher: IETF
    url: https://www.rfc-editor.org/rfc/rfc8725.html
  - title: "RFC 9068: JSON Web Token (JWT) Profile for OAuth 2.0 Access Tokens"
    publisher: IETF
    url: https://www.rfc-editor.org/rfc/rfc9068.html
  - title: "RFC 9700: Best Current Practice for OAuth 2.0 Security"
    publisher: IETF
    url: https://www.rfc-editor.org/rfc/rfc9700.html
---

In May and June 2023, Storm-0558 used forged authentication tokens to access Microsoft Exchange Online mailboxes. The Cyber Safety Review Board reported that the intrusion affected 22 organizations and more than 500 individuals. The tokens were signed with a Microsoft account consumer key created in 2016. Microsoft separately explained that its mail system accepted tokens signed by that consumer key for enterprise email because required issuer and key-scope validation was not performed. [The Board documented the scope and unresolved key acquisition](https://www.cisa.gov/sites/default/files/2024-04/CSRB_Review_of_the_Summer_2023_MEO_Intrusion_Final_508c.pdf); [Microsoft documented the validation path](https://www.microsoft.com/en-us/msrc/blog/2023/09/results-of-major-technical-investigations-for-storm-0558-key-acquisition).

## A signature validates a statement from a key

A digital signature permits a verifier to test whether data was signed using the private key corresponding to a particular public key and whether the signed data changed afterward. It does not, by itself, establish that the key was authorized to issue this kind of token for this tenant, audience, account class, or service.

Microsoft maintained separate consumer and enterprise signing systems. It introduced a common key-metadata publishing endpoint in September 2018 to support applications serving both account types. According to Microsoft's investigation, it provided helper APIs that validated token signatures cryptographically but did not update these libraries to perform the necessary scope validation automatically. When the mail systems began using the common metadata endpoint in 2022, developers incorrectly assumed the libraries performed complete validation and did not add the required issuer and scope checks.

The result was not a broken signature algorithm. The signature did what it was designed to do: it established that the token came from the holder of the consumer private key. The relying service made an additional, incorrect decision about what that key was permitted to assert.

## Validation and authorization must remain distinct

Token validation determines whether a token satisfies a defined profile: expected signature algorithm, trusted issuer, intended audience, token type, time window, and other required claims. Authorization is the later decision about whether the validated subject may perform a requested operation.

This distinction prevents a common compression of several decisions into the phrase "the token is valid." A token can have a valid signature yet be invalid for the receiving service. It can also be fully valid but carry insufficient permissions for the requested action.

Current standards make these checks explicit. [RFC 8725 Sections 3.8 and 3.9](https://www.rfc-editor.org/rfc/rfc8725.html) require applications to validate that signing keys belong to the issuer and to validate the intended audience. Section 3.12 adds that where one issuer produces different kinds of JWTs, the validation rules must be mutually exclusive. [RFC 9068 Section 4](https://www.rfc-editor.org/rfc/rfc9068.html) requires an OAuth resource server to check the access-token type, exact issuer, audience, signature, algorithm, and expiration. Failure of any required check results in rejection.

## Modern profiles reduce ambiguous trust

OAuth authorization-server metadata provides an issuer identifier and a `jwks_uri` from which verifiers obtain signing keys. Audience restriction connects a token to an intended resource. Explicit token typing reduces confusion between an ID token, access token, security event, or another JWT-shaped object. [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700.html), published in January 2025 as BCP 240, further recommends audience-restricted access tokens and sender-constrained tokens as a defense against replay of stolen or leaked tokens.

These mechanisms solve different problems. Issuer and audience checks constrain where a token is accepted. Token typing constrains how it is interpreted. Sender constraint limits who can present it. None makes theft of an issuer's signing key harmless. A verifier still depends on correct metadata, key management, library behavior, and a policy that rejects missing or inconsistent claims.

RFC 9068 also states a relevant limitation: it does not provide a mechanism for identifying a specific key as the one used to sign JWT access tokens, so resource servers have to accept signatures made with any of the keys the authorization server publishes for that issuer. That is a standards-level boundary, not evidence that Storm-0558 depended on RFC 9068.

## Constrain keys as well as tokens

What can reasonably be inferred is that safer APIs should make the secure validation profile the unit of configuration. An application should select an expected issuer, token type, audience, algorithms, and key set together, rather than call a signature function and assemble the remaining checks independently.

A further design direction is stronger key-purpose constraint. Metadata or certified key attributes could state that a key is authorized only for a defined token type, issuer namespace, tenant class, or service. Verifiers would still need policy, but accidental reuse of a broadly published key would become easier to reject. This is proposed design guidance, not a claim that a current general-purpose standard completely provides it.

The operational guidance is immediate: inventory every accepted token type; define mutually exclusive validation profiles; pin expected issuer and audience values; retrieve keys only through trusted metadata; test rejection cases; rotate signing keys; and keep signing domains as small as the architecture allows. A valid signature is necessary evidence. It is not the whole identity decision.
