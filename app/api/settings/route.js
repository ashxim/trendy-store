import { NextResponse } from 'next/server'
import { isSupabaseConfigured } from '@/lib/supabase'

function isAuthorized(request) {
  const token = request.headers.get('x-admin-token') || ''
  return Boolean(process.env.ADMIN_TOKEN) && token === process.env.ADMIN_TOKEN
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function notConfigured() {
  return NextResponse.json(
    { error: 'Settings storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)' },
    { status: 503 }
  )
}

const ALLOWED_KEYS = ['heroImage']

async function pgrest(path, { method = 'GET', body } = {}) {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  const res = await fetch(url + '/rest/v1' + path, {
    method,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(body ? { Prefer: 'resolution=merge-duplicates' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const text = await res.text()
  return { status: res.status, json: text ? safeParse(text) : null }
}

function safeParse(text) {
  try { return JSON.parse(text) } catch (e) { return text }
}

export async function GET() {
  if (!isSupabaseConfigured()) return notConfigured()
  try {
    const { status, json } = await pgrest('/settings?select=key,value')
    if (status === 404 || (status >= 400 && /does not exist|not found|PGRST205/i.test(String(json?.message || json || '')))) {
      // settings table may not exist yet — treat as empty
      return NextResponse.json({ settings: {} })
    }
    if (status >= 400) throw new Error(`PostgREST ${status}: ${JSON.stringify(json)}`)
    const settings = {}
    ;(Array.isArray(json) ? json : []).forEach(row => { settings[row.key] = row.value })
    return NextResponse.json({ settings })
  } catch (error) {
    console.error('[API Settings] GET error:', error.message)
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 })
  }
}

export async function PUT(request) {
  if (!isAuthorized(request)) return unauthorized()
  if (!isSupabaseConfigured()) return notConfigured()
  try {
    const body = await request.json()
    const updates = {}
    ALLOWED_KEYS.forEach(key => {
      if (key in body) updates[key] = body[key]
    })
    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'No valid settings provided' }, { status: 400 })
    }
    const rows = Object.entries(updates).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }))
    const { status, json } = await pgrest('/settings?on_conflict=key', { method: 'POST', body: rows })
    if (status >= 400) throw new Error(`PostgREST ${status}: ${JSON.stringify(json)}`)
    return NextResponse.json({ success: true, settings: updates })
  } catch (error) {
    console.error('[API Settings] PUT error:', error.message)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}
