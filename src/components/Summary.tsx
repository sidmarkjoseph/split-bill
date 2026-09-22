import { useBill } from '../context/BillContext.tsx'
import {
  calculateSummaries,
  getBillSubtotal,
  getEffectiveTax,
  getEffectiveTip,
  formatCurrency,
} from '../utils/calculations.ts'

export default function Summary() {
  const { state } = useBill()
  const c = state.currency

  if (state.people.length === 0 || state.items.length === 0) {
    return (
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-gray-800">Summary</h2>
        <p className="text-sm text-gray-400 py-4 text-center">
          Add people and items to see the breakdown
        </p>
      </section>
    )
  }

  const summaries = calculateSummaries(state)
  const subtotal = getBillSubtotal(state)
  const tax = getEffectiveTax(state)
  const tip = getEffectiveTip(state)
  const grandTotal = subtotal + tax + tip

  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-gray-800">Summary</h2>

      <div className="rounded-lg bg-gray-50 border border-gray-200 p-3 space-y-1 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal, c)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tax</span>
          <span>{formatCurrency(tax, c)}</span>
        </div>
        <div className="flex justify-between text-gray-600">
          <span>Tip</span>
          <span>{formatCurrency(tip, c)}</span>
        </div>
        <div className="flex justify-between font-semibold text-gray-900 pt-1 border-t border-gray-300">
          <span>Total</span>
          <span>{formatCurrency(grandTotal, c)}</span>
        </div>
      </div>

      <div className="space-y-2">
        {summaries.map((summary) => (
          <div
            key={summary.person.id}
            className="rounded-lg border border-gray-200 bg-white p-3 space-y-2"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: summary.person.color }}
                />
                <span className="font-semibold text-gray-900">{summary.person.name}</span>
              </div>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(summary.total, c)}
              </span>
            </div>

            {state.splitMode === 'itemized' && summary.items.length > 0 && (
              <div className="text-xs text-gray-500 space-y-0.5">
                {summary.items.map((item, i) => (
                  <div key={i} className="flex justify-between">
                    <span>{item.name}</span>
                    <span>{formatCurrency(item.amount, c)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-1 border-t border-gray-100 text-gray-600">
                  <span>Tax + Tip share</span>
                  <span>{formatCurrency(summary.taxTipShare, c)}</span>
                </div>
              </div>
            )}

            {state.splitMode === 'equal' && (
              <p className="text-xs text-gray-500">
                {formatCurrency(summary.subtotal, c)} + {formatCurrency(summary.taxTipShare, c)} tax & tip
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
