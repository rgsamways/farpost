## Purpose

The laptop/desktop page framing every Farpost page renders inside: a full-width sticky brand header, a tiered left navigation, a center content column, and a right rail with an auto-generated in-page anchor outline. Established by `scaffold-desktop-framing` (archived 2026-07-26). Mobile framing is a separate, later capability.

## Requirements

### Requirement: Full-width sticky brand header
The desktop app shell SHALL render a full-width header band, pinned to the top of the viewport while scrolling, containing the FARPOST wordmark and a tagline line.

#### Scenario: Header remains visible while scrolling
- **WHEN** a user scrolls down a page at the desktop (`xl`) breakpoint
- **THEN** the brand header band SHALL remain pinned to the top of the viewport

### Requirement: Header brand aligns with the left nav column
The header's wordmark SHALL be horizontally aligned with the left edge of the left navigation column's content below it, using the same column-width value as the navigation column rather than an independently maintained offset.

#### Scenario: Wordmark left edge matches nav column left edge
- **WHEN** the desktop app shell renders at the `xl` breakpoint
- **THEN** the left edge of the FARPOST wordmark SHALL align with the left edge of the left navigation column's content

### Requirement: Header icons align with the right rail column
The header SHALL render a settings icon and a sign-in/account icon, left-aligned to the left edge of the right rail column's content below it.

#### Scenario: Icon cluster left edge matches right rail's left edge
- **WHEN** the desktop app shell renders at the `xl` breakpoint
- **THEN** the left edge of the header's icon cluster SHALL align with the left edge of the right rail's PageOutline content

### Requirement: Right rail renders at a fixed width
The right rail column SHALL render at a fixed width regardless of the length of its in-page anchor nav content, so anchor text wraps within the column instead of expanding it.

#### Scenario: Long anchor labels wrap instead of widening the rail
- **WHEN** a page's PageOutline contains an anchor label longer than the rail's fixed width
- **THEN** the label SHALL wrap onto multiple lines
- **THEN** the right rail's width SHALL remain unchanged

### Requirement: Left nav omits a redundant brand label
The left navigation column SHALL NOT render its own separate "Farpost" text label, since the header band already carries the brand.

#### Scenario: Nav starts directly with its first group
- **WHEN** the desktop app shell renders
- **THEN** the left navigation column's first visible element SHALL be the "Platform" group heading, not a "Farpost" label

### Requirement: Left nav presents Farpost's real navigation structure
The left navigation SHALL present three groups: Platform (Dashboard; Jobs, with Open/In Progress/Completed children; Buildings), Network (Professionals; Requests), and Account (Billing; Team).

#### Scenario: All three groups and their links render
- **WHEN** the desktop app shell renders
- **THEN** the left navigation SHALL show the Platform, Network, and Account groups with their specified links and children

### Requirement: Center column renders a sticky per-page header and scannable sections
The center content column SHALL render a sticky page header above its content, and SHALL support `SectionHeader`-marked sections that are automatically listed in the right rail's PageOutline.

#### Scenario: A page with two or more sections shows an outline
- **WHEN** a center-column page renders two or more `SectionHeader` sections
- **THEN** the right rail SHALL display an "On this page" outline listing each section

#### Scenario: A page with fewer than two sections shows no outline
- **WHEN** a center-column page renders fewer than two `SectionHeader` sections
- **THEN** the right rail SHALL render no outline content

### Requirement: Desktop header sign-in icon is session-conditional
The desktop (`xl:`) header's icon cluster SHALL render both a signed-out (sign-in) and a signed-in (profile) icon variant, toggled by the same `data-signed-in` document-root attribute the mobile header already uses, rather than a single static sign-in link.

#### Scenario: Signed-out variant shows by default on desktop
- **WHEN** the desktop header renders and no `data-signed-in` attribute is present on the document root
- **THEN** the sign-in icon (linking to `/sign-in`) SHALL be visible and the profile icon SHALL be hidden

#### Scenario: Signed-in variant shows on desktop when the attribute is present
- **WHEN** the `data-signed-in` attribute is present on the document root
- **THEN** the profile icon (linking to `/account`) SHALL be visible and the sign-in icon SHALL be hidden

### Requirement: Shell uses Farpost's confirmed brand tokens and font
The desktop app shell SHALL use the brand color tokens from `docs/archives/farpost-brand-tokens.md` (navy `#16243D`, signal orange `#E8743B`, off-white `#F3F1EC`, slate gray `#6B7280`) and Inter as the sole sans-serif font, with a monospace variable reserved for small metadata text only.

#### Scenario: Header and nav render with the confirmed palette and font
- **WHEN** the desktop app shell renders
- **THEN** the header band's background SHALL be the confirmed navy token and its accent rule SHALL be the confirmed orange token
- **THEN** body and UI text SHALL render in Inter
