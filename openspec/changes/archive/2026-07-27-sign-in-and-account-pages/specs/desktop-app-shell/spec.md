## ADDED Requirements

### Requirement: Desktop header sign-in icon is session-conditional
The desktop (`xl:`) header's icon cluster SHALL render both a signed-out (sign-in) and a signed-in (profile) icon variant, toggled by the same `data-signed-in` document-root attribute the mobile header already uses, rather than a single static sign-in link.

#### Scenario: Signed-out variant shows by default on desktop
- **WHEN** the desktop header renders and no `data-signed-in` attribute is present on the document root
- **THEN** the sign-in icon (linking to `/sign-in`) SHALL be visible and the profile icon SHALL be hidden

#### Scenario: Signed-in variant shows on desktop when the attribute is present
- **WHEN** the `data-signed-in` attribute is present on the document root
- **THEN** the profile icon (linking to `/account`) SHALL be visible and the sign-in icon SHALL be hidden
