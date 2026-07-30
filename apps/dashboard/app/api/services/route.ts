import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

const AGENT_API = process.env.AGENT_API_URL
const AGENT_TOKEN = process.env.AGENT_API_TOKEN

if (!AGENT_API) throw new Error('Missing AGENT_API_URL')
if (!AGENT_TOKEN) throw new Error('Missing AGENT_API_TOKEN')

function headers() {
  const h: Record<string, string> = { 'Content-Type': 'application/json' }
  if (AGENT_TOKEN) h.Authorization = `Bearer ${AGENT_TOKEN}`
  return h
}

export async function POST(req: NextRequest) {
  const { action, service } = await req.json()

  if (!action || !service) {
    return NextResponse.json({ error: 'action and service required' }, { status: 400 })
  }

  if (!['restart', 'stop', 'start'].includes(action)) {
    return NextResponse.json({ error: 'invalid action' }, { status: 400 })
  }

  try {
    const res = await fetch(`${AGENT_API}/api/services/${action}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify({ service }),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: (err as any).error || 'Agent error' },
        { status: 502 },
      )
    }

    revalidatePath('/services', 'page')

    return NextResponse.json({ status: 'ok' })
  } catch {
    return NextResponse.json({ error: 'Agent unreachable' }, { status: 502 })
  }
}
