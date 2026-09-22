import { useBill } from '../context/BillContext.tsx'
import type { SplitMode } from '../types.ts'

export default function SplitModeToggle() {
  const { state, dispatch } = useBill()

  function setMode(mode: SplitMode) {
    dispatch({ type: 'SET_SPLIT_MODE', mode })
  }

  return (
    <section className="space-y-2">
      <h2 className="text-lg font-semibold text-gray-800">How do you want to split?</h2>
      <div className="flex rounded-lg border border-gray-300 overflow-hidden">
        <button
          onClick={() => setMode('equal')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            state.splitMode === 'equal'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Split Equally
        </button>
        <button
          onClick={() => setMode('itemized')}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            state.splitMode === 'itemized'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Itemized
        </button>
      </div>
    </section>
  )
}
