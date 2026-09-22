# Requirements

## Core Flow

1. **Create a Bill** — the top-level entity, everything lives under a bill
2. **Add People** — ad-hoc, just enter a name (no registration/auth). People are added first since items need people for assignment.
3. **Choose Split Mode**:
   - **Equal split** — total bill (items + tax + tip) divided evenly by number of people. No item assignments needed.
   - **Itemized split** — assign items to people with customizable share percentages (default: equal among assigned people)
4. **Add Items** — choose entry method:
   - **Manual Entry** — type item name and price one by one
   - **Scan Receipt** — upload or photograph a receipt, OCR extracts items and prices, user reviews/edits before confirming
   - In itemized mode, assign people and shares after items are added
5. **Tax & Tip** — enter tax and tip each as either a percentage or flat amount. Both are combined and distributed proportionally.
6. **Summary** — show what each person owes with full breakdown

## Calculation Logic

```
effectiveTax = taxAmount if set, otherwise billSubtotal × (taxPercent / 100)
effectiveTip = tipAmount if set, otherwise billSubtotal × (tipPercent / 100)

Equal mode:
  perPerson = (billSubtotal + effectiveTax + effectiveTip) / numberOfPeople

Itemized mode:
  billSubtotal = sum of all item prices
  For each person:
    subtotal = sum of (item.price × person's sharePercent / 100) for assigned items
    taxTipShare = (subtotal / billSubtotal) × (effectiveTax + effectiveTip)
    total = subtotal + taxTipShare
```

- Tax and tip each support percentage presets or custom flat amounts (flat amount takes precedence)
- In itemized mode, tax and tip are combined and split proportionally by each person's subtotal
- Whoever ordered more pays a proportionally larger share of tax + tip
- Share percentages default to equal among assigned people but can be customized (e.g., "had a bite" vs "ate most of it")
- Currency is selectable (USD, EUR, GBP, INR, JPY, CAD, AUD) — display only, no impact on calculations

## Key Behaviors

- Bill is the top-level entity — people and items belong to a bill
- Ordering: Bill → People → Split Mode → Items → Assignments (itemized only) → Tax & Tip → Summary
- People are added before items (needed for assignments in itemized mode)
- In equal mode, no assignments — total is simply divided by number of people
- In itemized mode, assignments happen on each item card after the item is added (person chips on each item)
- Unassigned items (itemized mode) should be visually flagged so nothing gets missed
- Editing is easy — users can go back and adjust anything without restarting
- Switching from itemized to equal mode should be seamless
- Client-side only. No backend, no auth, no database.

## Receipt Scanner

- Uses Tesseract.js for client-side OCR (no API key or backend required)
- Parser extracts item names + prices from OCR text using regex pattern matching
- Detects and auto-fills tax (recognizes tax, HST, GST, PST, VAT)
- Detects tip/gratuity lines
- Filters out subtotal, total, payment method, and header/footer lines
- Review screen allows editing names, prices, and removing items before adding to bill
- Disclaimer warning: OCR can misread prices, user should double-check amounts against receipt
- Tax field always visible in review (editable) — shows "Detected from receipt" or "Not detected"
- Works with phone camera (`capture="environment"`) for snap-and-scan at the table
- Failure handling:
  - **OCR exception** (corrupted image, processing error) — shows error message with options to try another photo or switch to manual entry
  - **No items detected** (blurry image, unsupported format) — shows error message with same options
  - "Enter manually" switches the item entry mode back to Manual Entry


## Submission Checklist

- `npm install && npm run dev` works out of the box
- Screen recording or screenshots of the app working
- README with: what you'd do with another hour, which AI tools you used
