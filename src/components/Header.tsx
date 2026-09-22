import { useBill } from '../context/BillContext.tsx'
import { CURRENCIES } from '../types.ts'

export default function Header() {
  const { state, dispatch } = useBill()

  return (
    <header className="flex items-center justify-between py-4">
      <h1 className="text-2xl font-bold text-gray-900">Split the Bill</h1>
      <div className="flex items-center gap-3">
        <select
          value={state.currency.code}
          onChange={(e) => {
            const currency = CURRENCIES.find((c) => c.code === e.target.value)
            if (currency) dispatch({ type: 'SET_CURRENCY', currency })
          }}
          className="rounded-lg border border-gray-300 px-2 py-1 text-sm text-gray-600 focus:border-blue-500 focus:outline-none"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.symbol} {c.code}
            </option>
          ))}
        </select>
        <button
          onClick={() => dispatch({ type: 'RESET_BILL' })}
          className="text-sm text-gray-500 hover:text-red-500 transition-colors"
        >
          Start Over
        </button>
      </div>
    </header>
  )
}
