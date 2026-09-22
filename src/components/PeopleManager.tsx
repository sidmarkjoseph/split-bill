import { useState } from 'react'
import { useBill } from '../context/BillContext.tsx'

export default function PeopleManager() {
  const { state, dispatch } = useBill()
  const [name, setName] = useState('')

  function handleAdd(e: React.FormEvent) {
    e.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return
    dispatch({ type: 'ADD_PERSON', name: trimmed })
    setName('')
  }

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">Who's splitting?</h2>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a name..."
          className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={!name.trim()}
          className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-40 transition-colors"
        >
          Add
        </button>
      </form>

      {state.people.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {state.people.map((person) => (
            <span
              key={person.id}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium text-white"
              style={{ backgroundColor: person.color }}
            >
              {person.name}
              <button
                onClick={() => dispatch({ type: 'REMOVE_PERSON', personId: person.id })}
                className="ml-0.5 hover:opacity-70"
                aria-label={`Remove ${person.name}`}
              >
                &times;
              </button>
            </span>
          ))}
        </div>
      )}
    </section>
  )
}
