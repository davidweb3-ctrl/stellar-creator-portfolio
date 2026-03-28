import { NextRequest, NextResponse } from 'next/server'
import { getApplicationById } from '@/lib/bounty-service'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const application = await getApplicationById(params.id)
    return NextResponse.json({ data: application })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
