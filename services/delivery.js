const BASE_URL = (process.env.DELIVERY_API_URL || '').trim()
const TOKEN = (process.env.DELIVERY_API_TOKEN || '').trim()

const TIMEOUT_MS = 10000

const cache = new Map()
const CACHE_TTL = 10 * 60 * 1000

export function isDeliveryConfigured() {
  return Boolean(BASE_URL && TOKEN)
}

async function apiGet(path) {
  if (!isDeliveryConfigured()) throw new Error('Delivery API is not configured')
  const cached = cache.get(path)
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.data
  const res = await fetch(BASE_URL + path, {
    headers: { Authorization: 'Bearer ' + TOKEN },
    signal: AbortSignal.timeout(TIMEOUT_MS),
  })
  if (!res.ok) throw new Error('Delivery API responded with ' + res.status)
  const data = await res.json()
  cache.set(path, { at: Date.now(), data })
  return data
}

export async function getWilayas() {
  const data = await apiGet('/api/v1/get/wilayas')
  return Array.isArray(data) ? data : []
}

export async function getCommunes(wilayaId) {
  const data = await apiGet('/api/v1/get/communes?wilaya_id=' + encodeURIComponent(wilayaId))
  return Array.isArray(data) ? data : []
}

export async function getDesks() {
  const data = await apiGet('/api/v1/get/desks')
  const list = Array.isArray(data?.other_desks) ? data.other_desks : []
  const mine = data?.my_desk
  if (mine?.location && mine.location.commune) {
    const loc = mine.location
    const wilayaName = (loc.wilaya || '').toString()
    const match = list.find(d => String(d.wilaya || '').toLowerCase() === wilayaName.toLowerCase())
    list.push({
      name: mine.hub_name || mine.name || 'Hub',
      phone: loc.phone,
      phone2: loc.phone2,
      code_wilaya: loc.wilaya?.code_wilaya != null ? String(loc.wilaya.code_wilaya) : (match ? String(match.code_wilaya) : ''),
      wilaya: wilayaName,
      commune: loc.commune,
      adresse: loc.adresse,
      map: loc.map,
    })
  }
  return list
}

export async function getFees() {
  const data = await apiGet('/api/v1/get/fees')
  const list = Array.isArray(data?.livraison) ? data.livraison : []
  return list.map(f => ({
    wilaya_id: Number(f.wilaya_id),
    home: Number(f.tarif) || 0,
    stopdesk: Number(f.tarif_stopdesk) || 0,
  }))
}
