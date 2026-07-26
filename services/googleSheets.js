export async function saveToGoogleSheets(order) {
  const url = process.env.GOOGLE_SHEETS_URL

  if (!url) {
    console.warn('[GoogleSheets] Missing GOOGLE_SHEETS_URL')
    return false
  }

  const payload = {
    customerName: order.customerName,
    phoneNumber: order.phoneNumber,
    wilaya: order.wilaya,
    deliveryMethod: order.deliveryMethod === 'home' ? 'Home Delivery' : 'Stopdesk',
    address: order.address,
    notes: order.notes || '',
    productName: order.productName,
    productPrice: order.productPrice,
    deliveryPrice: order.deliveryPrice,
    totalPrice: order.totalPrice,
    quantity: order.quantity || 1,
    orderStatus: order.orderStatus || 'New',
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
