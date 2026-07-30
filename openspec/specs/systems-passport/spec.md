# systems-passport

## Purpose
Farpost's first real end-to-end feature: an owner can view and maintain a list of their
building's tracked systems (`Asset` rows) — roof, furnace, water heater, etc. Establishes two
reusable patterns every future owner-scoped feature builds on: a session-auth helper
(`getSessionUser`, ported from Vocare's real pattern) and an owner-authorization check
(`assertBuildingOwner`).

## Requirements

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

### Requirement: Tracked-systems page surfaces every generic Asset field
The Systems Passport page SHALL render every generic `Asset` field as an editable form control
for each tracked system on the selected building: `label`, `manufacturer`, `model`,
`serialNumber`, `location`, `installedDate`, `lastServicedDate`, `warrantyExpiryDate`,
`conditionStatus`, `conditionNotes`, and `photoUrls`. Date fields SHALL use a segmented
month/day/year input rather than a native date picker or free-text field. An edit to any field
SHALL persist via `PATCH /api/assets/:assetId` and reflect the server's saved value after a page
reload.

#### Scenario: Editing a text field persists after reload
- **WHEN** an owner edits a tracked system's `manufacturer` field and the input loses focus
- **THEN** the change is saved via `PATCH /api/assets/:assetId`, and reloading the page shows the
  new value

#### Scenario: Editing a date field via segmented input persists after reload
- **WHEN** an owner enters a complete, valid month/day/year into a date field's segmented input
- **THEN** the change is saved via `PATCH /api/assets/:assetId` as an ISO date, and reloading the
  page shows the same date populated back into the segmented input

#### Scenario: An incomplete date does not save
- **WHEN** an owner has typed only some of a date field's month/day/year segments
- **THEN** no `PATCH` request is sent until the date is either completed to a valid date or all
  segments are cleared
