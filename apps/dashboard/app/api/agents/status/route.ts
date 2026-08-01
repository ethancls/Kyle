import { NextResponse } from 'next/server'
import { agentFetch } from '@/lib/agent'

export async function GET() {
  try {
    const data = await agentFetch('/api/logs/status')
    return NextResponse.json(data)
  } catch (err) {
    console.error('[api/agents/status] agent unreachable:', err)
    return NextResponse.json({ status: 'unreachable' }, { status: 502 })
  }
}
