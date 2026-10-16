---
title: "When the authorization layer is the crown jewel"
slug: authorization-layer-is-the-crown-jewel
date: "2026-10-04"
category: Vulnerability
summary: "Dell patched two CVSS 10 flaws in Container Storage Modules Authorization, including an authentication bypass and hard-coded token secrets. The score matters less than what the component is allowed to control."
author: Team Vaivoo
status: published
sources:
  - title: "DSA-2026-448: Security update for Dell Container Storage Modules multiple vulnerabilities"
    publisher: Dell
    url: https://www.dell.com/support/kbdoc/en-us/000515771/dsa-2026-448-security-update-for-dell-container-storage-modules-multiple-vulnerabilities
  - title: "Dell asks admins to patch max severity CSM flaws as soon as possible"
    publisher: BleepingComputer
    url: https://www.bleepingcomputer.com/news/security/new-max-severity-dell-csm-flaws-give-hackers-admin-privileges/
origin:
  name: Cypherzoo
  url: https://cypherzoo.com/control-plane-is-crown-jewel/
---

On 1 October Dell disclosed two **CVSS 10.0** vulnerabilities in Container Storage Modules (CSM) **Authorization**, the component that connects Kubernetes environments to Dell enterprise storage (PowerStore, PowerScale, PowerFlex, PowerMax and Unity XT).

## What Dell says

- **CVE-2026-63688** (csm-authorization-storage gRPC server): can expose storage-backend administrator credentials for all registered arrays and give full administrative control over storage infrastructure across all five supported product families.
- **CVE-2026-63692** (authorization proxy and tenant service): an unauthenticated attacker could **bypass authentication** and gain complete administrative control of the authorization service, potentially including storage resources across all tenants.

The same advisory lists more:

- **CVE-2026-54472** (9.8): hard-coded credentials let an unauthenticated remote attacker forge valid administrative tokens. Dell tells customers to upgrade and immediately rotate any JWT signing secrets.
- **CVE-2026-67269** (9.9): a low-privileged attacker can gain root on cluster nodes, potentially every node, through a single custom resource.
- **CVE-2026-67273** (9.6): cluster-wide read access to Kubernetes Secrets and the ability to create cluster-scoped RBAC resources.
- **CVE-2026-61421**: Dell says documentation for the archived karavi-authorization showed `supersecret` as the JWT signing secret next to real token output. The page was later removed without an advisory; deployments that never rotated the secret may still be exposed.

Dell has not said the flaws are exploited in the wild.

## Look at the authority, not the score

A severity score is an abstraction. The useful question is what the component controls when it fails. CSM Authorization sits between two valuable environments, and it issues and checks the tokens that decide who may touch storage. **A small component with authority over large systems is not small infrastructure.**

A security component also does not inherit trust from its purpose. A service built to enforce authorization is not a trustworthy boundary by definition. Hard-coded signing material and a documented default secret are exactly the failures that turn token-based authorization into token-based impersonation.

## What to do

- Upgrade CSM to **1.18.0 or later**; Dell lists no workaround. The advisory's version table is inconsistent, so treat anything below 1.18.0 as affected and watch for revisions.
- **Rotate JWT signing secrets.** If you ever deployed karavi-authorization, confirm `supersecret` is not in use.
- Map the services that can issue or obtain privileged credentials, cross tenant boundaries, or create cluster-wide RBAC. Those are your hidden control planes, whatever their product names.

CVSS tells you how bad a vulnerability can be. Architecture tells you how far the damage can travel.
