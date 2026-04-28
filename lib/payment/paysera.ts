import crypto from 'crypto'

export interface PayseraRequest {
  projectid: string
  orderid: string
  accepturl: string
  cancelurl: string
  callbackurl: string
  payment: string
  version: string
  amount: string
  currency: string
  country: string
  paytext: string
  firstname?: string
  lastname?: string
  email?: string
  p_email?: string
  lang: string
  test?: string
}

export function buildPayseraData(params: Record<string, string>): string {
  const query = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
    .join('&')

  return Buffer.from(query).toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

export function signPayseraData(data: string, password: string): string {
  return crypto
    .createHash('md5')
    .update(data + password)
    .digest('hex')
}

export function buildPayseraPaymentUrl(params: PayseraRequest, signPassword: string): string {
  const paymentUrl = process.env.PAYSERA_PAYMENT_URL ?? 'https://www.paysera.com/pay/'

  const data = buildPayseraData(params as unknown as Record<string, string>)
  const sign = signPayseraData(data, signPassword)

  return `${paymentUrl}?data=${data}&sign=${sign}`
}

export function verifyPayseraCallback(
  data: string,
  ss1: string,
  signPassword: string
): boolean {
  const expectedSign = crypto
    .createHash('md5')
    .update(data + signPassword)
    .digest('hex')
  return expectedSign === ss1
}

export function parsePayseraCallback(data: string): Record<string, string> {
  const decoded = Buffer.from(
    data.replace(/-/g, '+').replace(/_/g, '/'),
    'base64'
  ).toString('utf8')

  const params: Record<string, string> = {}
  decoded.split('&').forEach(pair => {
    const [k, v] = pair.split('=')
    if (k) params[decodeURIComponent(k)] = decodeURIComponent(v ?? '')
  })
  return params
}
