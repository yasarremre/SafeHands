# Design System: Neo-Brutalism
**Author:** UI Designer Agent
**Theme**: "Raw Trust"

## 1. Core Philosophy
Functional, high-contrast, honest, and slightly raw. We want to convey "locking" and "security" through heavy borders and distinct geometry.

## 2. Color Palette

| Role | Color | Hex | Usage |
| :--- | :--- | :--- | :--- |
| **Primary (Background)** | White/Off-White | `#F0F0F0` | Main application background. |
| **Surface (Cards)** | White | `#FFFFFF` | Component backgrounds. |
| **Ink (Text/Borders)** | Black | `#000000` | Text, 2px/4px borders, heavy shadows. |
| **Accent (Action)** | Blue | `#2563EB` | Primary buttons, links. |
| **State: Success** | Green | `#16A34A` | Validated, Funds Released. |
| **State: Warning** | Yellow | `#FACC15` | Locked, Pending Action. |

## 3. Typography
-   **Font Family**: Monospace for data (amounts, addresses), Sans-Serif (Inter/Arial) for headers.
-   **Headers**: Uppercase, Bold 900, Tight Tracking.
-   **Body**: Readable, distinct contrast.

## 4. Component Styles

### Buttons
-   **Border**: `2px solid black`.
-   **Shadow**: Hard shadow `4px 4px 0px 0px black`.
-   **Hover**: Translate `2px 2px`, shadow reduces.
-   **Active**: Translate `4px 4px`, no shadow.

### Cards (Escrow Items)
-   **Border**: `2px solid black` or `2px dashed gray` (for inactive).
-   **Corners**: Rounded `8px`.
-   **Spacing**: Loose padding to emphasize structure.

### Inputs
-   **Style**: "Flat" with thick bottom border or full box.
-   **Focus**: Thick outline (Ring).

## 5. Accessibility Checks
-   **Contrast**: Black on White (21:1) passes AAA.
-   **Focus Indicators**: All interactive elements must have visible focus rings.
-   **Labels**: All form inputs must have visible labels.
