import { NextResponse } from 'next/server'
import { validateOrder, sanitizeOrder } from '@/utils/validation'
import { sendTelegramNotification } from '@/services/telegram'
import { saveToGoogleSheets } from '@/services/googleSheets'

export async function POST(request) {
  try {
    const body = await request.json()

    const { valid, errors } = validateOrder(body)
    if (!valid) {
      return NextResponse.json(
        { success: false, message: 'Validation failed', errors },
        { status: 400 }
      )
    }

    const order = sanitizeOrder(body)

    const results = await Promise.allSettled([
      sendTelegramNotification(order),
      saveToGoogleSheets(order),
    ])

    const telegramOk = results[0].status === 'fulfilled' && results[0].value
    const sheetsOk = results[1].status === 'fulfilled' && results[1].value

    if (!telegramOk && !sheetsOk) {
      return NextResponse.json(
        { success: false, message: 'Failed to process order' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Order received successfully',
    })
  } catch (error) {
    console.error('[API Order] Error:', error.message)
    return NextResponse.json(
      { success: false, message: 'Something went wrong' },
      { status: 500 }
    )
  }
}
