## ADDED Requirements

### Requirement: Sign-in page requests a magic link, no separate signup exists
The `/sign-in` page SHALL render a single email field and request a magic link via the real auth client on submit. No separate signup page or flow SHALL exist.

#### Scenario: Requesting a magic link
- **WHEN** a user enters a valid email on `/sign-in` and submits
- **THEN** a magic-link sign-in request SHALL be sent for that email and the page SHALL indicate the link was sent

#### Scenario: Already signed in redirects away from sign-in
- **WHEN** a user with an active session visits `/sign-in`
- **THEN** they SHALL be redirected to `/account`

### Requirement: Account page shows the signed-in user and allows sign-out
The `/account` page SHALL display the signed-in user's email and a control that ends their session.

#### Scenario: Signed-in user sees their email and can sign out
- **WHEN** a signed-in user visits `/account`
- **THEN** their email SHALL be displayed
- **THEN** activating the sign-out control SHALL end their session

#### Scenario: Signed-out visitor is redirected away from account
- **WHEN** a user with no active session visits `/account`
- **THEN** they SHALL be redirected to `/sign-in`
