import { getComparisonAiSettings } from '@/lib/comparisons/ai-settings'
import {
  COMPARISON_TOOL_DEFINITIONS,
  runComparisonTool,
} from '@/lib/comparisons/chat-tools'

type ChatMessage = {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  tool_call_id?: string
  name?: string
}

const SYSTEM_PROMPT = `Ti je asistent i ProHygiene për krahasimin e çmimeve me konkurrentët.
Rregulla:
- Përdor vetëm rezultatet e mjeteve (search_competitor_products, compare_with_our_product).
- Mos hamendëso çmime. Nëse nuk ka të dhëna, thuaj që katalogu i konkurrentit nuk është i freskët dhe sugjero "Kontrollo tani" te faqja e konkurrentëve.
- Çdo çmim duhet të përfshijë emrin e konkurrentit, shumën, URL-në e produktit dhe kohën scraped_at.
- Përgjigju shkurt, në shqip, pa em dash.`

interface DeepSeekMessage {
  role: string
  content: string | null
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: { name: string; arguments: string }
  }>
  tool_call_id?: string
  name?: string
}

export async function runComparisonChat(userMessages: ChatMessage[]): Promise<string> {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    return 'API key për DeepSeek mungon. Shtoje DEEPSEEK_API_KEY në mjedisin e serverit.'
  }

  const settings = await getComparisonAiSettings()
  const messages: DeepSeekMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...userMessages.map(m => ({
      role: m.role,
      content: m.content,
      ...(m.tool_call_id ? { tool_call_id: m.tool_call_id } : {}),
      ...(m.name ? { name: m.name } : {}),
    })),
  ]

  for (let round = 0; round < 4; round++) {
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: settings.model,
        temperature: settings.temperature,
        messages,
        tools: COMPARISON_TOOL_DEFINITIONS,
      }),
    })

    const json = await res.json().catch(() => null)
    if (!res.ok) {
      const msg = json?.error?.message ?? `DeepSeek HTTP ${res.status}`
      throw new Error(msg)
    }

    const choice = json?.choices?.[0]?.message
    if (!choice) throw new Error('Përgjigje e zbrazët nga DeepSeek')

    messages.push(choice)

    const toolCalls = choice.tool_calls as DeepSeekMessage['tool_calls']
    if (toolCalls?.length) {
      for (const call of toolCalls) {
        let parsed: Record<string, unknown> = {}
        try {
          parsed = JSON.parse(call.function.arguments || '{}')
        } catch {
          parsed = {}
        }
        const result = await runComparisonTool(call.function.name, parsed)
        messages.push({
          role: 'tool',
          tool_call_id: call.id,
          name: call.function.name,
          content: JSON.stringify(result),
        })
      }
      continue
    }

    const text = choice.content?.trim()
    if (text) return text
    break
  }

  return 'Nuk munda të formoj përgjigjen. Provo pyetjen përsëri.'
}
