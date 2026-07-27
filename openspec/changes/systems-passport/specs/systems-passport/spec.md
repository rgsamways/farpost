## ADDED Requirements

### Requirement: Owned-buildings listing endpoint
The system SHALL provide `GET /api/buildings`, returning only buildings where the requesting
user has an active `Stake` with `role = 'owner'`. The system SHALL reject unauthenticated
requests with `401`.

#### Scenario: An owner sees their building
- **WHEN** an authenticated user with an active `owner` `Stake` on a building calls
  `GET /api/buildings`
- **THEN** the response includes that building

#### Scenario: A non-owner sees no buildings
- **WHEN** an authenticated user with no `Stake` rows calls `GET /api/buildings`
- **THEN** the response is an empty list

#### Scenario: An unauthenticated request is rejected
- **WHEN** `GET /api/buildings` is called without a valid session
- **THEN** the response is `401`

### Requirement: Building assets (systems) listing endpoint
The system SHALL provide `GET /api/buildings/:buildingId/assets`, returning `Asset` rows where
`subject_type = 'building'` and `subject_id = :buildingId`, only for a requesting user with an
active `owner` `Stake` on that building. The system SHALL reject unauthenticated requests with
`401` and reject requests from a non-owner with `403`.

#### Scenario: An owner lists their building's assets
- **WHEN** an authenticated owner calls `GET /api/buildings/:buildingId/assets` for a building
  they have an active `owner` `Stake` on
- **THEN** the response includes every `Asset` row scoped to that building

#### Scenario: A non-owner is forbidden
- **WHEN** an authenticated user with no active `owner` `Stake` on `:buildingId` calls
  `GET /api/buildings/:buildingId/assets`
- **THEN** the response is `403`

#### Scenario: An unauthenticated request is rejected
- **WHEN** `GET /api/buildings/:buildingId/assets` is called without a valid session
- **THEN** the response is `401`

### Requirement: Add a building asset (system) endpoint
The system SHALL provide `POST /api/buildings/:buildingId/assets`, creating an `Asset` row with
`subject_type = 'building'` and `subject_id = :buildingId`, only for a requesting user with an
active `owner` `Stake` on that building. `assetType` is required; all other `Asset` fields are
optional. The system SHALL reject unauthenticated requests with `401` and reject requests from a
non-owner with `403`.

#### Scenario: An owner adds a system
- **WHEN** an authenticated owner posts `{ assetType: "roof", installedDate: "2015-06-01" }` to
  `POST /api/buildings/:buildingId/assets` for a building they own
- **THEN** a new `Asset` row persists with `subject_type = 'building'`, `subject_id =
  :buildingId`, and the given fields

#### Scenario: A request missing assetType is rejected
- **WHEN** an authenticated owner posts a body without `assetType`
- **THEN** the response is a validation error, not a database error

#### Scenario: A non-owner is forbidden
- **WHEN** an authenticated user with no active `owner` `Stake` on `:buildingId` posts to
  `POST /api/buildings/:buildingId/assets`
- **THEN** the response is `403` and no `Asset` row is created

### Requirement: Update a building asset (system) endpoint
The system SHALL provide `PATCH /api/assets/:assetId`, updating an existing `Asset` row's
fields, only for a requesting user with an active `owner` `Stake` on the asset's real
`subject_type`/`subject_id` (looked up from the existing row, never trusted from the request
body). The system SHALL reject unauthenticated requests with `401`, reject requests from a
non-owner with `403`, and reject requests for a nonexistent asset with `404`.

#### Scenario: An owner updates a system's condition
- **WHEN** an authenticated owner patches `{ conditionStatus: "needs_repair" }` to
  `PATCH /api/assets/:assetId` for an asset belonging to a building they own
- **THEN** the asset's `condition_status` field is updated to `needs_repair`

#### Scenario: A non-owner is forbidden
- **WHEN** an authenticated user with no active `owner` `Stake` on the asset's building patches
  `PATCH /api/assets/:assetId`
- **THEN** the response is `403` and the asset is not modified

#### Scenario: A nonexistent asset returns 404
- **WHEN** `PATCH /api/assets/:assetId` is called with an `assetId` that doesn't exist
- **THEN** the response is `404`
