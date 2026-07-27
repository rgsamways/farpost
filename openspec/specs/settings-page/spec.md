## Purpose

Real, persisted display/accessibility preferences — font size and reduced motion. Established by `settings-page` (archived 2026-07-26). No theme/dark-mode control — Farpost has no dark palette and no plans for one.

## Requirements

### Requirement: Settings page renders font size and reduced motion controls, and nothing else
The `/settings` page SHALL render a font size control and a reduced motion control. It SHALL NOT render a theme/dark-mode control.

#### Scenario: Both controls render, no theme control exists
- **WHEN** a user visits `/settings`
- **THEN** a font size control and a reduced motion control SHALL both render
- **THEN** no theme or dark-mode control SHALL render anywhere on the page

### Requirement: Font size setting persists and applies globally
Selecting a font size SHALL persist the choice and scale text across the whole site immediately, and SHALL still be in effect after a full page reload on any page.

#### Scenario: Selecting a font size scales text immediately
- **WHEN** a user selects a font size option other than the current one
- **THEN** the site's base font size SHALL update immediately to the selected scale

#### Scenario: Font size persists across reload and across pages
- **WHEN** a user selects a font size, then reloads the page or navigates to a different page
- **THEN** the previously selected font size SHALL still be applied

### Requirement: Reduced motion setting persists, respects the OS preference, and has a real effect
The reduced motion control SHALL offer System, On, and Off. "System" SHALL defer to the OS's reduced-motion preference. The setting SHALL actually disable `DrawerNav`'s mobile slide-in transition and make `PageOutline`'s scroll-to-section instant rather than smooth, when motion should be reduced.

#### Scenario: "On" disables real motion regardless of OS preference
- **WHEN** a user sets reduced motion to "On"
- **THEN** `DrawerNav`'s mobile nav SHALL open/close without a slide transition
- **THEN** `PageOutline`'s scroll-to-section SHALL jump instantly instead of scrolling smoothly

#### Scenario: "System" follows the OS preference
- **WHEN** a user sets reduced motion to "System" and the OS is set to prefer reduced motion
- **THEN** the same effects as "On" SHALL apply

#### Scenario: Reduced motion persists across reload and across pages
- **WHEN** a user sets a reduced motion preference, then reloads the page or navigates to a different page
- **THEN** the previously selected preference SHALL still be applied
