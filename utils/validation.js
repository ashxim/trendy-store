export function validateOrder(data) {
  const errors = []

  if (!data.customerName || data.customerName.trim().length < 2) {
    errors.push('customerName')
  }

  if (!data.phoneNumber || data.phoneNumber.replace(/\D/g, '').length < 8) {
    errors.push('phoneNumber')
  }

  if (!data.wilaya || data.wilaya.trim().length === 0) {
    errors.push('wilaya')
  }

  if (data.wilayaId != null && Number.isNaN(Number(data.wilayaId))) {
    errors.push('wilayaId')
  }

  // commune and deliveryMethod are optional for backward compatibility with
  // cached pre-rework pages. When present they are validated; otherwise sane
  // defaults are applied in sanitizeOrder.
  if (data.commune !== undefined && data.commune !== null && data.commune.trim().length > 0 && data.commune.trim().length < 2) {
    errors.push('commune')
  }

  if (data.deliveryMethod !== undefined && data.deliveryMethod !== null && !['home', 'stopdesk'].includes(data.deliveryMethod)) {
    errors.push('deliveryMethod')
  }

  // desk is required only for modern stopdesk payloads (they always send a
  // deskId field, even empty). Legacy cached pages send stopdesk without any
  // desk fields; those orders are accepted and the desk defaults to the
  // wilaya name in sanitizeOrder so they still reach Telegram/Sheets.
  if (data.deliveryMethod === 'stopdesk' && data.deskId !== undefined && (!data.desk || data.desk.trim().length === 0)) {
    errors.push('desk')
  }

  if (!data.address || data.address.trim().length < 5) {
    errors.push('address')
  }

  if (!data.productName || String(data.productName).trim().length === 0) {
    errors.push('productName')
  }

  if (data.quantity !== undefined) {
    const qty = Number(data.quantity)
    if (!Number.isInteger(qty) || qty < 1 || qty > 99) {
      errors.push('quantity')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function sanitizeOrder(data) {
  const method = ['home', 'stopdesk'].includes(data.deliveryMethod) ? data.deliveryMethod : 'home'
  return {
    customerName: data.customerName.trim(),
    phoneNumber: data.phoneNumber.trim(),
    wilaya: data.wilaya.trim(),
    wilayaId: data.wilayaId != null ? Number(data.wilayaId) : null,
    commune: (data.commune || data.wilaya || '').trim(),
    communeId: (data.communeId || '').trim(),
    deliveryMethod: method,
    desk: method === 'stopdesk' ? ((data.desk || '').trim() || data.wilaya.trim()) : (data.desk || '').trim(),
    deskId: (data.deskId || '').trim(),
    address: data.address.trim(),
    notes: (data.notes || '').trim(),
    productName: String(data.productName || 'BIOAQUA Lash Growth Serum').trim(),
    productPrice: Math.max(0, Number(data.productPrice) || 0),
    deliveryPrice: Math.max(0, Number(data.deliveryPrice) || 0),
    totalPrice: Math.max(0, Number(data.totalPrice) || 0),
    quantity: Math.min(99, Math.max(1, parseInt(data.quantity, 10) || 1)),
    orderDate: new Date().toISOString(),
    orderStatus: 'Pending',
  }
}
