---
title: "Accounts end, identity records persist: a lifecycle reading of the DTU breach"
slug: identity-records-outlive-accounts
date: "2026-10-03"
category: Breach
summary: "DTU's identity and access management system held CPR numbers and names for about 160,000 former users back to 2003. The account lifecycle ended; the identity record's did not. That asymmetry is a design choice."
author: Chris War
status: published
sources:
  - title: "Cyberattack on DTU: Notification of a personal data breach"
    publisher: Technical University of Denmark
    url: https://www.dtu.dk/english/newsarchive/2026/10/cyberattack-on-dtu_notification-of-a-personal-data-breach
  - title: "Pseudonymisation techniques and best practices"
    publisher: ENISA
    url: https://www.enisa.europa.eu/publications/pseudonymisation-techniques-and-best-practices
  - title: "General Data Protection Regulation (EU) 2016/679"
    publisher: EUR-Lex
    url: https://eur-lex.europa.eu/eli/reg/2016/679/oj
---

The Technical University of Denmark (DTU) reports that unauthorized persons compromised DTU profiles and used them to gain access to **DTUBasen**, its identity and access management system, and downloaded a large amount of data reaching back to 2003. DTUBasen holds information on about **40,000 active and 160,000 former users**. DTU cannot determine precisely what was downloaded or how many people are affected.

For active users, the data may include CPR number, full name, home address, profile picture, work details and next-of-kin contacts. For former users, DTU states that address, picture and next-of-kin data are deleted automatically after six months, **but CPR numbers and full names remain**.

## Two lifecycles in one system

An identity system manages two different objects that are easy to conflate:

- The **account**: credentials, sessions, entitlements. It has a clear end, when access is revoked.
- The **identity record**: identifiers and attributes that tie the account to a real person. It has no natural end unless one is designed.

DTU's own description shows the asymmetry clearly. Contact attributes have a six-month retention rule after the account ends. The two most identifying attributes have none that is visible in the notice. Four former users exist for every active one, so most of what the attackers could reach belongs to people who no longer use the system at all.

## Why the national identifier is the expensive attribute

A CPR number is a stable, lifelong identifier with a small, structured search space (date of birth plus a four-digit sequence). Combined with a full name it links a record to the person across every other system that uses the same number. DTU itself warns that the data could be used for identity fraud and to make phishing more convincing.

## Engineering options

GDPR does not require every former user's data to be erased on a fixed schedule; retention can be lawful where a legal obligation requires it. Nothing in DTU's notice establishes that keeping these records was unlawful. The engineering question is different: **if a record must be kept, does it have to stay inside the operational identity system?**

Three established patterns reduce what a compromise of the live system exposes:

1. **Separate the archive.** Move former users' identifying attributes to a store that the operational IAM cannot query, with its own access path and keys.
2. **Pseudonymise with a key.** Replace the national identifier in the operational system by a keyed pseudonym. ENISA's guidance on pseudonymisation analyses brute-force and dictionary attacks; for an identifier with roughly 28 bits of structure, an unkeyed hash offers no protection, while a keyed function does as long as the key is held elsewhere.
3. **Make deletion verifiable.** A retention rule that is not tested in production is a statement of intent, not a control.

GDPR's principles of storage limitation (Article 5(1)(e)) and data protection by design (Article 25) point in the same direction; pseudonymisation is defined in Article 4(5).

DTU has reported the incident to the Danish Data Protection Agency and the relevant authorities and is notifying affected people. How the profiles were compromised is not yet public. The lifecycle asymmetry is already visible, and it exists in most identity systems that have been running for twenty years.
