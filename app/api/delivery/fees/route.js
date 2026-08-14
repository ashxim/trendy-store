import { NextResponse } from 'next/server'
import { getFees, isDeliveryConfigured } from '@/services/delivery'

export async function GET() {
  if (!isDeliveryConfigured()) {
    return NextResponse.json({ success: false, error: 'Delivery API unavailable' }, { status: 503 })
  }
  try {
    const fees = await getFees()
    return NextResponse.json({ fees })
  } catch (error) {
    console.error('[API Delivery] fees error:', error.message)
    return NextResponse.json({ success: false, error: 'Delivery API unavailable' }, { status: 502 })
  }
}
