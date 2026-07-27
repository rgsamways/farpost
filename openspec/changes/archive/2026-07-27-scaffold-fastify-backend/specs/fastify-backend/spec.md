## ADDED Requirements

### Requirement: Fastify server starts and serves requests
The backend SHALL start a Fastify HTTP server listening on a configurable port, built via a testable factory function that does not require a real network listener to be exercised in tests.

#### Scenario: Server starts and responds to a request
- **WHEN** the backend process starts with a valid configuration
- **THEN** it SHALL listen on the configured port and respond to HTTP requests

### Requirement: Health check verifies real database connectivity
The `/health` route SHALL perform a real query against the configured Postgres database and report whether that connection succeeded, not just that the HTTP process is running.

#### Scenario: Health check succeeds when the database is reachable
- **WHEN** a client requests `GET /health` and the configured Postgres database is reachable
- **THEN** the response SHALL indicate both the server and the database are healthy

#### Scenario: Health check reflects a real database failure
- **WHEN** a client requests `GET /health` and the configured Postgres database is not reachable
- **THEN** the response SHALL indicate the database is not connected, rather than reporting healthy

### Requirement: Local Postgres runs via Docker Compose on an isolated port
The backend's local development database SHALL run via Docker Compose, on a host port that does not collide with any other Postgres instance already used by another project on the same machine.

#### Scenario: Docker Compose starts a usable Postgres instance
- **WHEN** `docker compose up` is run in `api/`
- **THEN** a Postgres instance SHALL become available on its configured, dedicated port

### Requirement: Migration tooling works end-to-end
Drizzle's migration generation and application SHALL work against the real local Postgres instance, producing committed migration files rather than syncing schema directly.

#### Scenario: Generating and applying a migration succeeds
- **WHEN** a schema change is made and a migration is generated
- **THEN** the generated migration SHALL apply cleanly against the local Postgres instance

### Requirement: CORS is scoped to the configured web origin
The backend SHALL echo only the configured frontend origin in its CORS response header, never a requesting origin that doesn't match it — the mechanism by which a browser rejects a cross-origin request from anywhere else.

#### Scenario: Configured origin is allowed
- **WHEN** a request arrives with an `Origin` header matching the configured web URL
- **THEN** the backend's CORS response header SHALL equal that configured web URL

#### Scenario: Unconfigured origin is not allowed
- **WHEN** a request arrives with an `Origin` header that does not match the configured web URL
- **THEN** the backend's CORS response header SHALL NOT equal that requesting origin, since it always reflects only the configured value
