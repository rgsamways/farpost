## ADDED Requirements

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
