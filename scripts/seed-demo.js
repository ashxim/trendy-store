// Seeds demo offers + the hero image setting.
// Run AFTER applying supabase/migration.sql (columns must exist):
//   node scripts/seed-demo.js
const fs = require('fs')

function env(key) {
  const line = fs.readFileSync('.env.local', 'utf8').split('\n').find(l => l.startsWith(key + '='))
  return line ? line.slice(key.length + 1).trim() : ''
}

const url = env('SUPABASE_URL')
const key = env('SUPABASE_SERVICE_ROLE_KEY')

if (!url || !key) {
  console.error('Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const API = url + '/rest/v1'

async function req(path, opts = {}) {
  const res = await fetch(API + path, {
    ...opts,
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${opts.method || 'GET'} ${path} -> ${res.status}: ${text.slice(0, 200)}`)
  return text ? JSON.parse(text) : null
}

async function main() {
  // 1) Demo offers on the existing products (regular_price > price, offer_active on)
  const offers = [
    { id: 'biowaqua', regular_price: 1900, offer_active: false, offer_badge: '', active: true },
    { id: 'tawreed-cream', regular_price: 3000, offer_active: true, offer_badge: '', active: true },
    { id: 'tocobo-sunscreen', regular_price: 4500, offer_active: false, offer_badge: '', active: true },
  ]
  for (const o of offers) {
    const row = await req(`/products?id=eq.${o.id}`, { method: 'GET' })
    if (!row || !row.length) { console.log('skip (not found):', o.id); continue }
    const patch = {
      regular_price: o.regular_price,
      offer_active: o.offer_active,
      offer_badge: o.offer_badge,
      active: o.active,
    }
    // Backfill images array from the single image if it's empty (products were
    // seeded before the images column existed).
    if ((!row[0].images || !row[0].images.length) && row[0].image) patch.images = [row[0].image]
    await req(`/products?id=eq.${o.id}`, { method: 'PATCH', body: JSON.stringify(patch) })
    console.log('offer updated:', o.id, 'reg=' + o.regular_price, 'active=' + o.offer_active)
  }

  // 1b) Fixed-price bundle offer on biowaqua (buy 2 for 2900) — guarded:
  //    needs the bundle column added by migration.sql. This is the primary
  //    offer (featured), fully separate from the single-unit price.
  try {
    await req('/products?id=eq.biowaqua', {
      method: 'PATCH',
      body: JSON.stringify({
        bundle: {
          qty: 2,
          price: 2900,
          title: 'عرض خاص — 2 بيوأكوا',
          badge: 'وفر 900 د.ج',
          active: true,
          featured: true,
        },
      }),
    })
    console.log('bundle set: biowaqua 2 for 2900')
  } catch (e) {
    console.warn('bundle seed skipped (bundle column missing):', e.message)
  }

  // 2) Hero image setting — only set if none exists yet (don't overwrite the
  //    image the owner uploaded from the dashboard).
  // value is stored as a plain JSON string (the URL), not an object
  const existing = await req('/settings?key=eq.heroImage', { method: 'GET' }).catch(() => null)
  if (existing && existing.length && existing[0].value) {
    console.log('heroImage already set — keeping:', existing[0].value)
    return
  }
  const hero = url + '/storage/v1/object/public/product-images/products/hero-main.jpg'
  const img = fs.readFileSync('public/images/hero/main-product.jpg')
  const up = await fetch(url + '/storage/v1/object/product-images/products/hero-main.jpg', {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true',
    },
    body: img,
  })
  if (!up.ok) console.warn('hero upload status', up.status)
  else console.log('hero image uploaded to storage')

  await req('/settings', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates' },
    body: JSON.stringify([{ key: 'heroImage', value: hero, updated_at: new Date().toISOString() }]),
  })
  console.log('heroImage setting saved:', hero)
}

main().catch(e => { console.error(e.message); process.exit(1) })
