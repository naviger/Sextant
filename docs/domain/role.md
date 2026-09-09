# Role

## Definition

A role is an authorization grouping assigned to a user. It represents a named bundle of permissions or access expectations that can be enforced at runtime.

## Business Purpose

Roles allow the system to segregate responsibilities and limit access to strategy and organizational information. In the product context, roles preserve the principle of least privilege while enabling business-unit and executive-specific workflows.

## Relationships

- A role is assigned to one or more users.
- A role may grant access to strategy, alignment, or administrative functions.
- The current code maps roles from Keycloak token claims and realm/client resource access.

## Source Code Evidence

- [api/app/core/security.py](../../api/app/core/security.py) extracts `roles` from token claims and assigns them to `User.roles`.
- [docs/security-config.md](../security-config.md) defines roles such as `user` and `admin` for the Keycloak realm.
- [app/src/types/index.ts](../../app/src/types/index.ts) includes `roles: string[]` on the client-side user model.

## Related Concepts

- [User](./user.md)
- [Permission](./permission.md)
- [Alignment](./alignment.md)
- [Strategy](./strategy.md)
