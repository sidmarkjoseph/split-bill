import { useState, useRef } from 'react'
import { useBill } from '../context/BillContext.tsx'
import { ocrImage, parseReceiptText, type ParsedItem } from '../utils/receiptParser.ts'

interface Props {
  onSwitchToManual: () => void
}

export default function ReceiptScanner({ onSwitchToManual }: Props) {
  const { dispatch } = useBill()
  const fileRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'processing' | 'review' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [progress, setProgress] = useState(0)
  const [preview, setPreview] = useState<string | null>(null)
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([])
  const [parsedTax, setParsedTax] = useState<number | null>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setPreview(URL.createObjectURL(file))
    setStatus('processing')
    setProgress(0)

    try {
      const text = await ocrImage(file, setProgress)
      const result = parseReceiptText(text)
      if (result.items.length === 0) {
        setErrorMessage("We couldn't detect any items from this receipt. The image may be blurry or in an unsupported format.")
        setStatus('error')
        return
      }
      setParsedItems(result.items)
      setParsedTax(result.tax)
      setStatus('review')
    } catch {
      setErrorMessage('Something went wrong while scanning the receipt. Please try again or enter items manually.')
      setStatus('error')
    }
  }

  function handleRemoveItem(index: number) {
    setParsedItems((prev) => prev.filter((_, i) => i !== index))
  }

  function handleEditItem(index: number, field: 'name' | 'price', value: string) {
    setParsedItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        if (field === 'name') return { ...item, name: value }
        return { ...item, price: parseFloat(value) || 0 }
      }),
    )
  }

  function handleConfirm() {
    for (const item of parsedItems) {
      if (item.name.trim() && item.price > 0) {
        dispatch({ type: 'ADD_ITEM', name: item.name.trim(), price: item.price })
      }
    }
    if (parsedTax && parsedTax > 0) {
      dispatch({ type: 'SET_TAX_AMOUNT', amount: parsedTax })
    }
    setStatus('idle')
    setParsedItems([])
    setParsedTax(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  function handleCancel() {
    setStatus('idle')
    setParsedItems([])
    setParsedTax(null)
    setPreview(null)
    if (fileRef.current) fileRef.current.value = ''
  }

  if (status === 'idle') {
    return (
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          className="hidden"
          id="receipt-upload"
        />
        <label
          htmlFor="receipt-upload"
          className="flex items-center justify-center gap-2 w-full rounded-lg border-2 border-dashed border-gray-300 py-4 text-sm text-gray-500 cursor-pointer hover:border-blue-400 hover:text-blue-500 transition-colors"
        >
          <span>Upload or take a photo of the receipt</span>
        </label>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 space-y-3">
        {preview && (
          <img src={preview} alt="Receipt" className="w-full max-h-32 object-contain rounded-lg opacity-60" />
        )}
        <p className="text-sm text-red-700">{errorMessage}</p>
        <div className="flex gap-2">
          <button
            onClick={handleCancel}
            className="flex-1 rounded-lg border border-gray-300 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Try another photo
          </button>
          <button
            onClick={() => {
              handleCancel()
              onSwitchToManual()
            }}
            className="flex-1 rounded-lg bg-blue-500 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
          >
            Enter manually
          </button>
        </div>
      </div>
    )
  }

  if (status === 'processing') {
    return (
      <div className="space-y-3">
        {preview && (
          <img src={preview} alt="Receipt" className="w-full max-h-48 object-contain rounded-lg" />
        )}
        <div className="text-center space-y-2">
          <p className="text-sm text-gray-600">Scanning receipt...</p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-400">{progress}%</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {preview && (
        <img src={preview} alt="Receipt" className="w-full max-h-32 object-contain rounded-lg" />
      )}

      <p className="text-sm text-gray-600">
        Found {parsedItems.length} item{parsedItems.length !== 1 ? 's' : ''}. Review and edit before adding:
      </p>

      <div className="rounded-lg bg-amber-50 border border-amber-300 px-3 py-2">
        <p className="text-xs text-amber-800 font-medium">
          OCR can misread prices — please double-check each amount against your receipt before confirming.
        </p>
      </div>

      <div className="space-y-1.5">
        {parsedItems.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={item.name}
              onChange={(e) => handleEditItem(i, 'name', e.target.value)}
              className="flex-1 rounded border border-gray-300 px-2 py-1 text-sm"
            />
            <input
              type="number"
              value={item.price || ''}
              onChange={(e) => handleEditItem(i, 'price', e.target.value)}
              className="w-20 rounded border border-gray-300 px-2 py-1 text-sm text-right"
              min="0.01"
              step="0.01"
            />
            <button
              onClick={() => handleRemoveItem(i)}
              className="text-gray-400 hover:text-red-500 text-sm px-1"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-gray-50 border border-gray-200 p-2">
        <span className="text-sm text-gray-600">Tax:</span>
        <input
          type="number"
          value={parsedTax ?? ''}
          onChange={(e) => setParsedTax(parseFloat(e.target.value) || null)}
          placeholder="0.00"
          min="0"
          step="0.01"
          className="w-24 rounded border border-gray-300 px-2 py-1 text-sm"
        />
        <span className="text-xs text-gray-400">
          {parsedTax && parsedTax > 0 ? 'Detected from receipt' : 'Not detected — enter manually if needed'}
        </span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleConfirm}
          className="flex-1 rounded-lg bg-blue-500 py-2 text-sm font-medium text-white hover:bg-blue-600 transition-colors"
        >
          Add {parsedItems.length} item{parsedItems.length !== 1 ? 's' : ''} to bill
        </button>
        <button
          onClick={handleCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
