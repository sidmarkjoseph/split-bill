import type { BillState, Currency, PersonSummary } from '../types.ts'

export function getBillSubtotal(state: BillState): number {
  return state.items.reduce((sum, item) => sum + item.price, 0)
}

export function getEffectiveTax(state: BillState): number {
  if (state.taxAmount > 0) return state.taxAmount
  return getBillSubtotal(state) * (state.taxPercent / 100)
}

export function getEffectiveTip(state: BillState): number {
  if (state.tipAmount > 0) return state.tipAmount
  return getBillSubtotal(state) * (state.tipPercent / 100)
}

export function calculateSummaries(state: BillState): PersonSummary[] {
  const billSubtotal = getBillSubtotal(state)
  const taxAmount = getEffectiveTax(state)
  const tipAmount = getEffectiveTip(state)
  const taxPlusTip = taxAmount + tipAmount

  if (state.splitMode === 'equal') {
    const count = state.people.length
    if (count === 0) return []
    const perPerson = (billSubtotal + taxPlusTip) / count
    return state.people.map((person) => ({
      person,
      items: [],
      subtotal: billSubtotal / count,
      taxTipShare: taxPlusTip / count,
      total: perPerson,
    }))
  }

  return state.people.map((person) => {
    const itemBreakdown: { name: string; amount: number }[] = []
    let subtotal = 0

    for (const item of state.items) {
      const assignment = item.assignments.find((a) => a.personId === person.id)
      if (assignment) {
        const amount = item.price * (assignment.sharePercent / 100)
        itemBreakdown.push({ name: item.name, amount })
        subtotal += amount
      }
    }

    const taxTipShare = billSubtotal > 0 ? (subtotal / billSubtotal) * taxPlusTip : 0

    return {
      person,
      items: itemBreakdown,
      subtotal,
      taxTipShare,
      total: subtotal + taxTipShare,
    }
  })
}

export function getUnassignedItems(state: BillState): string[] {
  if (state.splitMode === 'equal') return []
  return state.items.filter((item) => item.assignments.length === 0).map((item) => item.id)
}

export function formatCurrency(amount: number, currency?: Currency): string {
  if (currency) {
    return new Intl.NumberFormat(currency.locale, {
      style: 'currency',
      currency: currency.code,
    }).format(amount)
  }
  return `$${amount.toFixed(2)}`
}

export interface ValidationError {
  field: string
  message: string
}

export function validateBill(state: BillState): ValidationError[] {
  const errors: ValidationError[] = []

  if (state.people.length < 2) {
    errors.push({ field: 'people', message: 'At least 2 people are required to split a bill' })
  }

  for (const item of state.items) {
    if (item.price <= 0) {
      errors.push({ field: `item:${item.id}`, message: `"${item.name}" must have a price greater than $0` })
    }
  }

  return errors
}
