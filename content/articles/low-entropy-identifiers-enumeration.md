---
title: "Ten digits, about 28 bits: why national identity numbers enumerate"
slug: low-entropy-identifiers-enumeration
date: "2026-10-06"
category: Breach
summary: "Denmark's CPR register reports data on about 8.8 million people obtained through automated lookups made via a company's lawful access. The structure of the CPR number explains why lookup access behaves like an oracle."
author: Chris War
status: published
sources:
  - title: "Omfattende uautoriseret adgang til borgeres CPR-oplysninger (in Danish)"
    publisher: CPR-administrationen
    url: https://www.cpr.dk/cpr-nyt/nyhedsarkiv/2026/okt/omfattende-uautoriseret-adgang-til-borgeres-cpr-oplysninger
  - title: "Datatilsynet er opmærksom på sag om opslag i CPR (in Danish)"
    publisher: Datatilsynet
    url: https://www.datatilsynet.dk/presse-og-nyheder/nyhedsarkiv/2026/okt/datatilsynet-er-opmaerksom-paa-sag-om-opslag-i-cpr
  - title: "Opbygning af CPR-nummeret (in Danish)"
    publisher: CPR-administrationen
    url: https://cpr.dk/cpr-systemet/opbygning-af-cpr-nummeret
---

The Danish CPR administration reports that unauthorized parties, by misusing a Danish company's lawful access to search the CPR system, obtained names, addresses, CPR numbers and more for about **8.8 million registered persons**. Persons registered with name and address protection were not included. The company's access has been stopped, and police and authorities are investigating. The Danish Data Protection Agency says the notification it received described a very large number of **automated lookups made to identify valid CPR numbers**.

The authorities have not said how the company's access came under unauthorized control. What can be analysed now is why lookup access was sufficient.

## The search space

The CPR administration documents the structure: positions 1–6 are the date of birth (day, month, two-digit year), positions 7–10 a sequence number. Digits 5–7 together encode the century, and the tenth digit encodes legal sex. Until 1 October 2007 all numbers satisfied a modulus-11 check; numbers issued since then need not.

That gives a simple estimate (my calculation, not an official figure):

- About 36,500 possible birth dates in a century, times 10,000 sequence numbers, is about 3.7 × 10⁸ candidate strings, or **≈ 28.4 bits**.
- 8.8 million registered persons is ≈ 2²³, so roughly **one candidate in 40** corresponds to a real person.
- For a person whose birth date is known, the remaining uncertainty is the sequence number: at most 10⁴ values, ≈ 13 bits, and about 12 bits if sex is known.

Twelve bits is not a secret. It is a short loop.

## Identifier, not authenticator

None of this was hidden; the CPR number was designed as a stable, human-transcribable **identifier**. The difficulty arises when systems treat possession of an identifier as evidence of anything, or expose an interface that answers *"is this number valid, and who is it?"* at machine speed.

An interface of that kind is, in cryptographic terms, a **membership oracle** over a 28-bit space. The relevant security parameter is not the length of the number but the number of oracle queries an adversary can make. Authenticating the caller fixes *who* asks; it does not change *how much information each answer leaks* or *how many answers there may be*.

## Design consequences

For any register keyed by a structured national identifier:

- Model the lookup interface as an oracle and give each client an explicit **query budget** derived from its documented purpose, in queries per day and per identifier prefix (for example per birth date).
- Treat **sequential or prefix-complete access patterns** as protocol violations, not as unusual load.
- Never derive pseudonyms by **unkeyed hashing** of such identifiers. With a 28-bit pre-image space, a dictionary of all hashes takes well under a second to build on commodity hardware. If a pseudonym is needed, use a keyed function (for example HMAC with a protected key) or a lookup table held by a separate party.
- Never use the identifier, or knowledge of it, as an authentication factor.

The Danish authorities have ordered a review and the investigation is open. The structural lesson does not depend on its outcome: when the identifier space is small, **access control on the oracle is the confidentiality mechanism**, and it has to be engineered as one.
