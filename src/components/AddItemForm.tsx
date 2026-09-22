import { useState } from 'react'
import { useBill } from '../context/BillContext.tsx'

export default function AddItemForm() {
  const { dispatch } = useBill()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    const parsedPrice = parseFloat(price)
    if (!trimmedName || isNaN(parsedPrice) || parsedPrice <= 0) return

    dispatch({ type: 'ADD_ITEM', name: trimmedName, price: parsedPrice })
    setName('')
    setPrice('')
  }

  return (
    <form onSubmit={handleAdd} className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Item name"
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <input
        type="number"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        placeholder="Price"
        min="0.01"
        step="0.01"
        className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <button
        type="submit"
        disabled={!name.trim() || !price || parseFloat(price) <= 0}
        className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
      >
        Add
      </button>
    </form>
  )
}
