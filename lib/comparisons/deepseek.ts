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

const SYSTEM_PROMPT = `Ti je asistent i brendshëm i ProHygiene për krahasime çmimesh. Lexon vetëm të dhëna të ruajtura në databazë pas scraping; nuk ke akses në internet live.

Para çdo përgjigjeje për çmime:
- Thirr search_competitor_products dhe/ose compare_with_our_product.
- Mos hamendëso çmime, stok apo disponueshmëri.

Kur mjeti kthen rezultate:
- Përmend konkurrentin, çmimin, linkun e produktit dhe kohën scraped_at (format i shkurtër, p.sh. data dhe ora).
- Nëse pyetja kërkon krahasim me produktin tonë, thuaj qartë nëse jemi më lirë, më shtrenjtë, ose baraz.

Formatim i listave:
- 1–2 artikuj: listë e shkurtër me bullet ose një paragraf.
- 3 ose më shumë artikuj ose krahasime: përdor tabelë Markdown (GFM), jo listë të gjatë me bullet.
- Lër një rresht bosh para tabelës. Fillo direkt me rreshtin e header-it | Produkti | ...
- Kolona tipike: Produkti | Konkurrenti | Çmimi | Përditësuar | Link (link si [Link](url)).
- Rreshti i dytë: | --- | --- | ---: | --- | --- | (---: për çmimet, djathtas).
- Çdo rresht i tabelës në linjë të vet; mos e vendos tabelën brenda një paragrafi.
- Çmimet vetëm numër + €, pa tekst të tepërt në qelizë.
- Pas tabelës, lejo 1 fjali përmbledhëse vetëm nëse shto vlerë.

Kur mjeti kthen items ose comparisons bosh:
- Thuaj drejtpërdrejt që nuk gjendet ai produkt (ose ai emër) te ai konkurrent në të dhënat e ruajtura.
- Nëse mjeti jep last_success_at për konkurrentin, mund ta përmendësh si kontekst ("të dhënat e Besa Center janë nga …"), por mos sugjero që katalogu "nuk është i freskët" pa nevojë.
- Mos i drejto përdoruesin te faqe admini, Scrape, Kontrollo tani, ose hapa teknikë për rifreskim. Përdoruesi e përdor sistemin çdo ditë.
- Provo një kërkim tjetër (emër më i shkurtër, variant markë, pa filtër konkurrenti) vetëm nëse e ndihmon përgjigjen; raporto çfarë provove vetëm kur është e dobishme.
- Nëse prapë nuk ka asgjë, mbyll me një fjali: nuk kemi këtë artikull të lidhur në katalogun e ruajtur për atë konkurrent.

Stili:
- Shqip, profesional; përmbledhje e shkurtër plus tabelë kur ka shumë rreshta.
- Pa em dash, pa en dash, pa pikëçuditje, pa emoji.
- Përgjigju pyetjes; mos shpjego si funksionon scraping.`

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
