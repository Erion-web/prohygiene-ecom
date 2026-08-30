import { Resend } from 'resend'
import { escapeHtml } from '@/lib/html-escape'

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

// ── Shared brand shell — table-based layout for Outlook/Gmail compatibility ──
function emailShell(bodyHtml: string, preheader?: string) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f1f5f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>` : ''}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 28px rgba(11,51,70,0.10);">
            <tr>
              <td style="background:linear-gradient(135deg,#0b3346,#175269 55%,#0e95bd);padding:26px 32px;">
                <span style="font-size:21px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">Pro<span style="color:#5ccef2;">Hygiene</span></span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;color:#1e293b;font-size:14px;line-height:1.65;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="background:#f8fafc;padding:20px 32px;border-top:1px solid #eef2f5;">
                <p style="margin:0;font-size:12px;color:#8291a3;line-height:1.7;">
                  ProHygiene · Rruga Rexhep Krasniqi, Prishtinë<br/>
                  046 10 80 40 · info@prohygiene.shop
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
}

function badge(text: string, bg: string, color: string) {
  return `<span style="display:inline-block;background:${bg};color:${color};font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px;">${text}</span>`
}

interface OrderItemInput {
  product_name_sq: string
  product_image_url: string | null
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
        <td style="padding:10px 0;border-bottom:1px solid #eef2f5;width:52px;">
          ${item.product_image_url
            ? `<img src="${item.product_image_url}" alt="" width="44" height="44" style="width:44px;height:44px;object-fit:cover;border-radius:10px;border:1px solid #eef2f5;display:block;" />`
            : `<div style="width:44px;height:44px;border-radius:10px;background:#ecfafd;"></div>`
          }
        </td>
        <td style="padding:10px 0 10px 12px;border-bottom:1px solid #eef2f5;color:#1e293b;">${escapeHtml(item.product_name_sq)} <span style="color:#94a3b8;">× ${item.quantity}</span></td>
        <td style="padding:10px 0;border-bottom:1px solid #eef2f5;text-align:right;font-weight:600;color:#1e293b;">${formatPrice(item.subtotal)}</td>
      </tr>`
    )
    .join('')
}

export async function sendOrderConfirmationEmail(order: OrderInput, items: OrderItemInput[]) {
  const resend = getClient()
  if (!resend) return

  const body = `
    <p style="margin:0 0 4px;">${badge(`Porosia #${escapeHtml(order.order_number)}`, '#ecfafd', '#0e95bd')}</p>
    <h1 style="margin:16px 0 8px;font-size:20px;color:#0b3346;">Faleminderit, ${escapeHtml(order.customer_name)}!</h1>
    <p style="margin:0 0 20px;color:#475569;">Porosia juaj u pranua dhe është duke u përpunuar. Do t&apos;ju kontaktojmë për dërgesën.</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">${orderItemsHtml(items)}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 24px;">
      <tr><td style="padding-top:12px;font-size:16px;font-weight:800;color:#0b3346;">Totali</td><td style="padding-top:12px;text-align:right;font-size:16px;font-weight:800;color:#0b3346;">${formatPrice(order.total)}</td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;">
      <tr><td style="padding:16px 18px;font-size:13px;color:#475569;">
        <strong style="color:#1e293b;">Dërgohet në:</strong> ${escapeHtml(order.address)}, ${escapeHtml(order.city)}
      </td></tr>
    </table>
    <p style="margin:24px 0 0;color:#64748b;font-size:13px;">Nëse keni pyetje, na kontaktoni në <strong>046 10 80 40</strong> ose <a href="mailto:info@prohygiene.shop" style="color:#0e95bd;">info@prohygiene.shop</a>.</p>
  `

  try {
    await resend.emails.send({
      from: FROM,
      to: order.customer_email,
      cc: CC,
      subject: `Porosia juaj #${order.order_number} u pranua — ProHygiene`,
      html: emailShell(body, `Porosia #${order.order_number} u pranua — totali ${formatPrice(order.total)}`),
    })
  } catch (err) {
    console.error('[email] Failed to send order confirmation:', err)
  }
}

export async function sendOrderNotificationEmail(order: OrderInput, items: OrderItemInput[]) {
  const resend = getClient()
  if (!resend) return

  const body = `
    <p style="margin:0 0 4px;">${badge('Porosi e re', '#fef3c7', '#b45309')}</p>
    <h1 style="margin:16px 0 16px;font-size:20px;color:#0b3346;">${escapeHtml(order.customer_name)}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:16px 18px;font-size:13px;color:#475569;line-height:1.8;">
        <strong style="color:#1e293b;">Email:</strong> ${escapeHtml(order.customer_email)}<br/>
        <strong style="color:#1e293b;">Telefoni:</strong> ${escapeHtml(order.customer_phone)}<br/>
        <strong style="color:#1e293b;">Dërgesa:</strong> ${escapeHtml(order.address)}, ${escapeHtml(order.city)}<br/>
        <strong style="color:#1e293b;">Pagesa:</strong> ${escapeHtml(order.payment_method)}
      </td></tr>
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">${orderItemsHtml(items)}</table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0 4px;">
      <tr><td style="padding-top:12px;font-size:16px;font-weight:800;color:#0b3346;">Totali</td><td style="padding-top:12px;text-align:right;font-size:16px;font-weight:800;color:#0b3346;">${formatPrice(order.total)}</td></tr>
    </table>
  `

  try {
    await resend.emails.send({
      from: FROM,
      to: STORE_EMAIL,
      cc: CC,
      subject: `Porosi e re #${order.order_number} — ${formatPrice(order.total)}`,
      html: emailShell(body, `Porosi e re nga ${order.customer_name} — ${formatPrice(order.total)}`),
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

  const body = `
    <p style="margin:0 0 4px;">${badge('Mesazh kontakti', '#ecfafd', '#0e95bd')}</p>
    <h1 style="margin:16px 0 16px;font-size:20px;color:#0b3346;">${escapeHtml(form.subject)}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border-radius:12px;margin-bottom:20px;">
      <tr><td style="padding:16px 18px;font-size:13px;color:#475569;line-height:1.8;">
        <strong style="color:#1e293b;">Emri:</strong> ${escapeHtml(form.name)}<br/>
        <strong style="color:#1e293b;">Email:</strong> ${escapeHtml(form.email)}<br/>
        ${form.phone ? `<strong style="color:#1e293b;">Telefoni:</strong> ${escapeHtml(form.phone)}<br/>` : ''}
      </td></tr>
    </table>
    <p style="margin:0 0 8px;color:#1e293b;font-weight:600;">Mesazhi:</p>
    <p style="white-space:pre-wrap;color:#475569;margin:0;">${escapeHtml(form.message)}</p>
  `

  await resend.emails.send({
    from: FROM,
    to: STORE_EMAIL,
    cc: CC,
    replyTo: form.email,
    subject: `[Kontakt] ${form.subject}`,
    html: emailShell(body, `Mesazh i ri nga ${form.name}`),
  })
  return { skipped: false }
}

interface LeaseInquiryInput {
  name: string
  email: string
  phone?: string
  company?: string
  message?: string
  productName: string
}

export async function sendLeaseInquiryEmail(form: LeaseInquiryInput) {
  const resend = getClient()
  if (!resend) return { skipped: true }

  const body = `
    <p style="margin:0 0 16px;">Kërkesë e re për <strong>shfrytëzim pajisjeje</strong>.</p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin-bottom:20px;">
      <tr><td style="padding:8px 0;border-bottom:1px solid #eef2f5;">
        <strong style="color:#1e293b;">Pajisja:</strong> ${escapeHtml(form.productName)}<br/>
        <strong style="color:#1e293b;">Emri:</strong> ${escapeHtml(form.name)}<br/>
        <strong style="color:#1e293b;">Email:</strong> ${escapeHtml(form.email)}<br/>
        ${form.phone ? `<strong style="color:#1e293b;">Telefoni:</strong> ${escapeHtml(form.phone)}<br/>` : ''}
        ${form.company ? `<strong style="color:#1e293b;">Kompania:</strong> ${escapeHtml(form.company)}<br/>` : ''}
      </td></tr>
    </table>
    ${form.message ? `<p style="white-space:pre-wrap;color:#475569;margin:0;">${escapeHtml(form.message)}</p>` : ''}
  `

  await resend.emails.send({
    from: FROM,
    to: STORE_EMAIL,
    cc: CC,
    replyTo: form.email,
    subject: `[Shfrytëzim] ${form.productName} — ${form.name}`,
    html: emailShell(body, `Kërkesë shfrytëzimi nga ${form.name}`),
  })
  return { skipped: false }
}

export async function sendLeaseReminderEmail(params: {
  to: string
  subject: string
  title: string
  message: string
}) {
  const resend = getClient()
  if (!resend) return { skipped: true }

  const body = `
    <p style="margin:0 0 8px;font-size:16px;font-weight:700;color:#1e293b;">${escapeHtml(params.title)}</p>
    <p style="white-space:pre-wrap;color:#475569;margin:0;">${escapeHtml(params.message)}</p>
  `

  await resend.emails.send({
    from: FROM,
    to: params.to,
    cc: CC,
    subject: params.subject,
    html: emailShell(body, params.title),
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
        html: emailShell(
          `${bodyHtml}
           <p style="margin-top:32px;font-size:11px;color:#94a3b8;">
             Po e merrni këtë email sepse jeni regjistruar në newsletter-in e ProHygiene.
             <a href="${appUrl}/api/newsletter/unsubscribe?token=${r.unsubscribe_token}" style="color:#0e95bd;">Çregjistrohu</a>
           </p>`
        ),
      }))
    )
  }

  return { sent: recipients.length, skipped: false }
}
