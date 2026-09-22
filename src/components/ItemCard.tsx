import { useState } from 'react'
import { useBill } from '../context/BillContext.tsx'
import type { Item } from '../types.ts'
import { formatCurrency } from '../utils/calculations.ts'

interface Props {
  item: Item
  isUnassigned: boolean
}

export default function ItemCard({ item, isUnassigned }: Props) {
  const { state, dispatch } = useBill()
  const [showShares, setShowShares] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(item.name)
  const [editPrice, setEditPrice] = useState(item.price.toString())

  function handleSaveEdit() {
    const trimmed = editName.trim()
    const parsed = parseFloat(editPrice)
    if (trimmed && !isNaN(parsed) && parsed > 0) {
      dispatch({ type: 'UPDATE_ITEM', itemId: item.id, name: trimmed, price: parsed })
    }
    setIsEditing(false)
  }

  const assignedCount = item.assignments.length

  return (
    <div
      className={`rounded-lg border p-3 space-y-2 ${
        isUnassigned ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {isEditing ? (
          <div className="flex flex-1 gap-2">
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
              autoFocus
            />
            <input
              type="number"
              value={editPrice}
              onChange={(e) => setEditPrice(e.target.value)}
              className="w-20 rounded border border-gray-300 px-2 py-1 text-sm"
              min="0.01"
              step="0.01"
            />
            <button onClick={handleSaveEdit} className="text-sm text-blue-500 font-medium">
              Save
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 min-w-0">
              <span className="font-medium text-gray-900">{item.name}</span>
              {assignedCount > 1 && (
                <span className="ml-2 text-xs text-gray-500">
                  {assignedCount} ways
                </span>
              )}
            </div>
            <span className="font-semibold text-gray-900">{formatCurrency(item.price, state.currency)}</span>
            <button
              onClick={() => setIsEditing(true)}
              className="text-gray-400 hover:text-gray-600 text-sm"
              aria-label="Edit item"
            >
              &#9998;
            </button>
            <button
              onClick={() => dispatch({ type: 'REMOVE_ITEM', itemId: item.id })}
              className="text-gray-400 hover:text-red-500 text-sm"
              aria-label="Delete item"
            >
              &times;
            </button>
          </>
        )}
      </div>

      {isUnassigned && (
        <p className="text-xs text-amber-600 font-medium">Not assigned to anyone yet</p>
      )}

      {state.splitMode === 'itemized' && state.people.length > 0 && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {state.people.map((person) => {
              const isAssigned = item.assignments.some((a) => a.personId === person.id)
              return (
                <button
                  key={person.id}
                  onClick={() =>
                    dispatch({ type: 'TOGGLE_ASSIGNMENT', itemId: item.id, personId: person.id })
                  }
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                    isAssigned
                      ? 'text-white shadow-sm'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  style={
                    isAssigned ? { backgroundColor: person.color } : undefined
                  }
                >
                  {person.name}
                </button>
              )
            })}
          </div>

          {assignedCount > 1 && (
            <div>
              <button
                onClick={() => setShowShares(!showShares)}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                {showShares ? 'Hide' : 'Customize'} shares
              </button>

              {showShares && (
                <div className="mt-2 space-y-1.5">
                  {item.assignments.map((assignment) => {
                    const person = state.people.find((p) => p.id === assignment.personId)
                    if (!person) return null
                    return (
                      <div key={assignment.personId} className="flex items-center gap-2 text-sm">
                        <span
                          className="w-2 h-2 rounded-full shrink-0"
                          style={{ backgroundColor: person.color }}
                        />
                        <span className="text-gray-700 min-w-[60px]">{person.name}</span>
                        <input
                          type="number"
                          value={Math.round(assignment.sharePercent)}
                          onChange={(e) =>
                            dispatch({
                              type: 'SET_SHARE_PERCENT',
                              itemId: item.id,
                              personId: person.id,
                              percent: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-16 rounded border border-gray-300 px-2 py-0.5 text-xs text-center"
                          min="0"
                          max="100"
                        />
                        <span className="text-xs text-gray-500">%</span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {formatCurrency(item.price * (assignment.sharePercent / 100), state.currency)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
