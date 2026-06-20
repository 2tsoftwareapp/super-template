# Web Fidelity Checklist

Use this checklist whenever the task is about web UI quality, component polish, CSS regressions, or design-system fidelity.

This is for issues like:

- badge border is square instead of rounded
- button radius does not match the rest of the system
- border color looks wrong
- card padding is off by a small but visible amount
- a component looks partly unstyled or falls back to browser-default CSS

## Mindset

Do not dismiss "small" visual mismatches.

If a primitive component is wrong, the bug is structural:

- the wrong token may be applied
- the component variant may be broken
- a CSS layer may not be loading
- a global reset or theme variable may be missing

These are often more important than a one-off copy issue because they replicate across the product.

## Minimum evidence

Collect all of these before concluding a component is correct:

1. a screenshot of the exact component
2. a nearby comparison component or section from the same page
3. the accessibility snapshot for structure only
4. the source component or CSS/token source if anything looks suspicious

## Visual checks

### Radius

Check:

1. badges and pills should read visually rounded, not clipped or square
2. buttons of the same family should share the same corner language
3. cards, inputs, dialogs, and dropdowns should follow a consistent radius scale
4. inner elements should not accidentally have sharper corners than their container unless intentional

Suspicious signs:

- one badge looks rectangular while another looks pill-like
- the border follows a square box but the design language is rounded everywhere else
- corners look like raw browser default rendering

Likely causes:

- missing `rounded-*` class
- wrong variant class
- design token like `--radius` not applied
- CSS layer ordering issue

### Border

Check:

1. border thickness is consistent across comparable primitives
2. border color matches the semantic token used by the design system
3. border opacity is not stronger or weaker than siblings without reason
4. focus ring is separate from border and not confused with it

Suspicious signs:

- one primitive has a black or dark-gray browser-looking border
- a single component has a crisp square outline while neighbors use soft tokenized borders
- border color shifts between nearby components that should share the same variant

Likely causes:

- missing `border-border` or equivalent semantic token
- fallback UA styles winning
- CSS variable not defined in the current theme scope

### Spacing

Check:

1. horizontal padding inside buttons, badges, chips, and inputs
2. vertical rhythm between label, helper text, and control
3. gap consistency across repeated cards or stats
4. alignment between icon and text baselines

Suspicious signs:

- one component feels cramped while siblings breathe correctly
- text touches border visually even if it does not technically overlap
- icon/text gap differs between same-variant components

Likely causes:

- wrong size variant
- padding utility dropped during refactor
- font size changed without compensating line-height/padding

### Color and surface

Check:

1. background color matches the expected semantic surface
2. foreground color matches component intent
3. muted, accent, destructive, and outline variants feel consistent
4. hover/active/focus states do not revert to raw browser colors

Suspicious signs:

- component looks "unstyled" or generic HTML
- one badge variant has the wrong fill or border tint
- hover state jumps to blue/gray browser-default styling

Likely causes:

- variant class map broken
- CSS variable missing
- theme provider or global stylesheet not loaded

### Typography and icon balance

Check:

1. text size/weight is appropriate for the primitive
2. uppercase, tracking, and line-height match sibling primitives
3. icon size and stroke weight feel balanced with text

Suspicious signs:

- badge text looks too large for its container
- icon appears misaligned or too heavy
- line-height makes the component look taller or flatter than siblings

## Shadcn-style primitive pass

When the repo uses shadcn or shadcn-style primitives, explicitly verify:

1. `Badge`
   - radius should read pill/soft-rounded, not square
   - outline badges should use the design-system border token, not browser-default border
2. `Button`
   - variant and size should match intended token set
   - focus ring, hover, and disabled states should look intentional
3. `Input` / `Textarea` / `Select`
   - border radius and border color should match the field family
   - placeholder and focus styles should not fall back to UA defaults
4. `Card`
   - radius, border, and shadow should align with the surrounding system
5. `Tabs`, `Badge`, `Alert`, `Popover`, `Dropdown`
   - check that stateful styling is applied consistently and does not regress to plain HTML

## Source verification

If a component looks slightly wrong:

1. inspect the rendered component source
2. inspect the variant map or utility composition
3. inspect the theme token or CSS variable source
4. inspect whether a reset/base stylesheet or Tailwind layer is missing

Do not stop at "screenshot looks a bit off". Explain the probable CSS or token failure.

## Reporting standard

When you find a fidelity bug, report:

1. what looks visually wrong
2. which component and variant show it
3. what the intended component language appears to be
4. the likely CSS/token cause
5. whether it is isolated or likely systemic
