# Split the Bill

A client-side web app that helps a group of friends split a restaurant bill fairly. Built with React, TypeScript, Vite, and Tailwind CSS.

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## How It Works

The app follows a top-down hierarchy: **Bill > People > Items > Summary**.

```
                          +------------------+
                          |      BILL        |
                          | (top-level entity)|
                          +--------+---------+
                                   |
                          +--------+---------+
                          |     PEOPLE       |
                          | Add names (2+)   |
                          +--------+---------+
                                   |
                     +-------------+-------------+
                     |                           |
              +------+------+             +------+------+
              | SPLIT       |             | ITEMIZED    |
              | EQUALLY     |             | SPLIT       |
              +------+------+             +------+------+
                     |                           |
              +------+------+             +------+------+
              | ADD ITEMS   |             | ADD ITEMS   |
              | (no assign) |             | + ASSIGN    |
              +------+------+             +------+------+
                     |                           |
                     +-------------+-------------+
                                   |
                          +--------+---------+
                          |   TAX & TIP      |
                          |  (% or amount)   |
                          +--------+---------+
                                   |
                          +--------+---------+
                          |    SUMMARY       |
                          | Per-person totals |
                          +------------------+
```

## Features

### 1. People Management

Add friends by name. Color-coded chips make it easy to see who's who throughout the app. At least 2 people are required to split a bill.

### 2. Two Split Modes

| | Equal Split | Itemized Split |
|---|---|---|
| **How it works** | Total / number of people | Each item assigned to specific people |
| **Assignments** | None needed | Tap person chips on each item |
| **Custom shares** | N/A | Adjustable % per person (e.g., 75/25) |
| **Best for** | "Just split it evenly" | "I only had a salad" |

Switch between modes at any time -- items and people are preserved.

### 3. Item Entry

Two ways to add items:

```
+------------------+          +------------------+
| MANUAL ENTRY     |    or    | SCAN RECEIPT     |
|                  |          |                  |
| Type name +      |          | Upload photo     |
| price one by one |          | OCR extracts     |
+------------------+          | items + prices   |
                              | + tax auto-fill  |
                              +--------+---------+
                                       |
                              +--------+---------+
                              | REVIEW & EDIT    |
                              | Double-check     |
                              | prices (OCR can  |
                              | misread values)  |
                              +--------+---------+
                                       |
                              +--------+---------+
                              | CONFIRM          |
                              | Items + tax      |
                              | added to bill    |
                              +------------------+
```

**Receipt Scanner Details:**
- Powered by Tesseract.js (client-side OCR, no API key needed)
- Supports phone camera for snap-and-scan at the table
- Auto-detects tax (tax, HST, GST, PST, VAT) and pre-fills the tax field
- Tip is not auto-populated from the receipt (entered manually)
- Handles space-separated prices (e.g., `29 99`) and standard formats (`$29.99`)
- Filters out subtotals, totals, payment lines, and $0 items automatically

**Failure Handling:**
- If OCR fails or no items are detected, the user is shown a clear error with two options: "Try another photo" or "Enter manually"

### 4. Assignments (Itemized Mode Only)

After items are added, assign people to each item by tapping their color-coded chip. Items shared between multiple people default to an equal split, but shares can be customized:

```
  Shared Nachos  $16.00   [Alice] [Bob]
  Customize shares:
    Alice  75%  $12.00    (ate most of it)
    Bob    25%   $4.00    (had a bite)
```

Unassigned items are highlighted in amber so nothing gets missed.

### 5. Tax & Tip

Both tax and tip support two input methods:

| | Presets | Custom Amount |
|---|---|---|
| **Tax** | 5%, 8%, 10% | Enter exact dollar amount |
| **Tip** | 15%, 18%, 20%, 25% | Enter exact dollar amount |

- Flat amount takes precedence over percentage when both are set
- Tax may be auto-populated from a scanned receipt
- In itemized mode, tax + tip are distributed proportionally (whoever ordered more pays a larger share)

### 6. Summary

Per-person breakdown showing:
- **Itemized mode**: each person's items, subtotal, tax+tip share, and total
- **Equal mode**: simple total / N with subtotal and tax+tip share shown

All person totals sum to the grand total -- no rounding gaps.

### 7. Multi-Currency Support

Currency selector in the header supports: USD, EUR, GBP, INR, JPY, CAD, AUD. Uses `Intl.NumberFormat` for locale-aware formatting (e.g., `$25.50` vs `25,50 EUR` vs `JPY 1,500`). Currency is display-only -- calculations are the same regardless.

## Tech Stack

- **React 19** + **TypeScript** -- type-safe components with `useReducer` + Context for state
- **Vite** -- fast dev server and build
- **Tailwind CSS v4** -- utility-first styling, mobile-first design
- **Tesseract.js** -- client-side OCR for receipt scanning
- **Vitest** -- 62 unit tests covering calculations, validation, receipt parsing

## Project Structure

```
src/
  types.ts                 -- shared TypeScript types
  context/BillContext.tsx   -- useReducer + Context (single source of truth)
  utils/calculations.ts    -- pure functions for bill math
  utils/receiptParser.ts   -- OCR + regex receipt text parsing
  components/
    Header.tsx             -- title, currency selector, reset
    PeopleManager.tsx      -- add/remove people
    SplitModeToggle.tsx    -- equal / itemized toggle
    ItemList.tsx           -- item entry mode toggle + item cards
    AddItemForm.tsx        -- manual item entry
    ReceiptScanner.tsx     -- receipt upload, OCR, review, error handling
    ItemCard.tsx           -- item display, assignments, share customization
    TaxTipSection.tsx      -- tax & tip inputs (% presets + custom amounts)
    Summary.tsx            -- per-person breakdown
specs/
  requirements.md          -- feature requirements and calculation logic
  ux-design.md             -- UI/UX decisions and user flow
  architecture.md          -- component structure and data model
```

## Running Tests

```bash
npm test          # run once
npm run test:watch # watch mode
```

## Future Improvements (What I'd Do With Another Hour)

I spent roughly 35-40 minutes on this project. Here's where I'd take it next:

- **Persistence / backend layer** -- Add a simple SQL backend with `bill_id` and `user_id` so users can save, retrieve, and view their bill history over time. A lightweight schema (`users`, `bills`, `bill_items`, `bill_assignments`) would be enough to make bills durable beyond a single browser session.
- **Pay with Venmo** -- Users register with their Venmo handle during the "Add People" step. Once the summary is calculated, each person gets a one-tap "Pay with Venmo" button that opens the Venmo app pre-filled with the exact amount owed and the payee. After payment, the user is automatically disconnected from the bill (marked as settled).
- **Improve receipt OCR accuracy** -- Pre-process images (contrast enhancement, rotation correction, crop) before OCR to improve parsing on blurry or angled photos.
- **Responsive desktop layout** -- Side-by-side items + summary view on wider screens.
- **Share via link** -- Encode bill state in a URL so you can text the split to friends.

## AI Tool Usage

Built entirely using **Claude Code (Opus 4.6)**.

I drove the high-level decisions -- product flow, tech architecture, data model design, extensibility (e.g., adding currency support without touching core logic, adding receipt scanning as a separate item entry mode that reuses the existing bill state), and defining test scenarios against real receipts. Claude handled the implementation: scaffolding, component code, state management, receipt parser logic, unit tests, and iterative fixes based on my testing and feedback.

The workflow was iterative and conversational: I'd define or amend specs first, Claude would implement against the updated specs, I'd review the code, run tests, and test in the browser, then flag issues (e.g., OCR misreading prices, tax not auto-populating). We'd update the specs to reflect what we learned, and then Claude would iterate until it worked. Specs and code stayed in sync throughout.
