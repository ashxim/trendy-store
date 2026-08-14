import { NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

const BUCKET = 'product-images'

function isAuthorized(request) {
  const token = request.headers.get('x-admin-token') || ''
  return Boolean(process.env.ADMIN_TOKEN) && token === process.env.ADMIN_TOKEN
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function notConfigured() {
  return NextResponse.json(
    { error: 'Storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)' },
    { status: 503 }
  )
}

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/avif': 'avif',
}

function sanitizeName(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'image'
}

export async function POST(request) {
  if (!isAuthorized(request)) return unauthorized()
  if (!isSupabaseConfigured()) return notConfigured()
  try {
    const form = await request.formData()
    const file = form.get('file')
    if (!file || typeof file.arrayBuffer !== 'function') {
      return NextResponse.json({ error: 'Missing file' }, { status: 400 })
    }
    if (file.size > 8 * 1024 * 1024) {
      return NextResponse.json({ error: 'Image too large (max 8MB)' }, { status: 400 })
    }
    const ext = EXT_BY_MIME[file.type] || sanitizeName(file.name).split('.').pop() || 'jpg'
    const folder = sanitizeName(form.get('folder') || 'products')
    const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`

    const buffer = Buffer.from(await file.arrayBuffer())
    const { error } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type || 'image/jpeg', upsert: true })

    if (error) throw new Error(error.message)

    const { data } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(path)
    return NextResponse.json({ url: data.publicUrl, path }, { status: 201 })
  } catch (error) {
    console.error('[API Upload] POST error:', error.message)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

export async function DELETE(request) {
  if (!isAuthorized(request)) return unauthorized()
  if (!isSupabaseConfigured()) return notConfigured()
  try {
    const { searchParams } = new URL(request.url)
    const path = searchParams.get('path')
    if (!path) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 })
    }
    const { error } = await supabaseAdmin.storage.from(BUCKET).remove([path])
    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API Upload] DELETE error:', error.message)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
