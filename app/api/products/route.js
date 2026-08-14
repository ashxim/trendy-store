import { NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'

function isAuthorized(request) {
  const token = request.headers.get('x-admin-token') || ''
  return Boolean(process.env.ADMIN_TOKEN) && token === process.env.ADMIN_TOKEN
}

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

function notConfigured() {
  return NextResponse.json(
    { error: 'Products storage is not configured (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing)' },
    { status: 503 }
  )
}

/* Optional columns were added to schema.sql after the table may already exist.
   Detect each once per process so the API works with or without them. */
const OPTIONAL_COLUMNS = ['images', 'regular_price', 'offer_active', 'offer_start', 'offer_end', 'offer_badge', 'active', 'bundle']
let columnsKnown = false
const available = new Set()

async function detectColumns() {
  if (columnsKnown) return
  columnsKnown = true
  await Promise.all(OPTIONAL_COLUMNS.map(async (col) => {
    try {
      const { error } = await supabaseAdmin.from('products').select(col).limit(1)
      if (!error) available.add(col)
    } catch { /* not available */ }
  }))
}

const has = (col) => available.has(col)

function toDb(p) {
  const row = {
    id: String(p.id || '').trim(),
    name: String(p.name || '').trim(),
    short: p.short ? String(p.short).trim() : null,
    tagline: p.tagline ? String(p.tagline).trim() : null,
    price: Math.max(0, Number(p.price) || 0),
    old_price: p.oldPrice != null ? Math.max(0, Number(p.oldPrice) || 0) : null,
    image: p.image ? String(p.image).trim() : null,
    badge: p.badge ? String(p.badge).trim() : null,
    featured: Boolean(p.featured),
    rating: Number(p.rating) || 5,
    reviews: p.reviews ? String(p.reviews).trim() : null,
    benefits: Array.isArray(p.benefits) ? p.benefits : [],
    sort_order: Number(p.sortOrder) || 0,
  }
  if (has('images') && Array.isArray(p.images)) row.images = p.images.map(String).filter(Boolean)
  if (has('regular_price') && p.regularPrice != null) row.regular_price = Math.max(0, Number(p.regularPrice) || 0)
  if (has('offer_active')) row.offer_active = Boolean(p.offerActive)
  if (has('offer_start') && p.offerStart) row.offer_start = String(p.offerStart).slice(0, 10) || null
  if (has('offer_end') && p.offerEnd) row.offer_end = String(p.offerEnd).slice(0, 10) || null
  if (has('offer_badge') && p.offerBadge) row.offer_badge = String(p.offerBadge).trim()
  if (has('active')) row.active = p.active !== false
  if (has('bundle')) {
    if (p.bundle && Number(p.bundle.qty) >= 2 && Number(p.bundle.price) > 0) {
      row.bundle = {
        qty: Number(p.bundle.qty),
        price: Number(p.bundle.price),
        title: p.bundle.title ? String(p.bundle.title).trim() : '',
        badge: p.bundle.badge ? String(p.bundle.badge).trim() : '',
        image: p.bundle.image ? String(p.bundle.image).trim() : '',
        active: p.bundle.active !== false,
        featured: Boolean(p.bundle.featured),
      }
    } else {
      row.bundle = null
    }
  }
  return row
}

function fromDb(p) {
  const images = Array.isArray(p.images) ? p.images.map(String).filter(Boolean) : []
  return {
    id: p.id,
    name: p.name,
    short: p.short || undefined,
    tagline: p.tagline || '',
    price: Number(p.price) || 0,
    regularPrice: p.regular_price != null ? Number(p.regular_price) : undefined,
    oldPrice: p.old_price != null ? Number(p.old_price) : undefined,
    image: p.image || images[0] || '',
    images: images.length ? images : (p.image ? [p.image] : []),
    badge: p.badge || '',
    featured: Boolean(p.featured),
    offerActive: Boolean(p.offer_active),
    offerStart: p.offer_start || undefined,
    offerEnd: p.offer_end || undefined,
    offerBadge: p.offer_badge || '',
    bundle: (p.bundle && Number(p.bundle.qty) >= 2 && Number(p.bundle.price) > 0)
      ? {
          qty: Number(p.bundle.qty),
          price: Number(p.bundle.price),
          title: p.bundle.title || '',
          badge: p.bundle.badge || '',
          image: p.bundle.image || '',
          active: p.bundle.active !== false,
          featured: Boolean(p.bundle.featured),
        }
      : null,
    active: p.active !== false,
    rating: Number(p.rating) || 5,
    reviews: p.reviews || '',
    benefits: Array.isArray(p.benefits) ? p.benefits : [],
    sortOrder: Number(p.sort_order) || 0,
  }
}

function validate(p) {
  const errors = []
  if (!p.name || !String(p.name).trim()) errors.push('name')
  if (!(Number(p.price) >= 0)) errors.push('price')
  if (p.id && !/^[a-z0-9-]+$/.test(String(p.id))) errors.push('id')
  return errors
}

export async function GET() {
  if (!isSupabaseConfigured()) return notConfigured()
  try {
    await detectColumns()
    const { data, error } = await supabaseAdmin
      .from('products')
      .select('*')
      .order('featured', { ascending: false })
      .order('sort_order', { ascending: true })
    if (error) throw new Error(error.message)
    return NextResponse.json({ products: (data || []).map(fromDb) })
  } catch (error) {
    console.error('[API Products] GET error:', error.message)
    return NextResponse.json({ error: 'Failed to load products' }, { status: 500 })
  }
}

export async function POST(request) {
  if (!isAuthorized(request)) return unauthorized()
  if (!isSupabaseConfigured()) return notConfigured()
  try {
    await detectColumns()
    const body = await request.json()
    const errors = validate(body)
    if (errors.length) {
      return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin.from('products').insert([toDb(body)]).select()
    if (error) throw new Error(error.message)
    return NextResponse.json({ product: fromDb(data[0]) }, { status: 201 })
  } catch (error) {
    console.error('[API Products] POST error:', error.message)
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 })
  }
}

export async function PUT(request) {
  if (!isAuthorized(request)) return unauthorized()
  if (!isSupabaseConfigured()) return notConfigured()
  try {
    await detectColumns()
    const body = await request.json()
    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    const errors = validate(body)
    if (errors.length) {
      return NextResponse.json({ error: 'Validation failed', errors }, { status: 400 })
    }
    const { data, error } = await supabaseAdmin.from('products').update(toDb(body)).eq('id', body.id).select()
    if (error) throw new Error(error.message)
    if (!data || !data.length) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }
    return NextResponse.json({ product: fromDb(data[0]) })
  } catch (error) {
    console.error('[API Products] PUT error:', error.message)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request) {
  if (!isAuthorized(request)) return unauthorized()
  if (!isSupabaseConfigured()) return notConfigured()
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    const { error } = await supabaseAdmin.from('products').delete().eq('id', id)
    if (error) throw new Error(error.message)
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[API Products] DELETE error:', error.message)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}
