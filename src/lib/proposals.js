import { supabase } from './supabase'

export async function getProposals(userId) {
  const { data, error } = await supabase
    .from('proposals')
    .select('id, proposal_no, created_at, updated_at, data')
    .eq('user_id', userId)
    .order('proposal_no', { ascending: false })
  return { data, error }
}

export async function getProposal(id) {
  const { data, error } = await supabase
    .from('proposals')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function createProposal(userId, proposalData) {
  const { data, error } = await supabase
    .from('proposals')
    .insert({ user_id: userId, data: proposalData })
    .select()
    .single()
  return { data, error }
}

export async function updateProposal(id, proposalData) {
  const { data, error } = await supabase
    .from('proposals')
    .update({ data: proposalData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteProposal(id) {
  const { error } = await supabase.from('proposals').delete().eq('id', id)
  return { error }
}
