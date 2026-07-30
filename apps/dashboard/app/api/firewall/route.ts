import { NextRequest, NextResponse } from 'next/server'

const AGENT_API = process.env.AGENT_API_URL
const AGENT_TOKEN = process.env.AGENT_API_TOKEN

if (!AGENT_API) throw new Error('Missing AGENT_API_URL')
if (!AGENT_TOKEN) throw new Error('Missing AGENT_API_TOKEN')

function headers(): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${AGENT_TOKEN}`,
  }
}

export async function GET() {
  try {
    const res = await fetch(`${AGENT_API}/api/firewall/list`, {
      headers: headers(),
      cache: 'no-store',
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'Agent error' }, { status: 502 })
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Agent unreachable' }, { status: 502 })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, ...payload } = body

  if (!action || !['block', 'unblock'].includes(action)) {
    return NextResponse.json({ error: 'action must be "block" or "unblock"' }, { status: 400 })
  }

  try {
    const endpoint = action === 'block' ? 'block' : 'unblock'
    const res = await fetch(`${AGENT_API}/api/firewall/${endpoint}`, {
      method: 'POST',
      headers: headers(),
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      return NextResponse.json(
        { error: (err as Record<string, unknown>).error || 'Agent error' },
        { status: 502 },
      )
    }

    const data = await res.json()
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Agent unreachable' }, { status: 502 })
  }
}
