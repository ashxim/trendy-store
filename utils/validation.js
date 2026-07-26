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

  if (!data.deliveryMethod || !['home', 'stopdesk'].includes(data.deliveryMethod)) {
    errors.push('deliveryMethod')
  }

  if (!data.address || data.address.trim().length < 5) {
    errors.push('address')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

export function sanitizeOrder(data) {
  return {
    customerName: data.customerName.trim(),
    phoneNumber: data.phoneNumber.trim(),
    wilaya: data.wilaya.trim(),
    deliveryMethod: data.deliveryMethod,
    address: data.address.trim(),
    notes: (data.notes || '').trim(),
    productName: data.productName || 'BIOAQUA Lash Growth Serum',
    productPrice: Number(data.productPrice) || 0,
    deliveryPrice: Number(data.deliveryPrice) || 0,
    totalPrice: Number(data.totalPrice) || 0,
    quantity: 1,
    orderDate: new Date().toISOString(),
    orderStatus: 'Pending',
  }
}
