# UI Review Checklist

Use this checklist whenever the task is visual QA, layout review, diagram review, or "find UI issues".

For normal web pages and component audits, also read `web-fidelity-checklist.md`.

## Minimum evidence

Collect all of these before concluding the UI is clean:

1. console log via `browser_console_messages`
2. structure via `browser_snapshot`
3. at least one screenshot of the target section
4. for long pages, one full-page screenshot

## Visual pass

Inspect screenshots in this order:

1. overall composition
2. top edge and section headers
3. left edge and left-aligned labels
4. center content
5. right edge
6. bottom edge and footer area

Do not only inspect the visual center of the page.

## Component suspicion pass

Treat these as likely real UI bugs, not nitpicks:

1. a badge, chip, button, input, or card corner looks more square than the design system implies
2. a border looks too dark, too thick, or too sharp compared to neighboring primitives
3. spacing inside a component looks tighter or looser than sibling components of the same family
4. text color or background color looks "off" even when contrast is still acceptable
5. a component looks browser-default or half-styled compared to surrounding shadcn-style primitives

## Occlusion pass

For diagrams, SVGs, charts, timelines, and layered cards, explicitly check:

1. labels near borders or connectors
2. small captions under main titles
3. text placed between stacked layers
4. dashed or thin connectors that may disappear into the background
5. text that may be covered by later-rendered boxes, fills, badges, or overlays

Treat these as suspicious patterns:

- a label baseline visually touches a box edge
- text looks lower-contrast than surrounding labels for no semantic reason
- a section label sits in the same vertical band as the next layer's shapes
- a box or card starts before the previous layer's label has enough breathing room

## Source verification pass

If the screenshot suggests overlap, clipping, or visual collision:

1. inspect the component source
2. verify element order in the JSX/SVG tree
3. compare text `x`/`y` positions against the neighboring shape bounds
4. only then decide whether the issue is real or a false alarm

## Report standard

When you find a UI issue, report:

1. what is visibly wrong
2. where it appears
3. the likely technical cause
4. whether it is a runtime problem, content problem, or pure visual/layout problem
