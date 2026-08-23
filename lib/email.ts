import { Resend } from 'resend'

const FROM = 'ProHygiene <info@prohygiene.shop>'
const STORE_EMAIL = 'info@prohygiene.shop'
const CC = 'besnikv@shtepiaku.com'

function getClient(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    console.warn('[email] RESEND_API_KEY is not set — skipping email send. See README for setup.')
    return null
  }
  return new Resend(key)
}

function formatPrice(n: number) {
  return `€${n.toFixed(2)}`
}

interface OrderItemInput {
  product_name_sq: string
  quantity: number
  subtotal: number
}

interface OrderInput {
  order_number: string
  customer_name: string
  customer_email: string
  customer_phone: string
  city: string
  address: string
  total: number
  payment_method: string
}

function orderItemsHtml(items: OrderItemInput[]) {
  return items
    .map(
      item => `<tr>
        <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.product_name_sq} × ${item.quantity}</td>
        <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${formatPrice(item.subtotal)}</td>
      </tr>`
    )
    .join('')
}

export async function sendOrderConfirmationEmail(order: OrderInput, items: OrderItemInput[]) {
  const resend = getClient()
  if (!resend) return

  try {
    await resend.emails.send({
      from: FROM,
      to: order.customer_email,
      cc: CC,
      subject: `Porosia juaj #${order.order_number} u pranua — ProHygiene`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
          <h2>Faleminderit për porosinë, ${order.customer_name}!</h2>
          <p>Porosia juaj <strong>#${order.order_number}</strong> u pranua dhe është duke u përpunuar.</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">${orderItemsHtml(items)}</table>
          <p style="font-weight:bold;font-size:16px;">Totali: ${formatPrice(order.total)}</p>
          <p>Dërgohet në: ${order.address}, ${order.city}</p>
          <p>Nëse keni pyetje, na kontaktoni në 046 10 80 40 ose info@prohygiene.shop.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[email] Failed to send order confirmation:', err)
  }
}

export async function sendOrderNotificationEmail(order: OrderInput, items: OrderItemInput[]) {
  const resend = getClient()
  if (!resend) return

  try {
    await resend.emails.send({
      from: FROM,
      to: STORE_EMAIL,
      cc: CC,
      subject: `Porosi e re #${order.order_number} — ${formatPrice(order.total)}`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
          <h2>Porosi e re nga ${order.customer_name}</h2>
          <p>${order.customer_email} · ${order.customer_phone}</p>
          <table style="width:100%;border-collapse:collapse;margin:16px 0;">${orderItemsHtml(items)}</table>
          <p style="font-weight:bold;font-size:16px;">Totali: ${formatPrice(order.total)}</p>
          <p>Dërgesa: ${order.address}, ${order.city}</p>
          <p>Pagesa: ${order.payment_method}</p>
        </div>
      `,
    })
  } catch (err) {
    console.error('[email] Failed to send order notification:', err)
  }
}

interface ContactFormInput {
  name: string
  email: string
  phone?: string
  subject: string
  message: string
}

export async function sendContactFormEmail(form: ContactFormInput) {
  const resend = getClient()
  if (!resend) return { skipped: true }

  await resend.emails.send({
    from: FROM,
    to: STORE_EMAIL,
    cc: CC,
    replyTo: form.email,
    subject: `[Kontakt] ${form.subject}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
        <h2>Mesazh i ri nga faqja e kontaktit</h2>
        <p><strong>Emri:</strong> ${form.name}</p>
        <p><strong>Email:</strong> ${form.email}</p>
        ${form.phone ? `<p><strong>Telefoni:</strong> ${form.phone}</p>` : ''}
        <p><strong>Subjekti:</strong> ${form.subject}</p>
        <p><strong>Mesazhi:</strong></p>
        <p style="white-space:pre-wrap;">${form.message}</p>
      </div>
    `,
  })
  return { skipped: false }
}

interface NewsletterRecipient {
  email: string
  unsubscribe_token: string
}

// Resend's batch endpoint accepts up to 100 messages per call.
const BATCH_SIZE = 100

// Note: newsletter blasts are intentionally NOT cc'd to besnikv@shtepiaku.com —
// that would send him one copy per subscriber. He can be added as a normal
// recipient in the "test send" step instead.
export async function sendNewsletterCampaign(
  subject: string,
  bodyHtml: string,
  recipients: NewsletterRecipient[]
): Promise<{ sent: number; skipped: boolean }> {
  const resend = getClient()
  if (!resend) return { sent: 0, skipped: true }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://prohygiene.shop'

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE)
    await resend.batch.send(
      batch.map(r => ({
        from: FROM,
        to: r.email,
        subject,
        html: `
          <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a;">
            ${bodyHtml}
            <p style="margin-top:32px;font-size:11px;color:#999;">
              Po e merrni këtë email sepse jeni regjistruar në newsletter-in e ProHygiene.
              <a href="${appUrl}/api/newsletter/unsubscribe?token=${r.unsubscribe_token}">Çregjistrohu</a>
            </p>
          </div>
        `,
      }))
    )
  }

  return { sent: recipients.length, skipped: false }
}
