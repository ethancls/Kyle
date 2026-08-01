import { NextRequest, NextResponse } from 'next/server'
import { agentFetch, AgentError } from '@/lib/agent'

export async function GET() {
  try {
    const data = await agentFetch('/api/firewall/list')
    return NextResponse.json(data)
  } catch (err) {
    console.error('[api/firewall] list failed:', err)
    return NextResponse.json({ error: 'Agent unreachable' }, { status: 502 })
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action, ...payload } = body

  if (!action || !['block', 'unblock'].includes(action)) {
    return NextResponse.json(
      { error: 'action must be "block" or "unblock"' },
      { status: 400 },
    )
  }

  try {
    const endpoint = action === 'block' ? 'block' : 'unblock'
    const data = await agentFetch(`/api/firewall/${endpoint}`, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    return NextResponse.json(data)
  } catch (err) {
    const msg = err instanceof AgentError ? err.message : 'Agent unreachable'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
