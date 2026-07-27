## Purpose

Real magic-link authentication, session management, and the `Membership` table that carries Farpost's own identity data. Established by `wire-better-auth` (archived 2026-07-27). No sign-in/account UI yet — see `sign-in-and-account-pages`.

## Requirements

### Requirement: Magic-link sign-in creates an account automatically, with no required pre-signup fields
Requesting a magic link for an email with no existing account SHALL create that account on first successful sign-in, without collecting or requiring any additional data first.

#### Scenario: A new email creates an account on first sign-in
- **WHEN** someone requests a magic link for an email with no existing account, and completes sign-in via that link
- **THEN** a new user account SHALL be created with no additional fields required beforehand

### Requirement: Sessions persist across requests with a sliding expiry
A signed-in session SHALL remain valid across requests for 30 days from last activity, refreshing on use.

#### Scenario: An active session stays valid
- **WHEN** a signed-in user makes a request within 30 days of their last activity
- **THEN** their session SHALL remain valid and its expiry SHALL extend from that activity

### Requirement: Identity data lives on a separate Membership table, not on the user record
Farpost-specific identity data (what platform-wide capability a person holds) SHALL be stored on a `Membership` table referencing the user, not as additional fields on better-auth's own `user` table.

#### Scenario: The user table carries no Farpost-specific fields
- **WHEN** the `user` table's schema is inspected
- **THEN** it SHALL contain only better-auth's own core fields, no Farpost-specific additions

#### Scenario: Membership role is unconstrained text
- **WHEN** a `Membership` row is created
- **THEN** its `role` field SHALL accept any text value, not be restricted to a fixed enum

### Requirement: The Fastify catch-all correctly routes all auth requests
Every request under `/api/auth/*` SHALL be handled by better-auth's own request handler, with CORS headers correctly present despite the response being hijacked from Fastify's normal pipeline.

#### Scenario: An auth request receives a real better-auth response
- **WHEN** a request is made to any path under `/api/auth/*`
- **THEN** better-auth's own handler SHALL process it and return a response

#### Scenario: CORS headers are present on hijacked responses
- **WHEN** a request under `/api/auth/*` is made from the configured web origin
- **THEN** the response SHALL include the correct CORS headers despite bypassing Fastify's normal response pipeline

### Requirement: Client-side session state drives the signed-in DOM attribute
The frontend SHALL set the `data-signed-in` attribute on the document root when a real session exists, and remove it when none exists, reflecting live session state rather than a one-time check.

#### Scenario: Attribute is set when a session exists
- **WHEN** the frontend's session hook reports an active session
- **THEN** `data-signed-in` SHALL be present on the document root

#### Scenario: Attribute is removed when signed out
- **WHEN** the frontend's session hook reports no active session (including after signing out)
- **THEN** `data-signed-in` SHALL be absent from the document root
