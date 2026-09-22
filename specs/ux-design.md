# UX Design

## Design Principles

- **Mobile-first** — this gets used at a dinner table, on phones
- **Minimal friction** — fewest taps to go from receipt to "everyone knows what they owe"
- **Clear at a glance** — the summary should be instantly readable, no mental math needed
- **Forgiving** — easy to edit, undo, and adjust without starting over

## User Flow

1. **Add People** — enter names of everyone at the table (first step, since items need people)
2. **Choose Split Mode** — toggle between "Split Equally" and "Itemized"
3. **Add Items** — toggle between "Manual Entry" and "Scan Receipt"
   - **Manual Entry**: type item name and price, add one at a time
   - **Scan Receipt**: upload/photograph receipt → OCR with progress bar → review extracted items → edit/remove → confirm to add to bill
   - In **equal mode**: just add items and prices, no assignment UI shown
4. **Assign People** (itemized mode only) — after items are added, assign people to each item via toggleable chips on each item card. Customize share percentages if needed.
5. **Tax & Tip** — enter tax and tip each via percentage presets (5/8/10% for tax, 15/18/20/25% for tip) or custom flat amount
6. **Summary** — per-person breakdown with totals

## UI Decisions

- Currency selector in the header — changes display format across the entire app (no effect on math)
- Single-page app with clear sections, not a multi-step wizard (users can jump back and edit)
- Split mode toggle is prominent — easy to switch between equal and itemized
- Color-coded chips for people to make assignments visual
- In itemized mode:
  - Each item shows toggleable person chips for assignment
  - Share percentages default to equal; expandable to customize
  - Shared items show a split indicator (e.g., "3 ways" or custom %)
  - Unassigned items highlighted in a warning color
- Receipt scanner: upload area with dashed border, progress bar during OCR, review list with inline editing before confirming
- Receipt scanner review: amber disclaimer warning to double-check OCR prices, always-visible editable tax field
- Receipt scanner failure: red error card with descriptive message and two action buttons — "Try another photo" (retry) and "Enter manually" (switches to manual entry mode)
- Summary cards per person with their items listed, subtotal, tax+tip share, and final total
- In equal mode: summary is simple — total bill / N per person

## Responsive Behavior

- On mobile: stacked layout, large tap targets, bottom-anchored summary
- On desktop: side-by-side layout (items + assignments on left, summary on right)
