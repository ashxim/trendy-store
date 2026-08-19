export async function saveToGoogleSheets(order) {
  const url = process.env.GOOGLE_SHEETS_URL

  if (!url) {
    console.warn('[GoogleSheets] Missing GOOGLE_SHEETS_URL')
    return false
  }

  // Format multi-item for sheets display
  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    { name: order.productName, quantity: order.quantity || 1, unitPrice: order.productPrice, subtotal: order.productPrice }
  ]
  const itemsDisplay = items.map((it, i) => `${i + 1}. ${it.name} (${it.quantity}×${it.unitPrice}=${it.subtotal})`).join('\n')

  const payload = {
    customerName: order.customerName,
    phoneNumber: "'" + order.phoneNumber,
    wilaya: order.wilaya,
    wilayaId: order.wilayaId != null ? String(order.wilayaId) : '',
    commune: order.commune || '',
    communeId: order.communeId || '',
    deliveryMethod: order.deliveryMethod === 'home' ? 'Home Delivery' : 'Stopdesk',
    desk: order.desk || '',
    deskId: order.deskId || '',
    address: order.address,
    notes: order.notes || '',
    productName: order.productName,
    productPrice: String(order.productPrice),
    deliveryPrice: String(order.deliveryPrice),
    totalPrice: String(order.totalPrice),
    quantity: String(order.quantity || 1),
    orderStatus: order.orderStatus || 'New',
    items: itemsDisplay,
  }

  console.log('[GoogleSheets] Sending order:', JSON.stringify(payload))

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    console.log('[GoogleSheets] Response status:', res.status)
    const text = await res.text()
    console.log('[GoogleSheets] Response body:', text)

    if (!res.ok) {
      console.error('[GoogleSheets] HTTP error:', res.status, text)
      return false
    }
    return true
  } catch (error) {
    console.error('[GoogleSheets] Network error:', error.message)
    return false
  }
}
