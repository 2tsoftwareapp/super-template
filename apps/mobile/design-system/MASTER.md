# Design System — Super Template Mobile

> **Source of Truth** for the Flutter mobile application.
> Every screen and component must follow these rules.
> Page-specific overrides live in `design-system/pages/`.

---

## 1. Brand Identity

| Property | Value |
|----------|-------|
| Product | Super Template |
| Style | Micro-interactions + Flat Material 3 |
| Personality | Professional, Modern, Clean, Trustworthy |
| Mood | Focused productivity tool with polished feel |

---

## 2. Color System

### Primary Palette

| Token | Light | Dark | Notes |
|-------|-------|------|-------|
| `primary` | `#4F46E5` (indigo-600) | `#6366F1` (indigo-500) | CTAs, interactive |
| `primaryContainer` | `#EEF2FF` (indigo-50) | `#312E81` (indigo-900) | Chip/badge bg |
| `onPrimary` | `#FFFFFF` | `#FFFFFF` | Text on primary |
| `secondary` | `#0891B2` (cyan-600) | `#22D3EE` (cyan-400) | Accents |
| `accent` | `#059669` (emerald-600) | `#34D399` (emerald-400) | Success |
| `error` | `#DC2626` (red-600) | `#F87171` (red-400) | Errors |

### Surface & Background

| Token | Light | Dark |
|-------|-------|------|
| `background` | `#F8FAFC` (slate-50) | `#0F172A` (slate-900) |
| `surface` | `#FFFFFF` | `#1E293B` (slate-800) |
| `surfaceContainer` | `#F1F5F9` (slate-100) | `#293548` |
| `surfaceContainerHigh` | `#E2E8F0` (slate-200) | `#334155` (slate-700) |

### Text

| Token | Light | Dark |
|-------|-------|------|
| `onSurface` | `#1E293B` (slate-800) | `#E2E8F0` (slate-200) |
| `onSurfaceVariant` (muted) | `#64748B` (slate-500) | `#94A3B8` (slate-400) |

### Feature Card Accent Colours

```dart
cardProjects     = #4F46E5  // indigo
cardNotifications = #0891B2 // cyan
cardProfile      = #059669  // emerald
cardOrganizations = #F59E0B // amber
cardSecurity     = #DC2626  // red
cardSessions     = #7C3AED  // violet
cardPreferences  = #0EA5E9  // sky
cardImports      = #16A34A  // green
cardExports      = #9333EA  // purple
cardAdmin        = #EA580C  // orange
```

---

## 3. Typography

All styles are defined in `buildTextTheme()` inside `lib/app/theme.dart`.

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| `headlineLarge` | 32 | 700 | 1.25 | Page titles, auth |
| `headlineMedium` | 28 | 700 | 1.30 | Section titles |
| `headlineSmall` | 24 | 600 | 1.30 | Card titles |
| `titleLarge` | 20 | 700 | 1.40 | AppBar |
| `titleMedium` | 16 | 600 | 1.50 | List headers |
| `titleSmall` | 14 | 600 | 1.50 | Section labels |
| `bodyLarge` | 16 | 400 | 1.60 | Primary body |
| `bodyMedium` | 14 | 400 | 1.60 | Secondary body |
| `bodySmall` | 12 | 400 | 1.50 | Helper text, captions |
| `labelLarge` | 14 | 600 | — | Button text |
| `labelMedium` | 12 | 500 | — | Chips, badges |
| `labelSmall` | 11 | 500 | — | Section headers (uppercase) |

**Rules:**
- Minimum body text: **14px** (mobile)
- Section headers shown in UPPERCASE with `letterSpacing: 0.5`
- Letter spacing: negative for headings (-0.2 to -0.5), zero for body

---

## 4. Spacing

Import: `package:mobile_app/core/design/app_spacing.dart`

| Token | Value | Usage |
|-------|-------|-------|
| `xxs` | 2dp | Tightest gaps |
| `xs` | 4dp | Icon padding |
| `sm` | 8dp | Inline gaps |
| `md` | 12dp | Small padding |
| `base` | 16dp | Screen horizontal padding |
| `lg` | 20dp | Section gaps |
| `xl` | 24dp | Card/screen vertical |
| `xxl` | 32dp | Between sections |
| `xxxl` | 40dp | Large sections |
| `huge` | 48dp | Hero spacing |
| `massive` | 64dp | Bottom scroll padding |

**Rules:**
- Screen horizontal padding: **16dp** (`AppSpacing.base`)
- Inter-card gap: **12dp** (`AppSpacing.md`)
- Section label to first item: **12dp**
- Between sections: **24–32dp**

---

## 5. Border Radius

Import: `package:mobile_app/core/design/app_radius.dart`

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4dp | Chips, tags |
| `sm` | 8dp | Small buttons, helper text |
| `md` | 12dp | Input fields, buttons, small cards |
| `lg` | 16dp | Cards, tiles, feature grid items |
| `xl` | 20dp | Large profile cards |
| `xxl` | 24dp | Dialogs, sheets |
| `full` | 9999dp | Badges, avatars, pills |

---

## 6. Elevation & Shadow

| Level | Usage | Shadow value |
|-------|-------|------|
| 0 | Flat — surface cards with border | `none` |
| 1 | Floating action (scroll under) | `AppColors.shadowSm` |
| 2 | Modals, dialogs | `AppColors.shadowMd` |
| 3 | Brand/hero elements | `AppColors.shadowLg` |

**Rule:** Prefer **borders over shadows** for cards. Use shadows only for brand identity elements (logo, CTAs).

---

## 7. Component Specifications

### Buttons

```
FilledButton   → full-width, 52px height, 12dp radius, 600 weight
OutlinedButton → full-width, 52px height, 12dp radius, 500 weight
TextButton     → auto-width, label 14px 500 weight
```

- Disabled state: `opacity 0.38` (handled by Material3)
- Loading state: replace label with `20×20 CircularProgressIndicator(strokeWidth: 2)`

### Input Fields

```
Style: Filled (gray background, outlined border on focus)
Height: auto (contentPadding vertical: 12dp)
Radius: 12dp
Prefix icon: required for auth fields
Error placement: below field
Focus border: 2px primary color
```

### Cards

```
Border: 1px outlineVariant
Radius: 16dp
Elevation: 0
Padding: 16dp
Background: surface (light) / surfaceContainerDark (dark)
```

### Avatar

```
Shape: Circle
Size: 40dp (default), 52dp (profile card), 80dp (profile screen)
Background: primaryContainer
Foreground: primary
Initials: first letter of first + last name
```

### Section Headers

```
Text: UPPERCASE, labelSmall, onSurfaceVariant
Padding: 16dp horizontal
Margin: 12dp top from previous section
```

---

## 8. Navigation

- **Primary navigation**: `go_router` with path-based routing
- **Back button**: `Icons.arrow_back_ios_new_rounded`
- **Bottom padding**: Always add `AppSpacing.massive` (64dp) at the bottom of scrollable content

---

## 9. Icons

- **Library**: Material Icons (`Icons.*_rounded` variants preferred)
- **Size**: 20dp in cards, 24dp in AppBar/tabs, 28dp in feature icons
- **Style**: Rounded (`_rounded` suffix) for consistency
- **No emojis** as structural icons

---

## 10. Motion & Animation

| Interaction | Duration | Curve |
|------------|----------|-------|
| Micro (tap feedback) | 80–150ms | `Curves.easeOut` |
| Screen entrance | 300ms | `Curves.easeOut` |
| Scale on press | 150ms → 100ms | `Curves.easeOutBack` |
| Skeleton shimmer | 1200ms repeat | `Curves.easeInOut` |
| Splash logo | 800ms | `Curves.easeOutBack` |

**Rules:**
- All animations: `150–400ms` range
- Use `transform/opacity` only (never `height/width`)
- Respect `MediaQuery.of(context).disableAnimations`

---

## 11. Accessibility

- Touch targets: minimum **44×44dp**
- Semantic labels on all interactive icon-only widgets (`tooltip` or `Semantics`)
- Contrast: primary text ≥ 4.5:1, secondary text ≥ 3:1
- Error state always paired with icon (not color alone)

---

## 12. Dark Mode Rules

- Never invert colors — use the dark `ColorScheme` token variants
- Surface hierarchy: `background → surface → surfaceContainer → surfaceContainerHigh`
- Feature card icon backgrounds: `color.withOpacity(0.10)` in both modes
- Profile card gradient: lighter in light mode, very subtle in dark mode
- All border widths remain 1dp in both modes

---

## 13. File Structure

```
lib/
├── app/
│   └── theme.dart              # ThemeData builders + themeModeProvider
├── core/
│   ├── design/
│   │   ├── app_colors.dart     # Color tokens
│   │   ├── app_spacing.dart    # Spacing tokens
│   │   └── app_radius.dart     # Border radius tokens
│   └── widgets/
│       ├── app_avatar.dart     # User initials avatar
│       ├── app_section_header.dart  # Section label
│       ├── state_views.dart    # CenterMessage, SkeletonBox, AppErrorView
│       └── async_screen_body.dart   # AsyncValue wrapper
└── features/
    └── <feature>/
        └── presentation/
            └── <screen>.dart
```

---

*Last updated: 2026-06-27*
