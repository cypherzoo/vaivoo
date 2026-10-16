---
title: "When DNS makes a fake certificate valid"
slug: dns-makes-fake-certificates-valid
date: "2026-10-08"
category: Breach
summary: "Attackers took over DNS at three country-code registries and obtained unauthorized HTTPS certificates for Google and other domains. The certificate authorities did what they were designed to do. That is the lesson."
author: Team Vaivoo
status: published
sources:
  - title: "Chrome's response to recent ccTLD registry hijacks"
    publisher: Google
    url: https://blog.google/security/chromes-response-to-recent-cctld-registry-hijacks/
  - title: "Hackers hijack Google domains after breaching ccTLD registries"
    publisher: BleepingComputer
    url: https://www.bleepingcomputer.com/news/security/hackers-hijack-google-domains-after-breaching-cctld-registries/
  - title: "Hackers hijack three country-code domain registries to obtain HTTPS certificates"
    publisher: Help Net Security
    url: https://www.helpnetsecurity.com/2026/10/07/google-unauthorized-https-certificates-cctld-hijacks/
origin:
  name: Cypherzoo
  url: https://cypherzoo.com/dns-makes-certificates-valid/
---

Google says attackers compromised the operators of the **.gh** (Ghana), **.sl** (Sierra Leone) and **.as** (American Samoa) top-level domains, changed authoritative DNS records, and obtained unauthorized HTTPS certificates for several Google domains and for domains of other organizations. Google says its own systems were not compromised, and that it has no reason to believe the issuing certificate authorities did anything wrong.

## What a certificate proves

An HTTPS certificate answers an identity question: *does the requester control this domain?* With domain validation, a certificate authority typically asks the requester to publish a random value in a DNS TXT record. If the value appears in authoritative DNS, that counts as proof of control.

Here the attackers controlled DNS above the individual domains. The certificate authorities checked DNS and got answers the attacker supplied. The certificates were unauthorized; the validation process was not necessarily broken.

**A control can produce a correct result from compromised evidence.**

## Trust is a chain

A browser does not know who owns a website. It trusts certificate authorities; they validate domain control; domain control depends on DNS; DNS depends on registries, registrars and name-server operators. An attacker does not need to defeat every link, only to gain authority at one useful point. Here that point was the registry, which put every domain under the three suffixes at risk.

Google blocked the certificates it found in Chrome using CRLSets and worked with the CAs to revoke them. Certificate Transparency logs later revealed more affected organizations. Google has not said how the registries were compromised, who did it, or when it began, and it cannot guarantee that every affected domain was found. Chrome's interventions do not protect other clients.

## What domain owners can do

- **Monitor Certificate Transparency** for every domain you own, including parked and regional country-code domains. Every certificate Chrome trusts by default must appear in public CT logs.
- If you operate a domain under .gh, .sl or .as, **review recent CT entries now**.
- **Publish restrictive CAA records** that name your CAs and, where supported, bind issuance to specific ACME accounts and validation methods (RFC 8657). CAA cannot stop issuance while an attacker controls DNS, but it stops reuse of cached validation once you regain control.
- **Treat unexpected issuance as an incident**, not a ticket for later.
- **Put registries, registrars and DNS providers in your identity threat model.**

## Why it matters for authentication

Phishing-resistant sign-in methods bind credentials to a domain name. That protection assumes the domain itself is controlled by its owner. When DNS and certificates can be obtained from above, the name in the address bar is no longer proof of who is behind it. Google says it will keep pushing for shorter certificate lifetimes and less reuse of domain validation. That shortens the window; it does not remove the dependency.
