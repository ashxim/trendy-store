import { NextResponse } from 'next/server'
import { getCommunes, isDeliveryConfigured } from '@/services/delivery'

export async function GET(request) {
  if (!isDeliveryConfigured()) {
    return NextResponse.json({ success: false, error: 'Delivery API unavailable' }, { status: 503 })
  }
  const { searchParams } = new URL(request.url)
  const wilayaId = searchParams.get('wilaya_id')
  if (!wilayaId) {
    return NextResponse.json({ success: false, error: 'wilaya_id is required' }, { status: 400 })
  }
  try {
    const communes = await getCommunes(wilayaId)
    return NextResponse.json({ communes })
  } catch (error) {
    console.error('[API Delivery] communes error:', error.message)
    return NextResponse.json({ success: false, error: 'Delivery API unavailable' }, { status: 502 })
  }
}
