# Permission

## Definition

A permission is a granular authorization unit that gates access to a capability or business action. In the repository, permission logic is implied through role checks and authorization boundaries rather than a dedicated permission table.

## Business Purpose

Permissions let the platform distinguish between read-only access, write access, and administrative control over strategic content. This is important for enterprise governance and secure handling of strategic data.

## Relationships

- Permissions are usually granted by role.
- Permissions permit access to specific strategy actions such as viewing, editing, approving, or recommending.
- A user’s effective permissions are derived from roles in the token claims.

## Source Code Evidence

- [api/app/core/security.py](../../api/app/core/security.py) defines `check_permission(required_role: str)` to gate protected actions.
- [api/app/routes/users.py](../../api/app/routes/users.py) checks if the current user is the same identity or has an `admin` role before updating another user.
- [docs/security-config.md](../security-config.md) describes realm roles and user role mappings.

## Related Concepts

- [Role](./role.md)
- [User](./user.md)
- [Strategy](./strategy.md)
- [Alignment](./alignment.md)
