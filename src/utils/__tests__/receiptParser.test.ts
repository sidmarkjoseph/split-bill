import { describe, it, expect } from 'vitest'
import { parseReceiptText } from '../receiptParser.ts'

describe('parseReceiptText', () => {
  it('extracts items with dollar sign and price', () => {
    const text = `
      Burger          $12.99
      Fries            $5.50
      Soda             $3.00
    `
    const result = parseReceiptText(text)
    expect(result.items).toHaveLength(3)
    expect(result.items[0]).toEqual({ name: 'Burger', price: 12.99 })
    expect(result.items[1]).toEqual({ name: 'Fries', price: 5.50 })
    expect(result.items[2]).toEqual({ name: 'Soda', price: 3.00 })
  })

  it('extracts items without dollar sign', () => {
    const text = `
      Pasta           14.50
      Salad           11.00
    `
    const result = parseReceiptText(text)
    expect(result.items).toHaveLength(2)
    expect(result.items[0].price).toBe(14.50)
    expect(result.items[1].price).toBe(11.00)
  })

  it('detects tax', () => {
    const text = `
      Pizza           $18.00
      Tax              $1.44
    `
    const result = parseReceiptText(text)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].name).toBe('Pizza')
    expect(result.tax).toBe(1.44)
  })

  it('detects tip/gratuity', () => {
    const text = `
      Steak           $45.00
      Tip              $9.00
    `
    const result = parseReceiptText(text)
    expect(result.items).toHaveLength(1)
    expect(result.tip).toBe(9.00)
  })

  it('skips subtotal and total lines', () => {
    const text = `
      Wings           $12.00
      Beer             $8.00
      Subtotal        $20.00
      Tax              $1.60
      Total           $21.60
    `
    const result = parseReceiptText(text)
    expect(result.items).toHaveLength(2)
    expect(result.items.map((i) => i.name)).toEqual(['Wings', 'Beer'])
    expect(result.tax).toBe(1.60)
  })

  it('skips payment method lines', () => {
    const text = `
      Sandwich        $10.00
      Visa            $10.00
      Change           $0.00
    `
    const result = parseReceiptText(text)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].name).toBe('Sandwich')
  })

  it('skips lines without a price', () => {
    const text = `
      Welcome to Joe's Diner
      Table 5
      Burger          $15.00
      Thank you!
    `
    const result = parseReceiptText(text)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].name).toBe('Burger')
  })

  it('skips items with very short names', () => {
    const text = `
      A               $5.00
      Chicken Wrap    $12.50
    `
    const result = parseReceiptText(text)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].name).toBe('Chicken Wrap')
  })

  it('handles empty text', () => {
    const result = parseReceiptText('')
    expect(result.items).toHaveLength(0)
    expect(result.tax).toBeNull()
    expect(result.tip).toBeNull()
  })

  it('detects HST/GST as tax', () => {
    const text = `
      Ramen           $16.00
      HST              $2.08
    `
    const result = parseReceiptText(text)
    expect(result.tax).toBe(2.08)
  })

  it('handles space-separated prices (e.g., "29 99" instead of "29.99")', () => {
    const text = `
      3 Course Meal                  29 99
      Fried Rice Side                 4 00
      Fried Rice Chicken             15 79
      Flame Red Wonton               16 29
    `
    const result = parseReceiptText(text)
    expect(result.items).toHaveLength(4)
    expect(result.items[0]).toEqual({ name: '3 Course Meal', price: 29.99 })
    expect(result.items[1]).toEqual({ name: 'Fried Rice Side', price: 4.00 })
    expect(result.items[2]).toEqual({ name: 'Fried Rice Chicken', price: 15.79 })
    expect(result.items[3]).toEqual({ name: 'Flame Red Wonton', price: 16.29 })
  })

  it('filters out $0 items from space-separated format', () => {
    const text = `
      Hot & Sour Soup Cup AddOn      0 00
      Mongolian Beef                  0 00
      Key Lime Pie                    0 00
      Fried Rice Chicken             15 79
    `
    const result = parseReceiptText(text)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].name).toBe('Fried Rice Chicken')
  })

  it('detects tax in space-separated format', () => {
    const text = `
      Burger                         12 99
      Tax                             4 62
      Subtotal                       66 07
      Total                          70 69
    `
    const result = parseReceiptText(text)
    expect(result.items).toHaveLength(1)
    expect(result.items[0].name).toBe('Burger')
    expect(result.tax).toBe(4.62)
  })

  it('parses the full sample receipt correctly', () => {
    const text = `
      Server: erica                  9:09 PM
      Table 30/1
      Guests: 1
      #30019
      3 Course Meal                  29 99
      Hot & Sour Soup Cup AddOn       0 00
      Mongolian Beef                  0 00
      Fried Rice Side                 4 00
      Key Lime Pie                    0 00
      Fried Rice Chicken             15 79
      Flame Red Wonton               16 29
      + Charity $:
      Subtotal                       66 07
      Tax                             4 62
      Total                          70.69
      Balance Due                    70 69
      For Your Convenience,
      20% ( $13.21 )
      22% ( $14.54 ) 25% ( $16.52 )
    `
    const result = parseReceiptText(text)
    expect(result.items.map((i) => i.name)).toEqual([
      '3 Course Meal',
      'Fried Rice Side',
      'Fried Rice Chicken',
      'Flame Red Wonton',
    ])
    expect(result.items.map((i) => i.price)).toEqual([29.99, 4.00, 15.79, 16.29])
    expect(result.tax).toBe(4.62)
  })
})
