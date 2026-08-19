const TELEGRAM_API = 'https://api.telegram.org/bot'

function formatMessage(order) {
  const lines = [
    '--------------------------------',
    '🔥 NEW ORDER - Trendy Store',
    '--------------------------------',
    '',
    `👤 Customer: ${order.customerName}`,
    `📱 Phone: ${order.phoneNumber}`,
    `📍 Wilaya: ${order.wilaya}${order.wilayaId ? ` (ID ${order.wilayaId})` : ''}`,
    `🏙 Commune: ${order.commune || '—'}`,
    `🚚 Delivery: ${order.deliveryMethod === 'home' ? 'Home Delivery' : 'Stopdesk'}`,
    ...(order.deliveryMethod === 'stopdesk' && order.desk ? [`📦 Desk: ${order.desk}`] : []),
    `🏠 Address: ${order.address}`,
    `📝 Notes: ${order.notes || '—'}`,
    '',
  ]

  // Multi-item support
  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    { name: order.productName, quantity: order.quantity || 1, unitPrice: order.productPrice, subtotal: order.productPrice }
  ]

  lines.push('📦 Products:')
  items.forEach((item, i) => {
    lines.push(`${i + 1}. ${item.name}`)
    lines.push(`   ${item.quantity} × ${Number(item.unitPrice).toLocaleString()} DA = ${Number(item.subtotal).toLocaleString()} DA`)
  })
  lines.push('')

  lines.push(`🚚 Delivery: ${Number(order.deliveryPrice).toLocaleString()} DA`)
  lines.push(`💵 Total: ${Number(order.totalPrice).toLocaleString()} DA`)
  lines.push('')
  lines.push(`📦 Status: ${order.orderStatus}`)
  lines.push('')
  lines.push(`🕒 Date: ${new Date(order.orderDate).toLocaleString('en-DZ')}`)
  lines.push('--------------------------------')

  return lines.join('\n')
}

export async function sendTelegramNotification(order) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) {
    console.warn('[Telegram] Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID')
    return false
  }

  const text = formatMessage(order)

  try {
    const res = await fetch(`${TELEGRAM_API}${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('[Telegram] API error:', err)
      return false
    }

    return true
  } catch (error) {
    console.error('[Telegram] Network error:', error.message)
    return false
  }
}
