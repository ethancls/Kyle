import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { agentFetch, AgentError } from '@/lib/agent'

export async function POST(req: NextRequest) {
  const { action, service } = await req.json()

  if (!action || !service) {
    return NextResponse.json({ error: 'action and service required' }, { status: 400 })
  }

  if (!['restart', 'stop', 'start'].includes(action)) {
    return NextResponse.json({ error: 'invalid action' }, { status: 400 })
  }

  try {
    await agentFetch(`/api/services/${action}`, {
      method: 'POST',
      body: JSON.stringify({ service }),
    })

    revalidatePath('/services', 'page')

    return NextResponse.json({ status: 'ok' })
  } catch (err) {
    const status = err instanceof AgentError ? 502 : 502
    return NextResponse.json({ error: 'Agent unreachable' }, { status })
  }
}
