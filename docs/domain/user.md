# User

## Definition

A user is an authenticated identity with a profile, access rights, and account state. In this repository, the user is represented as an identity subject that is validated by Keycloak and mapped into an application `User` model.

## Business Purpose

Users are the actors who access the platform, view strategy information, and participate in role-based decision workflows. They are the entry point for the platform’s authorization model and the principal used to enforce access control.

## Relationships

- A user may have many roles.
- A user may belong to an organization or a business unit in a broader enterprise model.
- A user may be allowed to view or modify strategy-related data according to roles and permissions.
- In the current code, a user is associated with `id`, `username`, `email`, and `roles`.

## Source Code Evidence

- [api/app/core/security.py](../../api/app/core/security.py) defines the `User` model with `id`, `username`, `email`, `first_name`, `last_name`, `roles`, and `is_active`.
- [api/app/routes/users.py](../../api/app/routes/users.py) exposes endpoints such as `/api/v1/users/me` and `/api/v1/users/{user_id}`.
- [app/src/types/index.ts](../../app/src/types/index.ts) defines the front-end representation of a user.
- [docs/security-config.md](../security-config.md) documents realm users and roles.

## Related Concepts

- [Role](./role.md)
- [Permission](./permission.md)
- [Strategy](./strategy.md)
- [BusinessUnitStrategy](./business-unit-strategy.md)
- [Alignment](./alignment.md)
