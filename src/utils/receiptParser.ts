import Tesseract from 'tesseract.js'

export interface ParsedItem {
  name: string
  price: number
}

export interface ParsedReceipt {
  items: ParsedItem[]
  tax: number | null
  tip: number | null
}

export async function ocrImage(
  image: File,
  onProgress?: (progress: number) => void,
): Promise<string> {
  const result = await Tesseract.recognize(image, 'eng', {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress(Math.round(m.progress * 100))
      }
    },
  })
  return result.data.text
}

export function parseReceiptText(text: string): ParsedReceipt {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  const items: ParsedItem[] = []
  let tax: number | null = null
  let tip: number | null = null

  // Matches: $12.99, 12.99, 12,99, 12 99 (space-separated dollars and cents)
  const pricePattern = /\$?\s*(\d+)[.,\s](\d{2})\s*$/
  const taxPattern = /\b(tax|hst|gst|pst|vat)\b/i
  const tipPattern = /\b(tip|gratuity|grat)\b/i
  const skipPattern = /\b(subtotal|sub total|total|balance|change|cash|credit|debit|visa|mastercard|amex|thank|welcome|receipt|order|table|server|guest|date|time|phone|tel|fax|www|http|check|charity|convenience|guests?)\b/i

  for (const line of lines) {
    const priceMatch = line.match(pricePattern)
    if (!priceMatch) continue

    const price = parseFloat(`${priceMatch[1]}.${priceMatch[2]}`)
    if (isNaN(price) || price <= 0) continue

    if (taxPattern.test(line)) {
      tax = price
      continue
    }

    if (tipPattern.test(line)) {
      tip = price
      continue
    }

    if (skipPattern.test(line)) continue

    const name = line
      .replace(pricePattern, '')
      .replace(/[^\w\s&'-]/g, '')
      .trim()

    if (name.length >= 2) {
      items.push({ name, price })
    }
  }

  return { items, tax, tip }
}
