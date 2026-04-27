## ADDED Requirements

### Requirement: Modern Monster Hunter themed design system
The app SHALL use a CSS Custom Properties design system with distinct light and dark token sets that reflect Monster Hunter game aesthetics — bright, readable in light mode; immersive and atmospheric in dark mode.

#### Scenario: Light mode renders bright theme
- **WHEN** the app is in light mode
- **THEN** the background SHALL use a light color (≥ #F0F0F0 luminance range)
- **AND** primary accent SHALL reference Monster Hunter gold/amber tones
- **AND** all cards SHALL be visually distinct from the page background

#### Scenario: Dark mode renders MH atmospheric theme
- **WHEN** the app is in dark mode
- **THEN** the background SHALL be deep and dark (matching the original MH dark aesthetic)
- **AND** primary accent SHALL glow/stand out against the dark background

### Requirement: Theme toggle button in header
The app header SHALL include a visible toggle button for switching between light and dark modes.

#### Scenario: Toggle button visible
- **WHEN** any page is rendered
- **THEN** a theme toggle button SHALL be visible in the top-right area of the header
- **AND** the button SHALL display a sun icon in dark mode and a moon icon in light mode
- **AND** the button SHALL have an aria-label describing its action

#### Scenario: Toggle button accessible
- **WHEN** a keyboard user focuses the toggle button
- **THEN** a visible focus ring SHALL be displayed around the button

### Requirement: Mobile-first responsive layout preserved
The app SHALL maintain its mobile-first single-column layout with max-width constraint.

#### Scenario: Layout on mobile viewport
- **WHEN** the app is viewed at 375px width
- **THEN** no horizontal scroll SHALL occur
- **AND** the bottom navigation SHALL remain fixed and accessible
- **AND** content SHALL not be hidden behind the fixed header or bottom nav

### Requirement: Rarity and element colors preserved
The 9-tier rarity color system and 8 element type colors SHALL be preserved across both themes, with adjustments only for WCAG compliance where needed.

#### Scenario: Rarity colors visible in light mode
- **WHEN** the app is in light mode and equipment cards are shown
- **THEN** each rarity tier SHALL display its distinct color
- **AND** rarity indicators SHALL have sufficient contrast against card backgrounds (≥ 3:1 for non-text UI components)

#### Scenario: Element type colors visible in both modes
- **WHEN** element badges or indicators are shown in either mode
- **THEN** fire/water/thunder/ice/dragon/poison/paralysis/sleep/blast colors SHALL be visually distinct from each other
