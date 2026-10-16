---
title: "Twenty-three years behind one identity boundary"
slug: identity-data-outlives-users
date: "2026-10-03"
category: Breach
summary: "Attackers used compromised DTU profiles to reach the university's identity and access management system. It held data on about 160,000 former users, going back to 2003. Retention is part of identity security."
author: Team Vaivoo
status: published
sources:
  - title: "Cyberattack on DTU, notification of a personal data breach"
    publisher: Technical University of Denmark
    url: https://www.dtu.dk/english/newsarchive/2026/10/cyberattack-on-dtu_notification-of-a-personal-data-breach
  - title: "The data protection principles"
    publisher: Danish Data Protection Agency
    url: https://www.datatilsynet.dk/english/fundamental-concepts/what-are-your-obligations/the-data-protection-principles
  - title: "Husk sletning (Remember deletion, in Danish)"
    publisher: Danish Data Protection Agency
    url: https://www.datatilsynet.dk/regler-og-vejledning/behandlingssikkerhed/ugens-sikkerhedstip/2024/okt/husk-sletning
  - title: "General Data Protection Regulation (EU) 2016/679"
    publisher: EUR-Lex
    url: https://eur-lex.europa.eu/eli/reg/2016/679/oj
origin:
  name: Cypherzoo
  url: https://cypherzoo.com/identity-data-outlives-users/
---

The Technical University of Denmark (DTU) says attackers compromised DTU profiles and used them to reach **DTUBasen**, its identity and access management system, and downloaded a large amount of data. The system holds information on about **40,000 active and 160,000 former users**, with personal data going back to 2003. DTU cannot yet say exactly what was downloaded or how many people are affected.

For former users, DTU says home addresses, profile pictures and next-of-kin details are deleted automatically after six months. CPR numbers and full names remain.

## The question after "how did they get in"

The investigation may explain the initial access. A second question does not need to wait: **why was two decades of identity data still behind this boundary?**

GDPR does not require every former user's data to vanish after a fixed period, and Article 17(3) allows retention where, for example, the law requires it. Nothing in DTU's notice shows that keeping these records was unlawful. But the Danish Data Protection Agency states the storage-limitation principle plainly: data that no longer need to be processed must be anonymized or deleted. In its guidance on deletion it adds that keeping data you no longer need creates unnecessary risk, because those records can end up in a breach.

## Old identity data, today's obligations

Storing personal data is itself processing under GDPR (Article 4(2)). If an organization decides it still needs identity data collected years ago, it is responsible for protecting it under today's threats and today's controls, not the assumptions of the year it was collected.

That does not mean every historical record needs an active login with MFA. Many former users have no account at all. It means asking whether the data must sit **in the same system, behind the same access paths and inside the same blast radius** as active identities. An archive kept for a legitimate reason does not have to be part of the operational identity system.

## Questions for whoever owns the identity environment

- What historical data have we inherited, and what purpose does each category still serve?
- Which records are under a legal retention requirement, and when was that last reviewed?
- Why are historical records reachable through the same identity system as active users?
- Are deletion routines technically verified, or only written as policy?
- What would happen if this identity boundary failed?

DTU has reported the incident to the Data Protection Agency and the relevant authorities, and is notifying current and former staff and students. The technical explanation may turn out to be complicated. The principle is not: **if you keep someone's identity data, you keep the responsibility for protecting it.**
