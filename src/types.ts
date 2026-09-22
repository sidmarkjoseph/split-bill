export type SplitMode = 'equal' | 'itemized'

export interface ItemAssignment {
  personId: string
  sharePercent: number
}

export interface Item {
  id: string
  name: string
  price: number
  assignments: ItemAssignment[]
}

export interface Person {
  id: string
  name: string
  color: string
}

export interface Currency {
  code: string
  symbol: string
  locale: string
}

export const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', locale: 'en-US' },
  { code: 'EUR', symbol: '€', locale: 'de-DE' },
  { code: 'GBP', symbol: '£', locale: 'en-GB' },
  { code: 'INR', symbol: '₹', locale: 'en-IN' },
  { code: 'JPY', symbol: '¥', locale: 'ja-JP' },
  { code: 'CAD', symbol: 'C$', locale: 'en-CA' },
  { code: 'AUD', symbol: 'A$', locale: 'en-AU' },
]

export interface BillState {
  splitMode: SplitMode
  currency: Currency
  people: Person[]
  items: Item[]
  taxPercent: number
  taxAmount: number
  tipPercent: number
  tipAmount: number
}

export interface PersonSummary {
  person: Person
  items: { name: string; amount: number }[]
  subtotal: number
  taxTipShare: number
  total: number
}
