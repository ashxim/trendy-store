export async function saveToGoogleSheets(order) {
  const url = process.env.GOOGLE_SHEETS_URL

  if (!url) {
    console.warn('[GoogleSheets] Missing GOOGLE_SHEETS_URL')
    return false
  }

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ID: Date.now().toString(36) + Math.random().toString(36).slice(2, 6).toUpperCase(),
        customerName: order.customerName,
        phoneNumber: order.phoneNumber,
        wilaya: order.wilaya,
        deliveryMethod: order.deliveryMethod === 'home' ? 'Home Delivery' : 'Stopdesk',
        address: order.address,
        notes: order.notes || '—',
        productName: order.productName,
        productPrice: order.productPrice,
        deliveryPrice: order.deliveryPrice,
        totalPrice: order.totalPrice,
        quantity: order.quantity,
        orderStatus: order.orderStatus,
        date: new Date(order.orderDate).toLocaleDateString('en-DZ'),
        time: new Date(order.orderDate).toLocaleTimeString('en-DZ'),
      }),
    })

    return true
  } catch (error) {
    console.error('[GoogleSheets] Error:', error.message)
    return false
  }
}
