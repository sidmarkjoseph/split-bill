# Architecture

## Component Structure

```
App
├── Header (title, currency selector, reset)
├── PeopleManager
│   ├── PersonChip (color-coded, deletable)
│   └── AddPersonInput
├── SplitModeToggle (equal / itemized)
├── ItemList
│   ├── EntryModeToggle (manual / scan receipt)
│   ├── AddItemForm (manual mode)
│   ├── ReceiptScanner (scan mode, receives onSwitchToManual callback)
│   │   ├── idle: image upload (supports phone camera)
│   │   ├── processing: OCR progress bar
│   │   ├── error: message + "Try another photo" / "Enter manually" buttons
│   │   └── review: edit extracted items before confirming
│   └── ItemCard
│       ├── item name + price
│       ├── person assignment chips (toggleable, itemized mode only)
│       └── share customization (per-person %, defaults to equal, itemized mode only)
├── TaxTipSection
│   ├── tax input (percentage presets or custom dollar amount)
│   └── tip input (percentage presets or custom dollar amount)
└── Summary
    ├── EqualSummary (total / N per person)
    └── ItemizedSummary
        └── PersonCard (per person: items, subtotal, tax+tip share, total)
```

## Data Model

```typescript
type SplitMode = 'equal' | 'itemized'

interface ItemAssignment {
  personId: string
  sharePercent: number  // 0-100, auto-calculated for equal splits
}

interface Item {
  id: string
  name: string
  price: number
  assignments: ItemAssignment[]  // empty means unassigned (only relevant in itemized mode)
}

interface Person {
  id: string
  name: string
  color: string
}

interface Currency {
  code: string            // e.g., 'USD', 'EUR', 'INR'
  symbol: string
  locale: string          // for Intl.NumberFormat
}

interface BillState {
  splitMode: SplitMode
  currency: Currency
  people: Person[]
  items: Item[]
  taxPercent: number      // percentage (e.g., 8 means 8%)
  taxAmount: number       // flat amount — takes precedence over taxPercent when > 0
  tipPercent: number      // percentage (e.g., 18 means 18%)
  tipAmount: number       // flat amount — takes precedence over tipPercent when > 0
}
```

## State Management

- React `useReducer` + Context for bill state
- Single source of truth — all components read/write through context
- No external state library needed
- Switching split mode preserves items and people — only assignments become irrelevant in equal mode

## Calculation Logic

```
billSubtotal = sum of all item prices
effectiveTax = taxAmount if > 0, else billSubtotal × (taxPercent / 100)
effectiveTip = tipAmount if > 0, else billSubtotal × (tipPercent / 100)

Equal mode:
  perPerson = (billSubtotal + effectiveTax + effectiveTip) / numberOfPeople

Itemized mode:
  For each person:
    subtotal = sum of (item.price × assignment.sharePercent / 100) for assigned items
    taxTipShare = (subtotal / billSubtotal) × (effectiveTax + effectiveTip)
    total = subtotal + taxTipShare
```

## File Structure

```
src/
├── App.tsx
├── main.tsx
├── index.css
├── types.ts
├── context/
│   └── BillContext.tsx
├── components/
│   ├── Header.tsx
│   ├── PeopleManager.tsx
│   ├── SplitModeToggle.tsx
│   ├── ItemList.tsx
│   ├── ItemCard.tsx
│   ├── AddItemForm.tsx
│   ├── ReceiptScanner.tsx
│   ├── TaxTipSection.tsx
│   └── Summary.tsx
└── utils/
    ├── calculations.ts
    └── receiptParser.ts    — OCR + regex-based receipt text parsing
```
