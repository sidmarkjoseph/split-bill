import { useBill } from '../context/BillContext.tsx'
import { getBillSubtotal, getEffectiveTax, getEffectiveTip, formatCurrency } from '../utils/calculations.ts'

const TAX_PRESETS = [5, 8, 10]
const TIP_PRESETS = [15, 18, 20, 25]

export default function TaxTipSection() {
  const { state, dispatch } = useBill()
  const subtotal = getBillSubtotal(state)
  const currency = state.currency

  const effectiveTax = getEffectiveTax(state)
  const effectiveTip = getEffectiveTip(state)

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">Tax & Tip</h2>

      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-600 block mb-1">Tax</label>
          <div className="flex gap-1.5 mb-2">
            {TAX_PRESETS.map((pct) => (
              <button
                key={pct}
                onClick={() => dispatch({ type: 'SET_TAX_PERCENT', percent: pct })}
                className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                  state.taxPercent === pct && state.taxAmount === 0
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">or</span>
            <input
              type="number"
              value={state.taxAmount || ''}
              onChange={(e) =>
                dispatch({ type: 'SET_TAX_AMOUNT', amount: parseFloat(e.target.value) || 0 })
              }
              placeholder="Custom amount"
              min="0"
              step="0.01"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {subtotal > 0 && (
            <p className="text-xs text-gray-400 mt-1">Tax: {formatCurrency(effectiveTax, currency)}</p>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-600 block mb-1">Tip</label>
          <div className="flex gap-1.5 mb-2">
            {TIP_PRESETS.map((pct) => (
              <button
                key={pct}
                onClick={() => dispatch({ type: 'SET_TIP_PERCENT', percent: pct })}
                className={`flex-1 rounded-lg py-1.5 text-sm font-medium transition-colors ${
                  state.tipPercent === pct && state.tipAmount === 0
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {pct}%
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">or</span>
            <input
              type="number"
              value={state.tipAmount || ''}
              onChange={(e) =>
                dispatch({ type: 'SET_TIP_AMOUNT', amount: parseFloat(e.target.value) || 0 })
              }
              placeholder="Custom amount"
              min="0"
              step="0.01"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {subtotal > 0 && (
            <p className="text-xs text-gray-400 mt-1">Tip: {formatCurrency(effectiveTip, currency)}</p>
          )}
        </div>
      </div>
    </section>
  )
}
