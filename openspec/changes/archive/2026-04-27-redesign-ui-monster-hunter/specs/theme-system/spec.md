## ADDED Requirements

### Requirement: Light/dark mode toggle
The system SHALL support switching between light and dark color modes. The active mode SHALL be persisted across page reloads using a cookie named `mhn-theme`.

#### Scenario: Default to light mode on first visit
- **WHEN** a user visits the app for the first time (no `mhn-theme` cookie)
- **THEN** the app SHALL display in light mode

#### Scenario: Respect prefers-color-scheme on first visit
- **WHEN** a user visits for the first time AND their OS is set to dark mode (`prefers-color-scheme: dark`)
- **THEN** the app SHALL default to dark mode

#### Scenario: Toggle to dark mode
- **WHEN** user taps the theme toggle button in the header
- **THEN** the `<html>` element SHALL have `class="dark"` added
- **AND** the UI SHALL immediately update to dark colors
- **AND** the `mhn-theme` cookie SHALL be set to `"dark"`

#### Scenario: Toggle back to light mode
- **WHEN** user taps the theme toggle button again while in dark mode
- **THEN** the `class="dark"` SHALL be removed from `<html>`
- **AND** the `mhn-theme` cookie SHALL be set to `"light"`

#### Scenario: Persist preference across reload
- **WHEN** user reloads the page
- **THEN** the app SHALL restore the previously selected theme from the `mhn-theme` cookie

### Requirement: WCAG 2.2 AA color contrast compliance
All text and interactive elements SHALL meet WCAG 2.2 Level AA contrast requirements.

#### Scenario: Normal text contrast in light mode
- **WHEN** the app is in light mode
- **THEN** all body text SHALL have a contrast ratio of at least 4.5:1 against its background

#### Scenario: Normal text contrast in dark mode
- **WHEN** the app is in dark mode
- **THEN** all body text SHALL have a contrast ratio of at least 4.5:1 against its background

#### Scenario: Touch target size
- **WHEN** any interactive element (button, link, nav tab) is rendered
- **THEN** its minimum touch target SHALL be 44×44px

### Requirement: Reduced motion support
The system SHALL respect the user's `prefers-reduced-motion` setting.

#### Scenario: Animations disabled for reduced-motion users
- **WHEN** the user has `prefers-reduced-motion: reduce` set
- **THEN** all CSS transitions and animations SHALL be disabled or minimized
