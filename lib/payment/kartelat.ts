import crypto from 'crypto'

function formatAmount(amount: number): string {
  return parseFloat(amount.toFixed(2)).toString()
}

function hmac512(str: string, key: string): string {
  return crypto.createHmac('sha512', key).update(str, 'utf8').digest('hex')
}

export function buildPurchaseSignature(
  merchantId: string,
  orderId: string,
  amount: number,
  currency: string,
  description: string,
  secretKey: string
): string {
  return hmac512([merchantId, orderId, formatAmount(amount), currency, description].join(';'), secretKey)
}

export function verifyCallbackSignature(
  merchantId: string,
  orderReference: string,
  amount: string,
  currency: string,
  secretKey: string,
  received: string
): boolean {
  const expected = hmac512([merchantId, orderReference, amount, currency].join(';'), secretKey)
  const expectedBuf = Buffer.from(expected)
  const receivedBuf = Buffer.from(received)
  if (expectedBuf.length !== receivedBuf.length) return false
  return crypto.timingSafeEqual(expectedBuf, receivedBuf)
}

export interface PurchaseParams {
  merchant_id: string
  order_id: string
  amount: number
  currency_iso: string
  description: string
  approve_url: string
  decline_url: string
  cancel_url: string
  callback_url: string
  email?: string
  client_first_name?: string
  client_last_name?: string
  phone?: string
  language?: string
}

export async function createKartelatPayment(
  params: PurchaseParams,
  secretKey: string,
  apiUrl: string
): Promise<string> {
  const signature = buildPurchaseSignature(
    params.merchant_id,
    params.order_id,
    params.amount,
    params.currency_iso,
    params.description,
    secretKey
  )

  const body = {
    operation: 'Purchase',
    merchant_id: params.merchant_id,
    order_id: params.order_id,
    amount: parseFloat(formatAmount(params.amount)),
    currency_iso: params.currency_iso,
    description: params.description,
    approve_url: params.approve_url,
    decline_url: params.decline_url,
    cancel_url: params.cancel_url,
    callback_url: params.callback_url,
    redirect: 0,
    language: params.language ?? 'en',
    email: params.email ?? '',
    client_first_name: params.client_first_name ?? '',
    client_last_name: params.client_last_name ?? '',
    signature,
    add_params: {},
  }

  const res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()

  if (data.result !== 0 || !data.url) {
    throw new Error(data.message ?? 'Payment creation failed')
  }

  return data.url as string
}
