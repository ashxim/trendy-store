const TELEGRAM_API = 'https://api.telegram.org/bot'

function formatMessage(order) {
  const qty = order.quantity || 1
  const lines = [
    '--------------------------------',
    '🔥 NEW ORDER - Trendy Store',
    '--------------------------------',
    '',
    `🛍 Product: ${order.productName}`,
    `📦 Quantity: ${qty}`,
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
    `💰 Unit Price: ${order.productPrice.toLocaleString()} DA`,
    `🚚 Delivery Price: ${order.deliveryPrice.toLocaleString()} DA`,
    `💵 Total: ${order.totalPrice.toLocaleString()} DA`,
    '',
    `📦 Status: ${order.orderStatus}`,
    '',
    `🕒 Date: ${new Date(order.orderDate).toLocaleString('en-DZ')}`,
    '--------------------------------',
  ]

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
