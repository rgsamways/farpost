## ADDED Requirements

### Requirement: Mobile renders a sticky navy header with an orange accent line
Below the `xl` breakpoint, the app shell SHALL render a full-width header band with a navy background and an orange bottom accent line, pinned to the top of the viewport while scrolling.

#### Scenario: Header remains visible while scrolling on mobile
- **WHEN** a user scrolls down a page below the `xl` breakpoint
- **THEN** the navy header band with its orange bottom accent line SHALL remain pinned to the top of the viewport

### Requirement: Mobile header brand is plain text, clickable to the homepage
The header SHALL render the FARPOST wordmark and the "Building intelligence for rural Canada" tagline as plain text with no button/pill styling, and the wordmark SHALL link to `/`.

#### Scenario: Brand has no button styling but is clickable
- **WHEN** the mobile header renders
- **THEN** the wordmark and tagline SHALL render without a border, background fill, or button-like padding
- **THEN** clicking the wordmark SHALL navigate to `/`

### Requirement: Mobile header renders three icons in a fixed order
The header SHALL render, left to right: a session-conditional sign-in/profile icon, a hamburger icon that opens the mobile navigation, and a settings icon.

#### Scenario: All three icons render in order
- **WHEN** the mobile header renders
- **THEN** the sign-in/profile icon, the hamburger icon, and the settings icon SHALL appear in that left-to-right order

#### Scenario: Hamburger opens the mobile navigation
- **WHEN** a user taps the hamburger icon
- **THEN** the mobile navigation panel SHALL open

### Requirement: Sign-in icon is session-conditional, defaulting to signed-out
The header SHALL render both a signed-out (sign-in) and a signed-in (profile) icon variant in the DOM, toggled by a `data-signed-in` attribute on the document root, defaulting to the signed-out variant since no auth mechanism exists yet.

#### Scenario: Signed-out variant shows by default
- **WHEN** the mobile header renders and no `data-signed-in` attribute is present on the document root
- **THEN** the sign-in icon (linking to `/sign-in`) SHALL be visible and the profile icon SHALL be hidden

#### Scenario: Signed-in variant shows when the attribute is present
- **WHEN** the `data-signed-in` attribute is present on the document root
- **THEN** the profile icon (linking to `/account`) SHALL be visible and the sign-in icon SHALL be hidden
