import { describe, it, expect } from 'vitest'
import type { BillState } from '../../types.ts'
import { CURRENCIES } from '../../types.ts'
import {
  getBillSubtotal,
  getEffectiveTax,
  getEffectiveTip,
  calculateSummaries,
  getUnassignedItems,
  formatCurrency,
  validateBill,
} from '../calculations.ts'

const alice = { id: 'alice', name: 'Alice', color: '#3B82F6' }
const bob = { id: 'bob', name: 'Bob', color: '#EF4444' }
const carol = { id: 'carol', name: 'Carol', color: '#10B981' }

function makeBill(overrides: Partial<BillState> = {}): BillState {
  return {
    splitMode: 'itemized',
    currency: CURRENCIES[0],
    people: [alice, bob],
    items: [],
    taxPercent: 0,
    taxAmount: 0,
    tipPercent: 0,
    tipAmount: 0,
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

describe('validateBill', () => {
  it('returns error when fewer than 2 people', () => {
    const errors = validateBill(makeBill({ people: [alice] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('people')
  })

  it('returns error when 0 people', () => {
    const errors = validateBill(makeBill({ people: [] }))
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('people')
  })

  it('passes with exactly 2 people', () => {
    const errors = validateBill(makeBill({ people: [alice, bob] }))
    expect(errors).toHaveLength(0)
  })

  it('returns error for items with zero price', () => {
    const bill = makeBill({
      items: [{ id: '1', name: 'Free water', price: 0, assignments: [] }],
    })
    const errors = validateBill(bill)
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('item:1')
  })

  it('returns error for items with negative price', () => {
    const bill = makeBill({
      items: [{ id: '1', name: 'Bad item', price: -5, assignments: [] }],
    })
    const errors = validateBill(bill)
    expect(errors.some((e) => e.field === 'item:1')).toBe(true)
  })

  it('returns multiple errors for multiple invalid items', () => {
    const bill = makeBill({
      items: [
        { id: '1', name: 'Zero', price: 0, assignments: [] },
        { id: '2', name: 'Valid', price: 10, assignments: [] },
        { id: '3', name: 'Negative', price: -3, assignments: [] },
      ],
    })
    const errors = validateBill(bill)
    expect(errors).toHaveLength(2)
  })

  it('combines people and item errors', () => {
    const bill = makeBill({
      people: [alice],
      items: [{ id: '1', name: 'Zero', price: 0, assignments: [] }],
    })
    const errors = validateBill(bill)
    expect(errors).toHaveLength(2)
    expect(errors.map((e) => e.field)).toContain('people')
    expect(errors.map((e) => e.field)).toContain('item:1')
  })
})

// ---------------------------------------------------------------------------
// getBillSubtotal
// ---------------------------------------------------------------------------

describe('getBillSubtotal', () => {
  it('returns 0 for no items', () => {
    expect(getBillSubtotal(makeBill())).toBe(0)
  })

  it('sums all item prices', () => {
    const bill = makeBill({
      items: [
        { id: '1', name: 'Burger', price: 15, assignments: [] },
        { id: '2', name: 'Salad', price: 12, assignments: [] },
        { id: '3', name: 'Fries', price: 8, assignments: [] },
      ],
    })
    expect(getBillSubtotal(bill)).toBe(35)
  })
})

// ---------------------------------------------------------------------------
// getEffectiveTip
// ---------------------------------------------------------------------------

describe('getEffectiveTip', () => {
  it('uses tipAmount when set', () => {
    const bill = makeBill({
      items: [{ id: '1', name: 'Burger', price: 100, assignments: [] }],
      tipAmount: 20,
      tipPercent: 15,
    })
    expect(getEffectiveTip(bill)).toBe(20)
  })

  it('calculates from tipPercent when tipAmount is 0', () => {
    const bill = makeBill({
      items: [{ id: '1', name: 'Burger', price: 100, assignments: [] }],
      tipPercent: 18,
      tipAmount: 0,
    })
    expect(getEffectiveTip(bill)).toBe(18)
  })

  it('returns 0 when both tipAmount and tipPercent are 0', () => {
    const bill = makeBill({
      items: [{ id: '1', name: 'Burger', price: 50, assignments: [] }],
      tipPercent: 0,
      tipAmount: 0,
    })
    expect(getEffectiveTip(bill)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// getEffectiveTax
// ---------------------------------------------------------------------------

describe('getEffectiveTax', () => {
  it('uses taxAmount when set', () => {
    const bill = makeBill({
      items: [{ id: '1', name: 'Burger', price: 100, assignments: [] }],
      taxAmount: 8,
      taxPercent: 5,
    })
    expect(getEffectiveTax(bill)).toBe(8)
  })

  it('calculates from taxPercent when taxAmount is 0', () => {
    const bill = makeBill({
      items: [{ id: '1', name: 'Burger', price: 100, assignments: [] }],
      taxPercent: 10,
      taxAmount: 0,
    })
    expect(getEffectiveTax(bill)).toBe(10)
  })

  it('returns 0 when both taxAmount and taxPercent are 0', () => {
    const bill = makeBill({
      items: [{ id: '1', name: 'Burger', price: 50, assignments: [] }],
      taxPercent: 0,
      taxAmount: 0,
    })
    expect(getEffectiveTax(bill)).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Equal Split
// ---------------------------------------------------------------------------

describe('calculateSummaries — equal split', () => {
  it('splits total evenly among all people', () => {
    const bill = makeBill({
      splitMode: 'equal',
      people: [alice, bob],
      items: [
        { id: '1', name: 'Pizza', price: 20, assignments: [] },
        { id: '2', name: 'Pasta', price: 30, assignments: [] },
      ],
      taxAmount: 5,
      tipPercent: 20,
    })
    // subtotal = 50, tip = 10, tax = 5, total = 65, per person = 32.50
    const summaries = calculateSummaries(bill)
    expect(summaries).toHaveLength(2)
    expect(summaries[0].total).toBeCloseTo(32.5)
    expect(summaries[1].total).toBeCloseTo(32.5)
  })

  it('splits evenly among 3 people', () => {
    const bill = makeBill({
      splitMode: 'equal',
      people: [alice, bob, carol],
      items: [{ id: '1', name: 'Dinner', price: 90, assignments: [] }],
      taxAmount: 9,
      tipAmount: 18,
    })
    // total = 90 + 9 + 18 = 117, per person = 39
    const summaries = calculateSummaries(bill)
    expect(summaries).toHaveLength(3)
    summaries.forEach((s) => {
      expect(s.total).toBeCloseTo(39)
      expect(s.subtotal).toBeCloseTo(30)
      expect(s.taxTipShare).toBeCloseTo(9)
    })
  })

  it('returns empty array when no people', () => {
    const bill = makeBill({
      splitMode: 'equal',
      people: [],
      items: [{ id: '1', name: 'Pizza', price: 20, assignments: [] }],
    })
    expect(calculateSummaries(bill)).toHaveLength(0)
  })

  it('each person total sums to grand total', () => {
    const bill = makeBill({
      splitMode: 'equal',
      people: [alice, bob, carol],
      items: [
        { id: '1', name: 'Steak', price: 45, assignments: [] },
        { id: '2', name: 'Wine', price: 30, assignments: [] },
      ],
      taxAmount: 7.5,
      tipPercent: 20,
    })
    const summaries = calculateSummaries(bill)
    const sumOfTotals = summaries.reduce((sum, s) => sum + s.total, 0)
    const grandTotal = 45 + 30 + 7.5 + 15 // subtotal + tax + tip
    expect(sumOfTotals).toBeCloseTo(grandTotal)
  })
})

// ---------------------------------------------------------------------------
// Itemized Split — equal shares
// ---------------------------------------------------------------------------

describe('calculateSummaries — itemized with equal shares', () => {
  it('splits a shared item evenly between 2 people', () => {
    const bill = makeBill({
      splitMode: 'itemized',
      people: [alice, bob],
      items: [
        {
          id: '1',
          name: 'Nachos',
          price: 16,
          assignments: [
            { personId: 'alice', sharePercent: 50 },
            { personId: 'bob', sharePercent: 50 },
          ],
        },
      ],
    })
    const summaries = calculateSummaries(bill)
    expect(summaries.find((s) => s.person.id === 'alice')!.subtotal).toBeCloseTo(8)
    expect(summaries.find((s) => s.person.id === 'bob')!.subtotal).toBeCloseTo(8)
  })

  it('assigns full item to one person', () => {
    const bill = makeBill({
      splitMode: 'itemized',
      people: [alice, bob],
      items: [
        {
          id: '1',
          name: 'Salad',
          price: 14,
          assignments: [{ personId: 'alice', sharePercent: 100 }],
        },
        {
          id: '2',
          name: 'Steak',
          price: 36,
          assignments: [{ personId: 'bob', sharePercent: 100 }],
        },
      ],
    })
    const summaries = calculateSummaries(bill)
    expect(summaries.find((s) => s.person.id === 'alice')!.subtotal).toBeCloseTo(14)
    expect(summaries.find((s) => s.person.id === 'bob')!.subtotal).toBeCloseTo(36)
  })

  it('splits item evenly among 3 people', () => {
    const bill = makeBill({
      splitMode: 'itemized',
      people: [alice, bob, carol],
      items: [
        {
          id: '1',
          name: 'Appetizer',
          price: 30,
          assignments: [
            { personId: 'alice', sharePercent: 100 / 3 },
            { personId: 'bob', sharePercent: 100 / 3 },
            { personId: 'carol', sharePercent: 100 / 3 },
          ],
        },
      ],
    })
    const summaries = calculateSummaries(bill)
    summaries.forEach((s) => {
      expect(s.subtotal).toBeCloseTo(10)
    })
  })

  it('person with no assignments owes nothing', () => {
    const bill = makeBill({
      splitMode: 'itemized',
      people: [alice, bob],
      items: [
        {
          id: '1',
          name: 'Burger',
          price: 20,
          assignments: [{ personId: 'alice', sharePercent: 100 }],
        },
      ],
    })
    const bobSummary = calculateSummaries(bill).find((s) => s.person.id === 'bob')!
    expect(bobSummary.subtotal).toBe(0)
    expect(bobSummary.total).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// Itemized Split — custom percentage shares
// ---------------------------------------------------------------------------

describe('calculateSummaries — itemized with custom percentages', () => {
  it('handles 75/25 split (ate most vs had a bite)', () => {
    const bill = makeBill({
      splitMode: 'itemized',
      people: [alice, bob],
      items: [
        {
          id: '1',
          name: 'Entree',
          price: 40,
          assignments: [
            { personId: 'alice', sharePercent: 75 },
            { personId: 'bob', sharePercent: 25 },
          ],
        },
      ],
    })
    const summaries = calculateSummaries(bill)
    expect(summaries.find((s) => s.person.id === 'alice')!.subtotal).toBeCloseTo(30)
    expect(summaries.find((s) => s.person.id === 'bob')!.subtotal).toBeCloseTo(10)
  })

  it('handles 60/30/10 three-way custom split', () => {
    const bill = makeBill({
      splitMode: 'itemized',
      people: [alice, bob, carol],
      items: [
        {
          id: '1',
          name: 'Platter',
          price: 100,
          assignments: [
            { personId: 'alice', sharePercent: 60 },
            { personId: 'bob', sharePercent: 30 },
            { personId: 'carol', sharePercent: 10 },
          ],
        },
      ],
    })
    const summaries = calculateSummaries(bill)
    expect(summaries.find((s) => s.person.id === 'alice')!.subtotal).toBeCloseTo(60)
    expect(summaries.find((s) => s.person.id === 'bob')!.subtotal).toBeCloseTo(30)
    expect(summaries.find((s) => s.person.id === 'carol')!.subtotal).toBeCloseTo(10)
  })

  it('mix of solo items and shared items with custom splits', () => {
    const bill = makeBill({
      splitMode: 'itemized',
      people: [alice, bob],
      items: [
        {
          id: '1',
          name: 'Alice solo',
          price: 20,
          assignments: [{ personId: 'alice', sharePercent: 100 }],
        },
        {
          id: '2',
          name: 'Bob solo',
          price: 10,
          assignments: [{ personId: 'bob', sharePercent: 100 }],
        },
        {
          id: '3',
          name: 'Shared dessert',
          price: 16,
          assignments: [
            { personId: 'alice', sharePercent: 25 },
            { personId: 'bob', sharePercent: 75 },
          ],
        },
      ],
    })
    const summaries = calculateSummaries(bill)
    // Alice: 20 + 4 = 24, Bob: 10 + 12 = 22
    expect(summaries.find((s) => s.person.id === 'alice')!.subtotal).toBeCloseTo(24)
    expect(summaries.find((s) => s.person.id === 'bob')!.subtotal).toBeCloseTo(22)
  })

  it('item breakdown lists correct per-item amounts', () => {
    const bill = makeBill({
      splitMode: 'itemized',
      people: [alice, bob],
      items: [
        {
          id: '1',
          name: 'Wings',
          price: 20,
          assignments: [
            { personId: 'alice', sharePercent: 70 },
            { personId: 'bob', sharePercent: 30 },
          ],
        },
      ],
    })
    const aliceSummary = calculateSummaries(bill).find((s) => s.person.id === 'alice')!
    expect(aliceSummary.items).toHaveLength(1)
    expect(aliceSummary.items[0].name).toBe('Wings')
    expect(aliceSummary.items[0].amount).toBeCloseTo(14)
  })
})

// ---------------------------------------------------------------------------
// Tax & Tip Distribution
// ---------------------------------------------------------------------------

describe('tax and tip distribution', () => {
  it('equal mode: tax+tip split evenly', () => {
    const bill = makeBill({
      splitMode: 'equal',
      people: [alice, bob],
      items: [{ id: '1', name: 'Dinner', price: 80, assignments: [] }],
      taxAmount: 8,
      tipAmount: 16,
    })
    // tax+tip = 24, per person = 12
    const summaries = calculateSummaries(bill)
    summaries.forEach((s) => {
      expect(s.taxTipShare).toBeCloseTo(12)
    })
  })

  it('itemized mode: tax+tip proportional to subtotal', () => {
    const bill = makeBill({
      splitMode: 'itemized',
      people: [alice, bob],
      items: [
        {
          id: '1',
          name: 'Steak',
          price: 60,
          assignments: [{ personId: 'alice', sharePercent: 100 }],
        },
        {
          id: '2',
          name: 'Salad',
          price: 20,
          assignments: [{ personId: 'bob', sharePercent: 100 }],
        },
      ],
      taxAmount: 8,
      tipAmount: 12,
    })
    // billSubtotal = 80, tax+tip = 20
    // Alice: 60/80 × 20 = 15, Bob: 20/80 × 20 = 5
    const summaries = calculateSummaries(bill)
    expect(summaries.find((s) => s.person.id === 'alice')!.taxTipShare).toBeCloseTo(15)
    expect(summaries.find((s) => s.person.id === 'bob')!.taxTipShare).toBeCloseTo(5)
  })

  it('tip from percentage is calculated correctly', () => {
    const bill = makeBill({
      splitMode: 'equal',
      people: [alice, bob],
      items: [{ id: '1', name: 'Meal', price: 100, assignments: [] }],
      taxAmount: 10,
      tipPercent: 20,
      tipAmount: 0,
    })
    // tip = 100 × 0.20 = 20, total = 100 + 10 + 20 = 130, per person = 65
    const summaries = calculateSummaries(bill)
    summaries.forEach((s) => {
      expect(s.total).toBeCloseTo(65)
    })
  })

  it('tipAmount takes precedence over tipPercent', () => {
    const bill = makeBill({
      splitMode: 'equal',
      people: [alice, bob],
      items: [{ id: '1', name: 'Meal', price: 100, assignments: [] }],
      taxAmount: 0,
      tipPercent: 50,
      tipAmount: 10,
    })
    // tipAmount = 10 wins over tipPercent 50% (which would be 50)
    // total = 100 + 0 + 10 = 110, per person = 55
    const summaries = calculateSummaries(bill)
    summaries.forEach((s) => {
      expect(s.total).toBeCloseTo(55)
    })
  })

  it('person with no items gets $0 tax+tip in itemized mode', () => {
    const bill = makeBill({
      splitMode: 'itemized',
      people: [alice, bob],
      items: [
        {
          id: '1',
          name: 'Steak',
          price: 40,
          assignments: [{ personId: 'alice', sharePercent: 100 }],
        },
      ],
      taxAmount: 4,
      tipAmount: 8,
    })
    const bobSummary = calculateSummaries(bill).find((s) => s.person.id === 'bob')!
    expect(bobSummary.taxTipShare).toBe(0)
    expect(bobSummary.total).toBe(0)
  })

  it('tax+tip shares sum to total tax+tip', () => {
    const bill = makeBill({
      splitMode: 'itemized',
      people: [alice, bob, carol],
      items: [
        {
          id: '1',
          name: 'Steak',
          price: 45,
          assignments: [{ personId: 'alice', sharePercent: 100 }],
        },
        {
          id: '2',
          name: 'Shared app',
          price: 18,
          assignments: [
            { personId: 'bob', sharePercent: 60 },
            { personId: 'carol', sharePercent: 40 },
          ],
        },
        {
          id: '3',
          name: 'Drinks',
          price: 27,
          assignments: [
            { personId: 'alice', sharePercent: 33.33 },
            { personId: 'bob', sharePercent: 33.33 },
            { personId: 'carol', sharePercent: 33.34 },
          ],
        },
      ],
      taxAmount: 9,
      tipPercent: 20,
    })
    const summaries = calculateSummaries(bill)
    const totalTaxTip = summaries.reduce((sum, s) => sum + s.taxTipShare, 0)
    const expectedTaxTip = 9 + 90 * 0.2 // tax + tip on subtotal
    expect(totalTaxTip).toBeCloseTo(expectedTaxTip)
  })

  it('all person totals sum to grand total', () => {
    const bill = makeBill({
      splitMode: 'itemized',
      people: [alice, bob, carol],
      items: [
        {
          id: '1',
          name: 'Entree A',
          price: 32,
          assignments: [{ personId: 'alice', sharePercent: 100 }],
        },
        {
          id: '2',
          name: 'Entree B',
          price: 28,
          assignments: [{ personId: 'bob', sharePercent: 100 }],
        },
        {
          id: '3',
          name: 'Shared dessert',
          price: 15,
          assignments: [
            { personId: 'alice', sharePercent: 50 },
            { personId: 'bob', sharePercent: 25 },
            { personId: 'carol', sharePercent: 25 },
          ],
        },
      ],
      taxAmount: 7.5,
      tipAmount: 15,
    })
    const summaries = calculateSummaries(bill)
    const sumOfTotals = summaries.reduce((sum, s) => sum + s.total, 0)
    const grandTotal = 32 + 28 + 15 + 7.5 + 15
    expect(sumOfTotals).toBeCloseTo(grandTotal)
  })

  it('tax from percentage works in equal split', () => {
    const bill = makeBill({
      splitMode: 'equal',
      people: [alice, bob],
      items: [{ id: '1', name: 'Meal', price: 100, assignments: [] }],
      taxPercent: 10,
      taxAmount: 0,
      tipAmount: 0,
    })
    // tax = 100 × 0.10 = 10, total = 110, per person = 55
    const summaries = calculateSummaries(bill)
    summaries.forEach((s) => {
      expect(s.total).toBeCloseTo(55)
    })
  })

  it('tax from percentage works in itemized split', () => {
    const bill = makeBill({
      splitMode: 'itemized',
      people: [alice, bob],
      items: [
        {
          id: '1',
          name: 'Steak',
          price: 75,
          assignments: [{ personId: 'alice', sharePercent: 100 }],
        },
        {
          id: '2',
          name: 'Salad',
          price: 25,
          assignments: [{ personId: 'bob', sharePercent: 100 }],
        },
      ],
      taxPercent: 8,
      taxAmount: 0,
      tipAmount: 0,
    })
    // subtotal = 100, tax = 8
    // Alice: 75 + (75/100 × 8) = 75 + 6 = 81
    // Bob: 25 + (25/100 × 8) = 25 + 2 = 27
    const summaries = calculateSummaries(bill)
    expect(summaries.find((s) => s.person.id === 'alice')!.total).toBeCloseTo(81)
    expect(summaries.find((s) => s.person.id === 'bob')!.total).toBeCloseTo(27)
  })

  it('taxAmount takes precedence over taxPercent', () => {
    const bill = makeBill({
      splitMode: 'equal',
      people: [alice, bob],
      items: [{ id: '1', name: 'Meal', price: 100, assignments: [] }],
      taxPercent: 50,
      taxAmount: 5,
      tipAmount: 0,
    })
    // taxAmount = 5 wins over taxPercent 50% (which would be 50)
    // total = 100 + 5 = 105, per person = 52.50
    const summaries = calculateSummaries(bill)
    summaries.forEach((s) => {
      expect(s.total).toBeCloseTo(52.5)
    })
  })

  it('both tax and tip from percentages work together', () => {
    const bill = makeBill({
      splitMode: 'equal',
      people: [alice, bob],
      items: [{ id: '1', name: 'Dinner', price: 200, assignments: [] }],
      taxPercent: 10,
      taxAmount: 0,
      tipPercent: 20,
      tipAmount: 0,
    })
    // tax = 20, tip = 40, total = 260, per person = 130
    const summaries = calculateSummaries(bill)
    summaries.forEach((s) => {
      expect(s.total).toBeCloseTo(130)
    })
  })
})

// ---------------------------------------------------------------------------
// Unassigned Items
// ---------------------------------------------------------------------------

describe('getUnassignedItems', () => {
  it('returns unassigned item IDs in itemized mode', () => {
    const bill = makeBill({
      splitMode: 'itemized',
      items: [
        { id: '1', name: 'Assigned', price: 10, assignments: [{ personId: 'alice', sharePercent: 100 }] },
        { id: '2', name: 'Unassigned', price: 15, assignments: [] },
      ],
    })
    expect(getUnassignedItems(bill)).toEqual(['2'])
  })

  it('returns empty in equal mode even with unassigned items', () => {
    const bill = makeBill({
      splitMode: 'equal',
      items: [{ id: '1', name: 'Pizza', price: 20, assignments: [] }],
    })
    expect(getUnassignedItems(bill)).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// formatCurrency
// ---------------------------------------------------------------------------

describe('formatCurrency', () => {
  it('formats whole dollars (no currency)', () => {
    expect(formatCurrency(10)).toBe('$10.00')
  })

  it('formats cents (no currency)', () => {
    expect(formatCurrency(9.5)).toBe('$9.50')
  })

  it('rounds to 2 decimal places (no currency)', () => {
    expect(formatCurrency(10.999)).toBe('$11.00')
  })

  it('formats zero (no currency)', () => {
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('formats with USD currency', () => {
    const usd = CURRENCIES.find((c) => c.code === 'USD')!
    const result = formatCurrency(25.5, usd)
    expect(result).toContain('25.50')
  })

  it('formats with EUR currency', () => {
    const eur = CURRENCIES.find((c) => c.code === 'EUR')!
    const result = formatCurrency(25.5, eur)
    expect(result).toContain('25,50')
  })

  it('formats with INR currency', () => {
    const inr = CURRENCIES.find((c) => c.code === 'INR')!
    const result = formatCurrency(1500, inr)
    expect(result).toContain('1,500')
  })

  it('formats JPY without decimals', () => {
    const jpy = CURRENCIES.find((c) => c.code === 'JPY')!
    const result = formatCurrency(1500, jpy)
    expect(result).toContain('1,500')
    expect(result).not.toContain('.')
  })
})
