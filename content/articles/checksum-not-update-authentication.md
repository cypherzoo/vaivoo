---
title: "A checksum is not proof of who authorized an update"
slug: checksum-not-update-authentication
date: "2026-10-17"
category: Breach
summary: "The AOMEI incident shows the difference between checking that a file matches a supplied hash and authenticating who was authorized to define the update in the first place."
author: Chris War
status: published
related: [crypto-sha-2]
sources:
  - title: "Investigating Ephemeral Supply Chain Tampering"
    publisher: Google Threat Intelligence Group / Mandiant
    url: https://cloud.google.com/blog/topics/threat-intelligence/investigating-ephemeral-supply-chain-tampering
  - title: "AOMEI Backupper supply-chain compromise"
    publisher: ManageEngine Threat Analysis Lab
    url: https://www.manageengine.com/threat-analysis-lab/aomei-backupper-supply-chain-compromise.html
  - title: "Roles and metadata"
    publisher: The Update Framework
    url: https://theupdateframework.io/docs/metadata/
  - title: "Overview"
    publisher: The Update Framework
    url: https://theupdateframework.io/docs/overview/
  - title: "Frequently Asked Questions"
    publisher: The Update Framework
    url: https://theupdateframework.io/docs/faq/
  - title: "Attackers Tampered with AOMEI Backupper's Update Servers for Minutes to Deliver a Backdoor"
    publisher: The Hacker News
    url: https://thehackernews.com/2026/10/attackers-tampered-with-aomei.html
---

[Google Threat Intelligence Group and Mandiant](https://cloud.google.com/blog/topics/threat-intelligence/investigating-ephemeral-supply-chain-tampering) disclosed that attackers repeatedly altered configuration used by AOMEI Backupper's update mechanism between April and July 2026. During three confirmed windows lasting 10, 6 and 5 minutes, clients that checked in could be instructed to download and run malicious packages through the normal update path. GTIG says more windows probably went unobserved.

The identity problem in this incident is subtle. The client had an integrity value. What it lacked was independent cryptographic evidence that the party defining that value was authorized to publish the update.

## Integrity and authentication answer different questions

A cryptographic hash maps arbitrary data to a fixed-size value. If a client already has a trustworthy expected hash, it can calculate the hash of a downloaded artifact and compare the two. A match provides strong evidence that the downloaded bytes are the same bytes represented by the trusted expected value.

That is an integrity test. It does not, by itself, authenticate the person or system that supplied the expected value.

GTIG describes AOMEI Backupper retrieving a configuration file called `down_html.ini`, containing the version number, the MD5 hash of the expected update package and the URL where the client should download it. During the compromise, the attacker raised the version, pointed the URL at a weaponized ZIP archive and supplied the matching MD5 value. [ManageEngine's Threat Analysis Lab](https://www.manageengine.com/threat-analysis-lab/aomei-backupper-supply-chain-compromise.html) reports that neither configuration file is cryptographically authenticated by the client, and that the dropper delivered this way was unsigned, while genuine AOMEI components are signed.

The important distinction is therefore:

- **Integrity:** does the downloaded package match this hash?
- **Authentication:** who supplied the hash the client should trust?
- **Authorization:** was that authenticated party permitted to publish this update for this product and version?

A hash can answer the first question. It cannot answer the other two without an authenticated trust mechanism around it.

## HTTPS authenticated the server connection, not the update decision

The configuration was fetched over HTTPS. That matters, but it solves a different problem. TLS authenticates the server endpoint and protects data in transit against network interception. In this incident, the files were served from AOMEI's own infrastructure; GTIG and ManageEngine both describe the altered content as coming from the vendor's servers rather than being changed in transit.

What can reasonably be inferred is that transport authentication alone was insufficient, because the trust decision occurred above the transport layer. The client effectively trusted:

1. the HTTPS-protected connection to AOMEI infrastructure;
2. the configuration returned by that infrastructure;
3. the package location specified inside that configuration;
4. the checksum specified inside the same configuration.

The second step is where an additional cryptographic authorization boundary would have mattered. GTIG's own recommendations point the same way: clients should verify Authenticode signatures before extraction or execution, and should never rely solely on transport-layer HTTPS or on checksums taken from an unauthenticated configuration file.

## Signed metadata changes the trust model

A stronger update design does not require the delivery server itself to be the ultimate authority over what software is valid. [The Update Framework](https://theupdateframework.io/docs/overview/) (TUF) is one example of a design built around this separation. Its signed metadata identifies trusted keys, target files with their hashes and sizes, version numbers, and expiration dates, and clients verify those signatures before accepting the repository state.

The key property is not simply "use a better hash". Replacing MD5 with SHA-256 would strengthen collision resistance, but it would not solve the trust failure demonstrated here if an attacker could still replace both the package URL and the expected SHA-256 value.

The signer matters. Suppose an update package has digest:

`H(package) = x`

If a compromised server is free to replace both `package` and `x`, the comparison still succeeds. A signature adds a different requirement:

`Verify(public_key, metadata, signature) = valid`

Now the client must establish not just that the downloaded bytes match metadata, but that the metadata itself was authorized by a key it already trusts. That moves the trust root away from possession of the web server.

## Key separation matters after server compromise

Signed updates still require careful key management. If the signing key is stored on the same compromised update server, an attacker may be able to sign malicious metadata as well.

TUF addresses this class of problem through separate roles. Its [root metadata](https://theupdateframework.io/docs/metadata/) specifies trusted keys and signature thresholds, while targets metadata identifies authorized files; snapshot and timestamp metadata add consistency and freshness. The [TUF FAQ](https://theupdateframework.io/docs/faq/) recommends that only the timestamp and snapshot roles use online keys, and that all other roles rely on offline keys.

This does not make compromise impossible. It changes what must be compromised. An attacker who gains control of a distribution server should not automatically gain authority to create a valid software release.

## Design consequences

The AOMEI campaign should not be summarized as "MD5 is weak". MD5 is obsolete for modern cryptographic integrity designs, but no source describes an MD5 collision here. The structural failure was that the same mutable configuration told the client both what to download and what hash to expect. Changing only the hash algorithm would leave that trust relationship intact.

A more resilient software-update architecture should separate:

- transport security from release authorization;
- artifact delivery from artifact identity;
- mutable online infrastructure from higher-value signing authority;
- integrity verification from publisher authentication;
- current server state from historical evidence about what clients actually received.

Software updates are an authentication protocol whether they are described that way or not. The client ultimately needs to answer one precise question: was this exact artifact authorized by a party whose key I already trust for this product?

Everything else is transport.
