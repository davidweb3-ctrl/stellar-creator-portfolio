import { NextRequest, NextResponse } from 'next/server'
import {
  createApplication,
  getApplications,
  getApplicationById,
  updateApplicationStatus,
  withdrawApplication,
} from '@/lib/bounty-service'
import { applicationSchema, validateRequest, formatZodErrors } from '@/lib/validators'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const bountyId = searchParams.get('bountyId')
    const applicantId = searchParams.get('applicantId')
    const status = searchParams.get('status') as any

    // Users can only see their own applications unless they're looking at applications for their bounty
    const filters: any = {}
    if (bountyId) filters.bountyId = bountyId
    if (status) filters.status = status
    
    // If applicantId is specified and matches current user, allow it
    if (applicantId && applicantId === session.user.id) {
      filters.applicantId = applicantId
    } else if (!bountyId) {
      // Default to showing current user's applications
      filters.applicantId = session.user.id
    }

    const applications = await getApplications(filters)
    return NextResponse.json({ data: applications })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const validation = validateRequest(applicationSchema, body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: formatZodErrors(validation.errors) },
        { status: 400 }
      )
    }

    const application = await createApplication({
      ...validation.data,
      applicantId: session.user.id,
    })

    return NextResponse.json({ data: application }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const action = searchParams.get('action')

    if (!id || !action) {
      return NextResponse.json(
        { error: 'Missing id or action parameter' },
        { status: 400 }
      )
    }

    if (action === 'accept') {
      const application = await updateApplicationStatus(id, 'ACCEPTED', session.user.id)
      return NextResponse.json({ data: application })
    } else if (action === 'reject') {
      const application = await updateApplicationStatus(id, 'REJECTED', session.user.id)
      return NextResponse.json({ data: application })
    } else if (action === 'withdraw') {
      const application = await withdrawApplication(id, session.user.id)
      return NextResponse.json({ data: application })
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
