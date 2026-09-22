import { useState } from 'react'
import { useBill } from '../context/BillContext.tsx'
import { getUnassignedItems } from '../utils/calculations.ts'
import AddItemForm from './AddItemForm.tsx'
import ItemCard from './ItemCard.tsx'
import ReceiptScanner from './ReceiptScanner.tsx'

type EntryMode = 'manual' | 'scan'

export default function ItemList() {
  const { state } = useBill()
  const [entryMode, setEntryMode] = useState<EntryMode>('manual')
  const unassigned = new Set(getUnassignedItems(state))

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">Items</h2>

      <div className="flex rounded-lg border border-gray-300 overflow-hidden">
        <button
          onClick={() => setEntryMode('manual')}
          className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
            entryMode === 'manual'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Manual Entry
        </button>
        <button
          onClick={() => setEntryMode('scan')}
          className={`flex-1 py-1.5 text-sm font-medium transition-colors ${
            entryMode === 'scan'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Scan Receipt
        </button>
      </div>

      {entryMode === 'manual' ? <AddItemForm /> : <ReceiptScanner onSwitchToManual={() => setEntryMode('manual')} />}

      {state.items.length > 0 && (
        <div className="space-y-2">
          {state.items.map((item) => (
            <ItemCard key={item.id} item={item} isUnassigned={unassigned.has(item.id)} />
          ))}
        </div>
      )}

      {state.items.length === 0 && entryMode === 'manual' && (
        <p className="text-sm text-gray-400 py-4 text-center">
          Add items from the bill to get started
        </p>
      )}
    </section>
  )
}
