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

## What I'd Do With Another Hour

- **Improve receipt OCR accuracy** -- pre-process images (contrast, rotation, crop) before OCR to improve parsing on blurry or angled photos
- **Responsive desktop layout** -- side-by-side items + summary view on wider screens
- **Share via link** -- encode bill state in a URL so you can text the split to friends
- **Venmo/payment deep links** -- one-tap "request $X from Alice" that opens Venmo

## AI Tools Used

- **Claude Code (Claude Opus)** -- all code was generated through conversation with Claude Code. Used for scaffolding, component implementation, state management, receipt parser logic, unit tests, and iterative refinement based on testing real receipts.
