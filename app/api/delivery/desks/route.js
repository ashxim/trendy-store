import { NextResponse } from 'next/server'
import { getDesks, isDeliveryConfigured } from '@/services/delivery'

export async function GET() {
  if (!isDeliveryConfigured()) {
    return NextResponse.json({ success: false, error: 'Delivery API unavailable' }, { status: 503 })
  }
  try {
    const desks = await getDesks()
    return NextResponse.json({ desks })
  } catch (error) {
    console.error('[API Delivery] desks error:', error.message)
    return NextResponse.json({ success: false, error: 'Delivery API unavailable' }, { status: 502 })
  }
}
