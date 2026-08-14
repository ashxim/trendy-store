import { NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

function notConfigured() {
  return NextResponse.json(
    { error: 'Supabase is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)' },
    { status: 503 }
  )
}

export async function GET() {
  if (!isSupabaseConfigured()) return notConfigured()
  try {
    const { data, error } = await supabaseAdmin.from('products').select('id').limit(1)
    if (error) throw new Error(error.message)
    return NextResponse.json({ ok: true, alive: true, checkedAt: new Date().toISOString() })
  } catch (error) {
    console.error('[API KeepAlive] error:', error.message)
    return NextResponse.json({ ok: false, alive: false }, { status: 500 })
  }
}
