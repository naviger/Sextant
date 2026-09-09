# ADR-0007: Development email messaging via MailHog

- Status: Accepted

## Context

The platform includes user and identity workflows that may send emails, such as account-related notifications or invitations. The repository includes a MailHog service in the infrastructure stack for development and testing, rather than connecting directly to a production SMTP provider during local development.

## Decision

We will route outbound email traffic in development to MailHog, leaving production SMTP configuration externalized by environment variables.

## Consequences

- Developers can inspect outgoing mail without a real external mail system.
- Email workflows are easier to test in a local environment.
- Production email configuration remains a separate operational concern.
- The project currently has no production email provider abstraction in the app code itself.

## Evidence from code

- [docker-compose.yml](../../docker-compose.yml) defines a `mailhog` service with ports `1025` (SMTP) and `8025` (web UI).
- The MailHog service is intentionally included for development workflows rather than as a production platform dependency.
- [docs/MAILHOG.md](../MAILHOG.md) documents setup and use of MailHog for development and Keycloak integration.
- [docs/DEPLOYMENT.md](../DEPLOYMENT.md) includes environment variables for external mail or identity configuration, indicating mail is an environment-configured concern.
