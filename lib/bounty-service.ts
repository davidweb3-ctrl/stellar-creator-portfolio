import { getSupabaseClient } from './db'
import { prisma } from './db'

export interface CreateApplicationInput {
  bountyId: string
  applicantId: string
  proposal: string
  proposedBudget: number
  timeline: number
}

export interface ApplicationFilters {
  bountyId?: string
  applicantId?: string
  status?: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN'
}

export async function createApplication(input: CreateApplicationInput) {
  const supabase = getSupabaseClient()

  // Check if user already applied
  const { data: existing } = await supabase
    .from('bounty_applications')
    .select('id')
    .eq('bounty_id', input.bountyId)
    .eq('applicant_id', input.applicantId)
    .single()

  if (existing) {
    throw new Error('You have already applied to this bounty')
  }

  // Check if bounty is still open
  const { data: bounty } = await supabase
    .from('bounties')
    .select('status')
    .eq('id', input.bountyId)
    .single()

  if (!bounty || bounty.status !== 'OPEN') {
    throw new Error('This bounty is no longer accepting applications')
  }

  const { data, error } = await supabase
    .from('bounty_applications')
    .insert({
      bounty_id: input.bountyId,
      applicant_id: input.applicantId,
      proposal: input.proposal,
      proposed_budget: input.proposedBudget,
      timeline: input.timeline,
      status: 'PENDING',
    })
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // Increment applicant count
  await supabase.rpc('increment_applicant_count', { bounty_id: input.bountyId })

  return data
}

export async function getApplications(filters: ApplicationFilters = {}) {
  const supabase = getSupabaseClient()

  let query = supabase
    .from('bounty_applications')
    .select(`
      *,
      bounty:bounties(*),
      applicant:users(id, name, email, image)
    `)

  if (filters.bountyId) {
    query = query.eq('bounty_id', filters.bountyId)
  }

  if (filters.applicantId) {
    query = query.eq('applicant_id', filters.applicantId)
  }

  if (filters.status) {
    query = query.eq('status', filters.status)
  }

  const { data, error } = await query.order('created_at', { ascending: false })

  if (error) {
    throw new Error(error.message)
  }

  return data || []
}

export async function getApplicationById(id: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('bounty_applications')
    .select(`
      *,
      bounty:bounties(*),
      applicant:users(id, name, email, image)
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function updateApplicationStatus(
  id: string,
  status: 'ACCEPTED' | 'REJECTED',
  userId: string
) {
  const supabase = getSupabaseClient()

  // Verify the user is the bounty creator
  const { data: application } = await supabase
    .from('bounty_applications')
    .select('bounty:bounties(creator_id)')
    .eq('id', id)
    .single()

  if (!application || application.bounty?.creator_id !== userId) {
    throw new Error('You are not authorized to update this application')
  }

  const { data, error } = await supabase
    .from('bounty_applications')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  // If accepted, update bounty status to IN_PROGRESS
  if (status === 'ACCEPTED') {
    const app = await getApplicationById(id)
    await supabase
      .from('bounties')
      .update({ status: 'IN_PROGRESS', updated_at: new Date().toISOString() })
      .eq('id', app.bounty_id)
  }

  return data
}

export async function withdrawApplication(id: string, userId: string) {
  const supabase = getSupabaseClient()

  const { data: application } = await supabase
    .from('bounty_applications')
    .select('applicant_id')
    .eq('id', id)
    .single()

  if (!application || application.applicant_id !== userId) {
    throw new Error('You are not authorized to withdraw this application')
  }

  const { data, error } = await supabase
    .from('bounty_applications')
    .update({ status: 'WITHDRAWN', updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getBountyById(id: string) {
  const supabase = getSupabaseClient()

  const { data, error } = await supabase
    .from('bounties')
    .select(`
      *,
      creator:users(id, name, email, image)
    `)
    .eq('id', id)
    .single()

  if (error) {
    throw new Error(error.message)
  }

  return data
}

export async function getBountyApplicationsCount(bountyId: string) {
  const supabase = getSupabaseClient()

  const { count, error } = await supabase
    .from('bounty_applications')
    .select('*', { count: 'exact', head: true })
    .eq('bounty_id', bountyId)
    .eq('status', 'PENDING')

  if (error) {
    throw new Error(error.message)
  }

  return count || 0
}
