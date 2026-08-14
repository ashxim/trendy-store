import { NextResponse } from 'next/server'
import { getWilayas, isDeliveryConfigured } from '@/services/delivery'

export async function GET() {
  if (!isDeliveryConfigured()) {
    return NextResponse.json({ success: false, error: 'Delivery API unavailable' }, { status: 503 })
  }
  try {
    const wilayas = await getWilayas()
    return NextResponse.json({ wilayas })
  } catch (error) {
    console.error('[API Delivery] wilayas error:', error.message)
    return NextResponse.json({ success: false, error: 'Delivery API unavailable' }, { status: 502 })
  }
}
