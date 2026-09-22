import { createContext, useContext, useReducer, type ReactNode } from 'react'
import { nanoid } from 'nanoid'
import type { BillState, Currency, Item, Person, SplitMode } from '../types.ts'
import { CURRENCIES } from '../types.ts'

const PERSON_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
  '#8B5CF6', '#EC4899', '#06B6D4', '#F97316',
]

type BillAction =
  | { type: 'ADD_PERSON'; name: string }
  | { type: 'REMOVE_PERSON'; personId: string }
  | { type: 'ADD_ITEM'; name: string; price: number }
  | { type: 'REMOVE_ITEM'; itemId: string }
  | { type: 'UPDATE_ITEM'; itemId: string; name: string; price: number }
  | { type: 'TOGGLE_ASSIGNMENT'; itemId: string; personId: string }
  | { type: 'SET_SHARE_PERCENT'; itemId: string; personId: string; percent: number }
  | { type: 'SET_SPLIT_MODE'; mode: SplitMode }
  | { type: 'SET_TAX_PERCENT'; percent: number }
  | { type: 'SET_TAX_AMOUNT'; amount: number }
  | { type: 'SET_TIP_PERCENT'; percent: number }
  | { type: 'SET_TIP_AMOUNT'; amount: number }
  | { type: 'SET_CURRENCY'; currency: Currency }
  | { type: 'RESET_BILL' }

const initialState: BillState = {
  splitMode: 'itemized',
  currency: CURRENCIES[0],
  people: [],
  items: [],
  taxPercent: 0,
  taxAmount: 0,
  tipPercent: 18,
  tipAmount: 0,
}

function equalizeShares(assignments: Item['assignments']): Item['assignments'] {
  if (assignments.length === 0) return assignments
  const share = 100 / assignments.length
  return assignments.map((a) => ({ ...a, sharePercent: share }))
}

function billReducer(state: BillState, action: BillAction): BillState {
  switch (action.type) {
    case 'ADD_PERSON': {
      const color = PERSON_COLORS[state.people.length % PERSON_COLORS.length]
      const person: Person = { id: nanoid(), name: action.name, color }
      return { ...state, people: [...state.people, person] }
    }

    case 'REMOVE_PERSON': {
      const people = state.people.filter((p) => p.id !== action.personId)
      const items = state.items.map((item) => {
        const assignments = item.assignments.filter((a) => a.personId !== action.personId)
        return { ...item, assignments: equalizeShares(assignments) }
      })
      return { ...state, people, items }
    }

    case 'ADD_ITEM': {
      const item: Item = {
        id: nanoid(),
        name: action.name,
        price: action.price,
        assignments: [],
      }
      return { ...state, items: [...state.items, item] }
    }

    case 'REMOVE_ITEM':
      return { ...state, items: state.items.filter((i) => i.id !== action.itemId) }

    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map((i) =>
          i.id === action.itemId ? { ...i, name: action.name, price: action.price } : i,
        ),
      }

    case 'TOGGLE_ASSIGNMENT': {
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.id !== action.itemId) return item
          const exists = item.assignments.find((a) => a.personId === action.personId)
          const assignments = exists
            ? item.assignments.filter((a) => a.personId !== action.personId)
            : [...item.assignments, { personId: action.personId, sharePercent: 0 }]
          return { ...item, assignments: equalizeShares(assignments) }
        }),
      }
    }

    case 'SET_SHARE_PERCENT': {
      return {
        ...state,
        items: state.items.map((item) => {
          if (item.id !== action.itemId) return item
          return {
            ...item,
            assignments: item.assignments.map((a) =>
              a.personId === action.personId ? { ...a, sharePercent: action.percent } : a,
            ),
          }
        }),
      }
    }

    case 'SET_SPLIT_MODE':
      return { ...state, splitMode: action.mode }

    case 'SET_TAX_PERCENT':
      return { ...state, taxPercent: action.percent, taxAmount: 0 }

    case 'SET_TAX_AMOUNT':
      return { ...state, taxAmount: action.amount, taxPercent: 0 }

    case 'SET_TIP_PERCENT':
      return { ...state, tipPercent: action.percent, tipAmount: 0 }

    case 'SET_TIP_AMOUNT':
      return { ...state, tipAmount: action.amount, tipPercent: 0 }

    case 'SET_CURRENCY':
      return { ...state, currency: action.currency }

    case 'RESET_BILL':
      return initialState
  }
}

interface BillContextValue {
  state: BillState
  dispatch: React.Dispatch<BillAction>
}

const BillContext = createContext<BillContextValue | null>(null)

export function BillProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(billReducer, initialState)
  return <BillContext value={{ state, dispatch }}>{children}</BillContext>
}

export function useBill() {
  const context = useContext(BillContext)
  if (!context) throw new Error('useBill must be used within BillProvider')
  return context
}
